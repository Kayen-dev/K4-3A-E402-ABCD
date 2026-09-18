import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSuitableLesson, clearlyInappropriate } from '../src/content-policy.js';

test('blocks explicit vulgar input in any lesson field before calling model', async () => {
  for (const field of ['topic', 'goal', 'audience']) {
    await assert.rejects(assertSuitableLesson({ [field]: 'địt mẹ' }, { config: { provider: 'stub' } }), { code: 'INAPPROPRIATE_CONTENT' });
  }
});

test('preserves education and ordinary accented Vietnamese words', () => {
  for (const topic of ['Các động vật lớn', 'Chăn nuôi lợn', 'Giáo dục giới tính', 'Phòng chống nội dung khiêu dâm']) {
    assert.equal(clearlyInappropriate({ topic }), false);
  }
});

test('contextual classification rejects inappropriate requests and receives all fields', async () => {
  const brief = { topic: 'Nội dung', goal: 'Mục tiêu', audience: 'Người học' };
  await assert.rejects(assertSuitableLesson(brief, {
    config: { provider: 'configured', key: 'test' },
    classify: async prompt => {
      assert.deepEqual(JSON.parse(prompt.user), brief);
      return { allowed: false };
    },
  }), { code: 'INAPPROPRIATE_CONTENT' });
});

test('classifier failure is distinguishable from inappropriate content', async () => {
  await assert.rejects(assertSuitableLesson({ topic: 'Toán học' }, {
    config: { provider: 'configured', key: 'test' }, classify: async () => ({}),
  }), { code: 'CONTENT_CHECK_UNAVAILABLE' });
});

test('allows sensitive educational topics after contextual classification', async () => {
  await assertSuitableLesson({ topic: 'Giáo dục giới tính', goal: 'Hiểu sức khỏe sinh sản', audience: 'Sinh viên' }, {
    config: { provider: 'configured', key: 'test' }, classify: async () => ({ allowed: true }),
  });
});
