import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askJson } from '../src/llm.js';

test('LLM deadline covers response body and action cancellation', async () => {
  const originalFetch = globalThis.fetch;
  const names = ['LLM_PROVIDER', 'LLM_API_KEY', 'LLM_MIN_GAP_MS', 'LLM_TRACE'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  Object.assign(process.env, { LLM_PROVIDER: 'openai', LLM_API_KEY: 'test-key', LLM_MIN_GAP_MS: '0', LLM_TRACE: '0' });
  try {
    // Headers arrive immediately, but the body never completes.
    globalThis.fetch = async (_url, { signal }) => new Response(new ReadableStream({
      start(controller) {
        if (signal.aborted) controller.error(signal.reason);
        else signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
      },
    }), { status: 200 });
    const began = Date.now();
    await assert.rejects(askJson({ name: 'timeout-test', system: 'JSON', user: 'test', timeoutMs: 50, maxRetry: 0 }), { code: 'LLM_TIMEOUT', status: 504 });
    assert.ok(Date.now() - began < 2000, 'must not wait indefinitely after headers');

    const controller = new AbortController();
    const cancellation = new Error('Action expired');
    const pending = askJson({ name: 'cancel-test', system: 'JSON', user: 'test', signal: controller.signal });
    setTimeout(() => controller.abort(cancellation), 50);
    await assert.rejects(pending, error => error === cancellation);

    globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }));
    assert.deepEqual(await askJson({ name: 'success-test', system: 'JSON', user: 'test' }), { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});

test('script writing uses its own deadline instead of the short research deadline', async () => {
  const { vietCau } = await import('../src/pipeline.js');
  const originalFetch = globalThis.fetch;
  const names = ['LLM_PROVIDER', 'LLM_API_KEY', 'LLM_MIN_GAP_MS', 'LLM_TIMEOUT_MS', 'LLM_GENERATE_TIMEOUT_MS', 'LLM_TRACE'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  Object.assign(process.env, { LLM_PROVIDER: 'openai', LLM_API_KEY: 'test-key', LLM_MIN_GAP_MS: '0', LLM_TIMEOUT_MS: '10', LLM_GENERATE_TIMEOUT_MS: '200', LLM_TRACE: '0' });
  let outputBudget;
  try {
    globalThis.fetch = async (_url, { signal, body }) => {
      outputBudget = JSON.parse(body).max_tokens;
      return new Response(new ReadableStream({
        start(controller) {
          const timer = setTimeout(() => {
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ facts: [], cau: [{ loi: 'Bản nháp đã viết xong.', fact_ids: [] }] }) } }] })));
            controller.close();
          }, 50);
          signal.addEventListener('abort', () => { clearTimeout(timer); controller.error(signal.reason); }, { once: true });
        },
      }));
    };
    const result = await vietCau({ chu_de: 'Deep learning', muc_tieu: 'Hiểu DL', nguoi_hoc: 'Sinh viên', so_cau: 25, nguonList: [] });
    assert.equal(result.cau[0].loi, 'Bản nháp đã viết xong.');
    assert.ok(outputBudget > 4096, 'budget must fit both 25 sentences and source evidence');
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});
