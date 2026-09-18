import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, rmdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerStudent, login, sessionCookie, currentUser } from '../src/auth.js';

test('registration validates identity, persists hashed credentials, and rejects duplicates', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'scriptscout-registration-'));
  const previous = process.env.STUDENTS_FILE;
  process.env.STUDENTS_FILE = join(dir, 'students.json');
  t.after(async () => { if (previous === undefined) delete process.env.STUDENTS_FILE; else process.env.STUDENTS_FILE = previous; await rm(join(dir, 'students.json'), { force: true }); await rmdir(dir); });
  const email = `registration-${Date.now()}@example.com`;
  const studentId = `TEST${Date.now()}`;
  await assert.rejects(registerStudent({ email, password: 'Password123', studentId }), { code: 'INVALID_REGISTRATION' });
  const user = await registerStudent({ email, password: 'Password123', studentId, fullName: 'Nguyễn Văn Thử' });
  assert.equal(user.studentId, studentId);
  assert.equal(user.passwordHash, undefined);
  assert.deepEqual(await login(email.toUpperCase(), 'Password123', 'student'), user);
  await assert.rejects(login(email, 'wrong', 'student'), { code: 'INVALID_CREDENTIALS' });
  await assert.rejects(login('hocsinh@gmail.com', 'HocSinh@2026', 'student'), { code: 'INVALID_CREDENTIALS' });
  await assert.rejects(registerStudent({ email, password: 'Password123', studentId: studentId + 'A', fullName: 'Nguyễn Văn Thử' }), { code: 'ACCOUNT_EXISTS' });
  await assert.rejects(registerStudent({ email: 'other-' + email, password: 'Password123', studentId, fullName: 'Nguyễn Văn Thử' }), { code: 'ACCOUNT_EXISTS' });
  const cookie = sessionCookie(user);
  assert.deepEqual(currentUser({ headers: { cookie } }), user);
  const stored = await readFile(process.env.STUDENTS_FILE, 'utf8');
  assert.ok(!stored.includes('Password123'));
});
