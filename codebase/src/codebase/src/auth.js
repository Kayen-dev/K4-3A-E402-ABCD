import { createHmac, randomBytes, timingSafeEqual, scrypt, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { readStudents, writeStudents } from './storage.js';
const derive = promisify(scrypt);
const publicStudent = s => ({ id: s.id, email: s.email, role: 'student', fullName: s.fullName, studentId: s.studentId });
let registrations = Promise.resolve();
export async function registerStudent(input) {
  if (!secret) throw fail(503, 'AUTH_NOT_CONFIGURED', 'Chưa cấu hình AUTH_SESSION_SECRET');
  const email = String(input?.email || '').trim().toLowerCase();
  const fullName = String(input?.fullName || '').trim().replace(/\s+/g, ' ');
  const studentId = String(input?.studentId || '').trim().toUpperCase();
  const password = String(input?.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || fullName.length < 2 || fullName.length > 100 || !/^[\p{L}\p{M} .'-]+$/u.test(fullName) || !/^[A-Z0-9-]{5,30}$/.test(studentId) || password.length < 8 || password.length > 128) {
    throw fail(400, 'INVALID_REGISTRATION', 'Nhập họ tên hợp lệ, MSSV 5–30 ký tự chữ/số, email và mật khẩu 8–128 ký tự');
  }
  const previous = registrations;
  let release;
  registrations = new Promise(resolve => { release = resolve; });
  await previous;
  try {
    const salt = randomBytes(16).toString('hex');
    const passwordHash = (await derive(password, salt, 64)).toString('hex');
    const account = { id: randomUUID(), email, fullName, studentId, salt, passwordHash, createdAt: new Date().toISOString() };
    for (let attempt = 0; attempt < 3; attempt++) {
      const registry = await readStudents();
      if (registry.students.some(s => s.email === email || s.studentId === studentId) || email === DEMO.teacher.email.toLowerCase()) throw fail(409, 'ACCOUNT_EXISTS', 'Email hoặc MSSV đã được sử dụng');
      registry.students.push(account);
      try { await writeStudents(registry); return publicStudent(account); }
      catch (e) { if (e.code !== 'STORAGE_CONFLICT' || attempt === 2) throw e; }
    }
  } finally { release(); }
}

const DEMO = {
  teacher: { email: process.env.TEACHER_EMAIL || 'giangvien@gmail.com', password: process.env.TEACHER_PASSWORD || 'GiangVien@2026' },
};
const secret = process.env.AUTH_SESSION_SECRET || (process.env.VERCEL ? null : randomBytes(32).toString('hex'));
const maxAge = 7 * 24 * 60 * 60;
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const sign = value => createHmac('sha256', secret).update(value).digest('base64url');

export async function login(email, password, role) {
  if (!secret) throw fail(503, 'AUTH_NOT_CONFIGURED', 'Chưa cấu hình AUTH_SESSION_SECRET');
  if (role === 'student') {
    const registry = await readStudents();
    const account = registry.students.find(s => s.email === String(email || '').trim().toLowerCase());
    const supplied = String(password || '');
    if (supplied.length > 128) throw fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
    const hash = await derive(supplied, account?.salt || 'missing-account', 64);
    if (!account || !timingSafeEqual(hash, Buffer.from(account.passwordHash, 'hex'))) throw fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng. Học sinh cần đăng ký tài khoản trước.');
    return publicStudent(account);
  }
  const account = DEMO[role];
  const supplied = Buffer.from(String(password || ''));
  const expected = Buffer.from(account?.password || '');
  if (!account || String(email || '').trim().toLowerCase() !== account.email.toLowerCase() || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
  }
  return { email: account.email, role };
}

export function sessionCookie(user, secure = false) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + maxAge * 1000 })).toString('base64url');
  return `scriptscout_session=${payload}.${sign(payload)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie(secure = false) {
  return `scriptscout_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function currentUser(req) {
  if (!secret) return null;
  const raw = /(?:^|;\s*)scriptscout_session=([^;]+)/.exec(req.headers.cookie || '')?.[1];
  if (!raw) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isFinite(user.exp) || user.exp <= Date.now() || !['teacher', 'student'].includes(user.role)) return null;
    if (user.role === 'teacher' && user.email !== DEMO.teacher.email) return null;
    if (user.role === 'student' && (!user.id || !user.studentId || !user.fullName)) return null;
    return { email: user.email, role: user.role, ...(user.role === 'student' ? { id: user.id, fullName: user.fullName, studentId: user.studentId } : {}) };
  } catch { return null; }
}

export function requireRole(req, role) {
  const user = currentUser(req);
  if (!user) throw fail(401, 'LOGIN_REQUIRED', 'Vui lòng đăng nhập');
  if (role && user.role !== role) throw fail(403, 'FORBIDDEN', 'Tài khoản này không có quyền thực hiện');
  return user;
}
