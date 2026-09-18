import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('manual correction, final approval, and subsequent edits respect revision state', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'scriptscout-decisions-'));
  const previousDir = process.env.PROJECTS_DIR;
  process.env.PROJECTS_DIR = directory;
  const { createProject, actionProject } = await import('../src/projects.js');
  const { writeProject } = await import('../src/storage.js');
  try {
    let p = await createProject({ mode: 'qa', script: 'Nội dung cũ.' });
    p.reviewStatus = 'complete';
    p.findings = [{ id: 'f1', sentenceId: p.sentences[0].id, category: 'register', severity: 'cao', quote: null, originalSentence: 'Nội dung cũ.', replacement: null, decision: null }];
    await writeProject(p);
    await assert.rejects(actionProject(p.id, { action: 'decision', revision: p.revision, target: 'project', decision: 'approve' }), { code: 'BLOCKING_FINDINGS' });
    p = await actionProject(p.id, { action: 'decision', revision: p.revision, findingId: 'f1', decision: 'accept', replacement: 'Nội dung đã sửa.' });
    assert.equal(p.sentences[0].text, 'Nội dung đã sửa.');
    p = await actionProject(p.id, { action: 'decision', revision: p.revision, target: 'project', decision: 'approve' });
    assert.equal(p.approvedRevision, p.revision);
    p = await actionProject(p.id, { action: 'edit-sentence', revision: p.revision, sentenceId: p.sentences[0].id, text: 'Thay đổi sau chốt.' });
    assert.equal(p.approvedRevision, null);
  } finally {
    if (previousDir === undefined) delete process.env.PROJECTS_DIR; else process.env.PROJECTS_DIR = previousDir;
    await rm(directory, { recursive: true, force: true });
  }
});
