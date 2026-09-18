// Separate narration from Markdown metadata before reviewing individual lines.
export function parseScriptMarkdown(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const contextMatch = /^##\s+(?:Ngữ cảnh|Context)\s*$/im.exec(normalized);
  const context = contextMatch ? normalized.slice(contextMatch.index + contextMatch[0].length).trim() : '';
  const body = contextMatch ? normalized.slice(0, contextMatch.index) : normalized;
  const narration = [...body.matchAll(/^\s*(?:\*\*)?Lời đọc(?:\*\*)?\s*:\s*(.+(?:\n(?!\s*(?:#|Lời đọc\s*:|Gợi ý hình\s*:|Nguồn\s*:|Media tham khảo|$)).+)*)/gm)];
  const script = narration.length
    ? narration.map(match => match[1].trim()).join('\n')
    : body.split('\n').filter(line => !/^\s*(?:#{1,6}\s|Gợi ý hình\s*:|Nguồn\s*:|Media tham khảo|Bản đã duyệt|Bản nháp|Rà soát:|Phiên bản:)/.test(line)).join('\n').trim();
  return { script, context };
}
