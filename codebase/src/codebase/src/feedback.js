import { randomUUID } from 'node:crypto';
import { readFeedback, writeFeedback, listFeedbackIds, removeFeedback } from './storage.js';

const locks = new Map();
const validId = id => typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
const fault = (status, code, message) => Object.assign(new Error(message), { status, code });
const now = () => new Date().toISOString();

async function locked(id, fn) {
  const previous = locks.get(id) || Promise.resolve();
  let release;
  const current = new Promise(resolve => { release = resolve; });
  locks.set(id, current);
  await previous;
  try { return await fn(); } finally { release(); if (locks.get(id) === current) locks.delete(id); }
}

async function get(id) {
  if (!validId(id)) throw fault(400, 'INVALID_ID', 'Mã góp ý không hợp lệ');
  try { return await readFeedback(id); }
  catch (e) { if (e.code === 'ENOENT') throw fault(404, 'NOT_FOUND', 'Không tìm thấy góp ý'); throw e; }
}

function fields(input) {
  const title = String(input?.title || '').trim();
  const content = String(input?.content || '').trim();
  if (!title || title.length > 120 || !content || content.length > 2000) {
    throw fault(400, 'INVALID_FEEDBACK', 'Nhập tiêu đề tối đa 120 ký tự và nội dung tối đa 2.000 ký tự');
  }
  return { title, content };
}

export async function listFeedback(user) {
  const ids = await listFeedbackIds();
  const rows = await Promise.all(ids.map(id => get(id).catch(() => null)));
  return rows.filter(row => row && (user.role === 'teacher' || row.authorEmail === user.email))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function clearAllFeedback(user) {
  if (user.role !== 'teacher') throw fault(403, 'FORBIDDEN', 'Chỉ giảng viên có thể xóa toàn bộ góp ý');
  const ids = await listFeedbackIds();
  await Promise.all(ids.map(id => removeFeedback(id)));
  return { deleted: ids.length, remaining: (await listFeedbackIds()).length };
}

export async function createFeedback(user, input) {
  if (user.role !== 'student') throw fault(403, 'FORBIDDEN', 'Chỉ học sinh có thể gửi góp ý');
  const feedback = { id: randomUUID(), ...fields(input), authorEmail: user.email, authorName: user.fullName, authorStudentId: user.studentId,
    status: 'pending', createdAt: now(), updatedAt: now(), reviewedAt: null, reviewedBy: null };
  await writeFeedback(feedback);
  return feedback;
}

export async function updateFeedback(user, id, input) {
  if (user.role !== 'student') throw fault(403, 'FORBIDDEN', 'Chỉ học sinh có thể sửa góp ý');
  return locked(id, async () => {
    const feedback = await get(id);
    if (feedback.authorEmail !== user.email) throw fault(403, 'FORBIDDEN', 'Bạn chỉ có thể sửa góp ý của mình');
    Object.assign(feedback, fields(input), { status: 'pending', updatedAt: now(), reviewedAt: null, reviewedBy: null });
    await writeFeedback(feedback);
    return feedback;
  });
}

export async function deleteFeedback(user, id) {
  if (user.role !== 'student') throw fault(403, 'FORBIDDEN', 'Chỉ học sinh có thể xóa góp ý');
  return locked(id, async () => {
    const feedback = await get(id);
    if (feedback.authorEmail !== user.email) throw fault(403, 'FORBIDDEN', 'Bạn chỉ có thể xóa góp ý của mình');
    await removeFeedback(id);
    return { deleted: true };
  });
}

export async function decideFeedback(user, id, decision) {
  if (user.role !== 'teacher') throw fault(403, 'FORBIDDEN', 'Chỉ giảng viên có thể duyệt góp ý');
  if (!['approved', 'rejected'].includes(decision)) throw fault(400, 'INVALID_DECISION', 'Quyết định không hợp lệ');
  return locked(id, async () => {
    const feedback = await get(id);
    feedback.status = decision;
    feedback.updatedAt = now();
    feedback.reviewedAt = feedback.updatedAt;
    feedback.reviewedBy = user.email;
    await writeFeedback(feedback);
    return feedback;
  });
}

export async function approvedFeedbackForReview() {
  const rows = await listFeedback({ role: 'teacher' });
  return rows.filter(row => row.status === 'approved')
    .map(row => ({ id: row.id, title: row.title, content: row.content }));
}
