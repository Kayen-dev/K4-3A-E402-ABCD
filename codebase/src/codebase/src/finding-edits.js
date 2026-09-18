const stale = () => Object.assign(new Error('Đoạn góp ý đã thay đổi hoặc chồng lên sửa khác. Hãy rà soát lại câu.'), { status: 409, code: 'STALE_FINDING' });

function locate(text, expected, start) {
  if (Number.isInteger(start) && text.slice(start, start + expected.length) === expected) return start;
  const offset = text.indexOf(expected);
  if (offset < 0 || text.indexOf(expected, offset + 1) >= 0) throw stale();
  return offset;
}

function splice(project, sentence, finding, start, oldText, newText) {
  const end = start + oldText.length;
  const next = sentence.text.slice(0, start) + newText + sentence.text.slice(end);
  if (next.length > 2000) throw Object.assign(new Error('Câu sau khi sửa tối đa 2.000 ký tự'), { status: 400, code: 'INVALID_REPLACEMENT' });
  const delta = newText.length - oldText.length;
  for (const other of project.findings) {
    if (other.id === finding.id || other.sentenceId !== sentence.id) continue;
    const span = other.appliedEdit || other;
    if (!Number.isInteger(span.start) || !Number.isInteger(span.end)) continue;
    if (span.start >= end) {
      span.start += delta; span.end += delta;
      if (other.appliedEdit) { other.start = span.start; other.end = span.end; }
    } else if (span.end > start) other.stale = true;
  }
  sentence.text = next;
  finding.start = start; finding.end = start + newText.length;
  project.reviewStatus = 'stale';
}

export function acceptFinding(project, sentence, finding, input) {
  if (finding.stale) throw stale();
  const oldText = finding.quote || sentence.text;
  if (!finding.quote && sentence.text !== finding.originalSentence) throw stale();
  const start = finding.quote ? locate(sentence.text, oldText, finding.start) : 0;
  let replacement = input;
  const prefix = sentence.text.slice(0, start), suffix = sentence.text.slice(start + oldText.length);
  // If the agent supplied a full sentence, extract only the changed span when
  // its surrounding text matches. Never insert that whole sentence into a word.
  if (finding.quote && (prefix || suffix) && replacement.startsWith(prefix) && replacement.endsWith(suffix)
      && replacement.length >= prefix.length + suffix.length) {
    replacement = replacement.slice(prefix.length, replacement.length - suffix.length);
  }
  if (!replacement.trim()) throw Object.assign(new Error('Nhập nội dung thay thế cho đoạn được đánh dấu'), { status: 400, code: 'INVALID_REPLACEMENT' });
  finding.previousText = sentence.text;
  splice(project, sentence, finding, start, oldText, replacement);
  finding.appliedEdit = { start, end: start + replacement.length, oldText, newText: replacement };
  finding.replacement = replacement;
  finding.decision = 'accepted';
}

export function undoFinding(project, sentence, finding) {
  if (finding.decision === 'accepted') {
    if (finding.stale) throw stale();
    const edit = finding.appliedEdit || { oldText: finding.quote || finding.previousText, newText: finding.replacement, start: finding.start };
    if (!edit.oldText || !edit.newText) throw stale();
    const start = locate(sentence.text, edit.newText, edit.start);
    splice(project, sentence, finding, start, edit.newText, edit.oldText);
  }
  finding.decision = null; finding.previousText = null; finding.appliedEdit = null;
  project.reviewStatus = 'stale';
}
