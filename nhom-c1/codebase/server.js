#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProject, getProject, listProjects, deleteProject, actionProject } from './src/projects.js';
import { provider } from './src/llm.js';
import { login, currentUser, requireRole, sessionCookie, clearSessionCookie } from './src/auth.js';
import { listFeedback, createFeedback, updateFeedback, deleteFeedback, decideFeedback } from './src/feedback.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATIC = join(HERE, 'ui', 'dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
function json(res, status, value) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(value)); }
async function body(req) {
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 100_000) throw Object.assign(new Error('Dữ liệu gửi lên quá lớn'), { status: 413, code: 'BODY_TOO_LARGE' }); chunks.push(chunk); }
  try { return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}; }
  catch { throw Object.assign(new Error('JSON không hợp lệ'), { status: 400, code: 'INVALID_JSON' }); }
}
export async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/status' && req.method === 'GET') return json(res, 200, { provider: provider(), searchConfigured: !!process.env.TAVILY_API_KEY, llmConfigured: !!process.env.LLM_API_KEY && provider() !== 'stub' });
    const secureCookie = !!process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https';
    if (url.pathname === '/api/auth/session' && req.method === 'GET') return json(res, 200, { user: currentUser(req) });
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const input = await body(req);
      const user = login(input.email, input.password, input.role);
      res.setHeader('set-cookie', sessionCookie(user, secureCookie));
      return json(res, 200, { user });
    }
    if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
      res.setHeader('set-cookie', clearSessionCookie(secureCookie));
      return json(res, 200, { user: null });
    }
    if (url.pathname === '/api/feedback') {
      const user = requireRole(req);
      if (req.method === 'GET') return json(res, 200, { feedback: await listFeedback(user) });
      if (req.method === 'POST') return json(res, 201, await createFeedback(user, await body(req)));
      return json(res, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Phương thức không được hỗ trợ' });
    }
    const feedbackMatch = /^\/api\/feedback\/([a-f0-9-]{36})(?:\/(decision))?$/.exec(url.pathname);
    if (feedbackMatch) {
      const user = requireRole(req);
      const id = feedbackMatch[1];
      if (feedbackMatch[2] && req.method === 'POST') return json(res, 200, await decideFeedback(user, id, (await body(req)).decision));
      if (!feedbackMatch[2] && req.method === 'PUT') return json(res, 200, await updateFeedback(user, id, await body(req)));
      if (!feedbackMatch[2] && req.method === 'DELETE') return json(res, 200, await deleteFeedback(user, id));
      return json(res, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Phương thức không được hỗ trợ' });
    }
    if (url.pathname === '/api/projects') {
      requireRole(req, 'teacher');
      if (req.method === 'GET') return json(res, 200, { projects: await listProjects() });
      if (req.method === 'POST') return json(res, 201, await createProject(await body(req)));
      return json(res, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Phương thức không được hỗ trợ' });
    }
    const match = /^\/api\/projects\/([a-f0-9-]{36})(?:\/(action))?$/.exec(url.pathname);
    if (match) {
      requireRole(req, 'teacher');
      const id = match[1];
      if (!match[2] && req.method === 'GET') return json(res, 200, await getProject(id));
      if (!match[2] && req.method === 'DELETE') return json(res, 200, await deleteProject(id));
      if (match[2] && req.method === 'POST') {
        const input = await body(req);
        if (['research', 'add-source', 'generate', 'rewrite', 'review'].includes(input.action)) {
          res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
          const emit = event => { if (!res.destroyed && !res.writableEnded) res.write(JSON.stringify(event) + '\n'); };
          emit({ type: 'started', message: 'Đang xử lý' });
          emit({ type: 'progress', message: 'Đang tải phiên làm việc và kiểm tra dữ liệu lưu trữ.' });
          let deadline;
          try {
            const project = await Promise.race([
              actionProject(id, input, emit),
              new Promise((_, reject) => { deadline = setTimeout(() => reject(Object.assign(new Error('Xử lý quá thời gian cho phép. Hãy thử lại hoặc chọn ít tài liệu hơn.'), { code: 'RUN_TIMEOUT' })), process.env.VERCEL ? 55_000 : 130_000); }),
            ]);
            emit({ type: 'result', project });
          }
          catch (e) {
            console.error('[action]', input.action, id, e.code || e.name);
            emit({ type: 'error', code: e.code || 'RUN_FAILED', message: e.code === 'RUN_TIMEOUT' ? e.message : e.status >= 500 ? 'Tác vụ thất bại. Thử lại hoặc liên hệ người quản trị.' : e.message });
          } finally { clearTimeout(deadline); }
          return res.end();
        }
        return json(res, 200, await actionProject(id, input));
      }
      return json(res, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Phương thức không được hỗ trợ' });
    }
    if (url.pathname.startsWith('/api/')) return json(res, 404, { code: 'NOT_FOUND', message: 'Không có API này' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Phương thức không được hỗ trợ' });
    let relative = decodeURIComponent(url.pathname);
    if (relative.includes('..') || relative.includes('\\') || relative.includes('\0')) return json(res, 400, { code: 'INVALID_PATH', message: 'Đường dẫn không hợp lệ' });
    if (relative === '/') relative = '/index.html';
    const target = join(STATIC, normalize(relative).replace(/^[/\\]+/, ''));
    let data;
    try { data = await readFile(target); }
    catch (e) { if (e.code !== 'ENOENT' || extname(relative)) throw e; data = await readFile(join(STATIC, 'index.html')); }
    res.writeHead(200, { 'content-type': MIME[extname(target)] || 'text/html; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (e) {
    const status = e.status || (e.code === 'ENOENT' ? 404 : 500);
    if (status >= 500) console.error(e);
    if (!res.headersSent) json(res, status, { code: e.code || 'SERVER_ERROR', message: status >= 500 ? 'Có lỗi máy chủ. Thử lại sau.' : e.message });
    else res.end();
  }
}

const port = Number(process.env.PORT || 5173);
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer(handleRequest).listen(port, '127.0.0.1', () => console.log(`ScriptScout http://127.0.0.1:${port}`));
}
