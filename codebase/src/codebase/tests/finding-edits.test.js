import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptFinding, undoFinding } from '../src/finding-edits.js';

function setup() {
  const sentence = { id: 'c12', scene: 12, text: 'Dùng JAX để chạy trên GPU và học sâu.' };
  const findings = ['JAX', 'GPU'].map((quote, index) => ({ id: `f${index}`, sentenceId: sentence.id, quote, start: sentence.text.indexOf(quote), end: sentence.text.indexOf(quote) + quote.length, originalSentence: sentence.text }));
  return { sentence, findings, project: { findings } };
}

test('two edits in one sentence and undo preserve each other', () => {
  const { sentence, findings, project } = setup();
  acceptFinding(project, sentence, findings[0], 'giắc');
  acceptFinding(project, sentence, findings[1], 'bộ xử lý đồ họa');
  assert.equal(sentence.text, 'Dùng giắc để chạy trên bộ xử lý đồ họa và học sâu.');
  undoFinding(project, sentence, findings[0]);
  assert.equal(sentence.text, 'Dùng JAX để chạy trên bộ xử lý đồ họa và học sâu.');
  undoFinding(project, sentence, findings[1]);
  assert.equal(sentence.text, 'Dùng JAX để chạy trên GPU và học sâu.');
});

test('full sentence replacement supplied for a quote is narrowed to its actual change', () => {
  const { sentence, findings, project } = setup();
  acceptFinding(project, sentence, findings[0], 'Dùng giắc để chạy trên GPU và học sâu.');
  assert.equal(sentence.text, 'Dùng giắc để chạy trên GPU và học sâu.');
  assert.equal(findings[0].replacement, 'giắc');
  acceptFinding(project, sentence, findings[1], 'bộ xử lý đồ họa');
  assert.equal(sentence.text, 'Dùng giắc để chạy trên bộ xử lý đồ họa và học sâu.');
});

test('overlapping proposals cannot silently overwrite accepted edits', () => {
  const { sentence, findings, project } = setup();
  findings.push({ ...findings[0], id: 'overlap' });
  acceptFinding(project, sentence, findings[0], 'giắc');
  assert.throws(() => acceptFinding(project, sentence, findings[2], 'J A X'), { code: 'STALE_FINDING' });
});

test('repeated quotes are edited at their recorded location', () => {
  const sentence = { id: 'c1', text: 'GPU và GPU' };
  const finding = { id: 'f1', sentenceId: 'c1', quote: 'GPU', start: 7, end: 10 };
  const project = { findings: [finding] };
  acceptFinding(project, sentence, finding, 'bộ xử lý');
  assert.equal(sentence.text, 'GPU và bộ xử lý');
});
