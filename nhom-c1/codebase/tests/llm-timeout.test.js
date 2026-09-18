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
    await assert.rejects(askJson({ name: 'timeout-test', system: 'JSON', user: 'test', timeoutMs: 50, maxRetry: 0 }));
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
