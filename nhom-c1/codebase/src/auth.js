import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const DEMO = {
  teacher: { email: process.env.TEACHER_EMAIL || 'giangvien@gmail.com', password: process.env.TEACHER_PASSWORD || 'GiangVien@2026' },
  student: { email: process.env.STUDENT_EMAIL || 'hocsinh@gmail.com', password: process.env.STUDENT_PASSWORD || 'HocSinh@2026' },
};
const secret = process.env.AUTH_SESSION_SECRET || (process.env.VERCEL ? null : randomBytes(32).toString('hex'));
const maxAge = 7 * 24 * 60 * 60;
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const sign = value => createHmac('sha256', secret).update(value).digest('base64url');

export function login(email, password, role) {
  if (!secret) throw fail(503, 'AUTH_NOT_CONFIGURED', 'Chưa cấu hình AUTH_SESSION_SECRET');
  const account = DEMO[role];
  const supplied = Buffer.from(String(password || ''));
  const expected = Buffer.from(account?.password || '');
  if (!account || String(email || '').trim().toLowerCase() !== account.email.toLowerCase() || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
  }
  return { email: account.email, role };
}

export function sessionCookie(user, secure = false) {
  const payload = Buffer.from(JSON.stringify({ email: user.email, role: user.role, exp: Date.now() + maxAge * 1000 })).toString('base64url');
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
    if (user.exp <= Date.now() || !['teacher', 'student'].includes(user.role) || user.email !== DEMO[user.role].email) return null;
    return { email: user.email, role: user.role };
  } catch { return null; }
}

export function requireRole(req, role) {
  const user = currentUser(req);
  if (!user) throw fail(401, 'LOGIN_REQUIRED', 'Vui lòng đăng nhập');
  if (role && user.role !== role) throw fail(403, 'FORBIDDEN', 'Tài khoản này không có quyền thực hiện');
  return user;
}
