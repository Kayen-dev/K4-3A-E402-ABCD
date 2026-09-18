import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canUseSource } from '../src/source-policy.js';

test('teacher may select rejected articles with content despite author or relevance scores', () => {
  for (const scores of [[0, 1, 0, 1, 1], [1, 1, 0, 0, 1], undefined]) {
    assert.equal(canUseSource({ trang_thai: 'loai', diem_tieu_chi: scores, snapshot: 'Nội dung tài liệu.', cach_ly: [] }), true);
  }
  assert.equal(canUseSource({ trang_thai: 'loai', snapshot: '   ' }), false);
  assert.equal(canUseSource({ trang_thai: 'loai', snapshot: 'Nội dung', diem_tieu_chi: [1, 1, 1, 1, 0] }), false);
  assert.equal(canUseSource({ trang_thai: 'loai', snapshot: 'Nội dung', cach_ly: ['Chỉ thị đã cách ly'] }), false);
});
