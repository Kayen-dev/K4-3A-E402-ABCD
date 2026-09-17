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
async function blob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw Object.assign(new Error('Chưa cấu hình lưu trữ bền vững'), { status: 503, code: 'STORAGE_NOT_CONFIGURED' });
  return import('@vercel/blob');
}
function storageError(e) {
  if (e?.name === 'BlobPreconditionFailedError' || e?.name === 'BlobAlreadyExistsError') return Object.assign(new Error('Phiên đã thay đổi. Tải lại rồi thử tiếp.'), { status: 409, code: 'STORAGE_CONFLICT' });
  return e;
}
export async function readProject(id) {
  if (!blobMode()) return JSON.parse(await readFile(join(DIR, `${id}.json`), 'utf8'));
  const { get } = await blob();
  const result = await get(pathname(id), { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200) throw Object.assign(new Error('Không tìm thấy phiên'), { code: 'ENOENT' });
  const project = JSON.parse(await new Response(result.stream).text());
  etags.set(project, result.blob.etag);
  return project;
}
export async function writeProject(project) {
  if (!blobMode()) {
    await mkdir(DIR, { recursive: true });
    const path = join(DIR, `${project.id}.json`), temp = `${path}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(project, null, 2), { flag: 'wx' });
    await rename(temp, path); return;
  }
  const { put } = await blob();
  const etag = etags.get(project);
  try {
    const result = await put(pathname(project.id), JSON.stringify(project), {
      access: 'private', contentType: 'application/json',
      ...(etag ? { allowOverwrite: true, ifMatch: etag } : {}),
    });
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
  const { get } = await blob();
  const result = await get(feedbackPath(id), { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200) throw Object.assign(new Error('Không tìm thấy góp ý'), { code: 'ENOENT' });
  const feedback = JSON.parse(await new Response(result.stream).text());
  etags.set(feedback, result.blob.etag);
  return feedback;
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
  const etag = etags.get(feedback);
  try {
    const result = await put(feedbackPath(feedback.id), JSON.stringify(feedback), {
      access: 'private', contentType: 'application/json',
      ...(etag ? { allowOverwrite: true, ifMatch: etag } : {}),
    });
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
