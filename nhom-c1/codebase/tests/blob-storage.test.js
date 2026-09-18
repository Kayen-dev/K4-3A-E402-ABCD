import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlobPreconditionFailedError } from '@vercel/blob';
import { readBlobJson, conditionalBlobOptions, storageError } from '../src/storage.js';

test('private Blob updates use canonical metadata ETag instead of delivery ETag', async () => {
  for (const path of ['projects/test.json', 'feedback/test.json']) {
    const value = await readBlobJson(path, 'Missing', {
      head: async received => { assert.equal(received, path); return { etag: 'storage-etag' }; },
      get: async (_, options) => {
        assert.equal(options.useCache, false);
        return { statusCode: 200, stream: Response.json({ id: 'test' }).body, blob: { etag: 'delivery-etag' } };
      },
    });
    assert.deepEqual(conditionalBlobOptions(value), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, ifMatch: 'storage-etag' });
  }
});

test('concurrent updates during read are refused', async () => {
  let count = 0;
  await assert.rejects(readBlobJson('projects/test.json', 'Missing', {
    head: async () => ({ etag: ++count === 1 ? 'old' : 'new' }),
    get: async () => ({ statusCode: 200, stream: Response.json({}).body }),
  }), { status: 409, code: 'STORAGE_CONFLICT' });
});

test('actual SDK precondition error is returned as 409 even when name is Error', () => {
  const original = new BlobPreconditionFailedError();
  const result = storageError(original);
  assert.equal(result.status, 409);
  assert.equal(result.code, 'STORAGE_CONFLICT');
});
