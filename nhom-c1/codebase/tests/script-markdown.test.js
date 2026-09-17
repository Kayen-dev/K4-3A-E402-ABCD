import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseScriptMarkdown } from '../src/script-markdown.js';

test('separates exported narration and context', () => {
  const result = parseScriptMarkdown('# Bài học\n\n## Cảnh 1\n\nLời đọc: Câu đầu.\n\n## Cảnh 2\n\nLời đọc: Câu sau.\n\n## Ngữ cảnh\n\nChủ đề: Trò chơi\nLink tham khảo: https://example.com');
  assert.equal(result.script, 'Câu đầu.\nCâu sau.');
  assert.match(result.context, /Chủ đề: Trò chơi/);
});

test('does not review legacy visual and source metadata as narration', () => {
  const result = parseScriptMarkdown('# Bài học\n## Cảnh 1\nLời đọc: Nội dung cần đọc.\n\nGợi ý hình: Màn hình mở đầu\nNguồn: Chưa kiểm chứng');
  assert.equal(result.script, 'Nội dung cần đọc.');
});

test('keeps plain narration and multi-line markdown narration', () => {
  assert.equal(parseScriptMarkdown('Câu một.\nCâu hai.').script, 'Câu một.\nCâu hai.');
  assert.equal(parseScriptMarkdown('## Cảnh 1\nLời đọc: Dòng một.\nDòng hai.\n\n## Ngữ cảnh\nMục tiêu: Hiểu bài').script, 'Dòng một.\nDòng hai.');
});
