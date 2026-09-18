import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectSourceContext } from '../src/source-context.js';

test('long articles retain relevant content from the end, within budget', () => {
  const relevant = 'Deep learning sử dụng mạng nơ ron để học biểu diễn dữ liệu.';
  const source = { snapshot: 'Thông tin giới thiệu chung. '.repeat(500) + relevant.repeat(30), trich_dan: [] };
  const content = selectSourceContext(source, { topic: 'Deep learning', goal: 'Hiểu mạng nơ ron', budget: 2000 });
  assert.ok(content.length <= 2000);
  assert.ok(content.includes(relevant));
  for (const span of content.split('\n\n[...]\n\n')) assert.ok(source.snapshot.includes(span));
});

test('short articles are unchanged and original evidence survives truncation', () => {
  assert.equal(selectSourceContext({ snapshot: 'Bài viết ngắn.' }), 'Bài viết ngắn.');
  const quote = 'Đây là đoạn bằng chứng nguyên văn cần giữ lại để đối chiếu.';
  const source = { snapshot: 'Mở đầu. '.repeat(2000) + quote + ' Kết thúc.'.repeat(1000), trich_dan: [quote] };
  const content = selectSourceContext(source, { budget: 1500 });
  assert.ok(content.includes(quote));
  assert.ok(content.length <= 1500);
  assert.ok(source.snapshot.length > 1500);
});
