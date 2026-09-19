import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = process.env.PROJECTS_DIR || join(ROOT, 'runtime', 'projects');
const FEEDBACK_DIR = process.env.FEEDBACK_DIR || (process.env.PROJECTS_DIR ? join(DIR, 'feedback') : join(ROOT, 'runtime', 'feedback'));
const etags = new WeakMap();
const blobMode = () => !!process.env.VERCEL;
const pathname = id => `projects/${id}.json`;
const feedbackPath = id => `feedback/${id}.json`;
const studentsFile = () => process.env.STUDENTS_FILE || join(ROOT, 'runtime', 'students.json');
export async function readStudents() {
  try {
    if (blobMode()) return await readBlobJson('accounts/students.json', 'Missing students');
    return JSON.parse(await readFile(studentsFile(), 'utf8'));
  } catch (e) { if (e.code === 'ENOENT') return { students: [] }; throw e; }
}
export async function writeStudents(registry) {
  if (blobMode()) {
    const { put } = await blob();
    try { await put('accounts/students.json', JSON.stringify(registry), conditionalBlobOptions(registry)); }
    catch (e) { throw storageError(e); }
    return;
  }
  const path = studentsFile();
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(registry), { flag: 'wx' });
  await rename(temp, path);
}
async function blob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw Object.assign(new Error('Chưa cấu hình lưu trữ bền vững'), { status: 503, code: 'STORAGE_NOT_CONFIGURED' });
  return import('@vercel/blob');
}
export function storageError(e) {
  const type = e?.constructor?.name || e?.name;
  if (['BlobPreconditionFailedError', 'BlobAlreadyExistsError'].includes(type) || ['BlobPreconditionFailedError', 'BlobAlreadyExistsError'].includes(e?.name)) return Object.assign(new Error('Phiên đã thay đổi. Tải lại rồi thử tiếp.'), { status: 409, code: 'STORAGE_CONFLICT' });
  return e;
}
export function conditionalBlobOptions(value) {
  const etag = etags.get(value);
  return { access: 'private', contentType: 'application/json', addRandomSuffix: false,
    ...(etag ? { allowOverwrite: true, ifMatch: etag } : {}) };
}
export async function readBlobJson(path, missingMessage, sdk) {
  const { get, head } = sdk || await blob();
  try {
    // Use storage metadata for conditional writes, rather than a delivery ETag.
    const before = await head(path);
    const result = await get(path, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200) throw Object.assign(new Error(missingMessage), { code: 'ENOENT' });
    const value = JSON.parse(await new Response(result.stream).text());
    const after = await head(path);
    if (!before.etag || before.etag !== after.etag) throw Object.assign(new Error('Phiên đã thay đổi trong lúc đọc. Vui lòng tải lại.'), { status: 409, code: 'STORAGE_CONFLICT' });
    etags.set(value, before.etag);
    return value;
  } catch (e) {
    if (e?.constructor?.name === 'BlobNotFoundError') throw Object.assign(new Error(missingMessage), { code: 'ENOENT' });
    throw storageError(e);
  }
}
export async function readProject(id) {
  if (!blobMode()) return JSON.parse(await readFile(join(DIR, `${id}.json`), 'utf8'));
  return readBlobJson(pathname(id), 'Không tìm thấy phiên');
}
export async function writeProject(project) {
  if (!blobMode()) {
    await mkdir(DIR, { recursive: true });
    const path = join(DIR, `${project.id}.json`), temp = `${path}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(project, null, 2), { flag: 'wx' });
    await rename(temp, path); return;
  }
  const { put } = await blob();
  try {
    const result = await put(pathname(project.id), JSON.stringify(project), conditionalBlobOptions(project));
    etags.set(project, result.etag);
  } catch (e) { throw storageError(e); }
}
export async function listProjectIds() {
  if (!blobMode()) {
    await mkdir(DIR, { recursive: true });
    return (await readdir(DIR)).filter(n => /^[a-f0-9-]{36}\.json$/.test(n)).map(n => n.slice(0, -5));
  }
  const { list } = await blob();
  const ids = []; let cursor;
  do {
    const page = await list({ prefix: 'projects/', limit: 1000, cursor });
    ids.push(...page.blobs.map(x => x.pathname.match(/^projects\/([a-f0-9-]{36})\.json$/)?.[1]).filter(Boolean));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return ids;
}
export async function removeProject(id) {
  if (!blobMode()) return rm(join(DIR, `${id}.json`), { force: true });
  const { del } = await blob();
  await del(pathname(id));
}

export async function readFeedback(id) {
  if (!blobMode()) return JSON.parse(await readFile(join(FEEDBACK_DIR, `${id}.json`), 'utf8'));
  return readBlobJson(feedbackPath(id), 'Không tìm thấy góp ý');
}

export async function writeFeedback(feedback) {
  if (!blobMode()) {
    const dir = FEEDBACK_DIR;
    await mkdir(dir, { recursive: true });
    const path = join(dir, `${feedback.id}.json`), temp = `${path}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(feedback, null, 2), { flag: 'wx' });
    await rename(temp, path); return;
  }
  const { put } = await blob();
  try {
    const result = await put(feedbackPath(feedback.id), JSON.stringify(feedback), conditionalBlobOptions(feedback));
    etags.set(feedback, result.etag);
  } catch (e) { throw storageError(e); }
}

export async function listFeedbackIds() {
  if (!blobMode()) {
    const dir = FEEDBACK_DIR;
    await mkdir(dir, { recursive: true });
    return (await readdir(dir)).filter(n => /^[a-f0-9-]{36}\.json$/.test(n)).map(n => n.slice(0, -5));
  }
  const { list } = await blob();
  const ids = []; let cursor;
  do {
    const page = await list({ prefix: 'feedback/', limit: 1000, cursor });
    ids.push(...page.blobs.map(x => x.pathname.match(/^feedback\/([a-f0-9-]{36})\.json$/)?.[1]).filter(Boolean));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return ids;
}

export async function removeFeedback(id) {
  if (!blobMode()) return rm(join(FEEDBACK_DIR, `${id}.json`), { force: true });
  const { del } = await blob();
  await del(feedbackPath(id));
}

export async function removeAllFeedback(ids) {
  if (!ids.length) return;
  if (!blobMode()) {
    for (const id of ids) await rm(join(FEEDBACK_DIR, `${id}.json`), { force: true });
    return;
  }
  const { del } = await blob();
  // One Blob API call avoids rate limiting caused by hundreds of parallel deletes.
  await del(ids.map(feedbackPath));
}
