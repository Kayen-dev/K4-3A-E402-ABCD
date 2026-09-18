import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bocNoiDung, scrape, danhSachFixture } from '../src/scrape.js';
import { searchUrls, buildResearchQueries } from '../src/research.js';
import { createProject, actionProject } from '../src/projects.js';
import { writeProject } from '../src/storage.js';
import { isClearlyOffTopic } from '../src/topic-relevance.js';

const base = 'https://93.184.216.34';
const paragraph = 'Trí tuệ nhân tạo là lĩnh vực nghiên cứu các hệ thống có khả năng học và xử lý thông tin. ';
const savedEnv = { ...process.env };

test('plant nutrition search keeps its domain and discards clearly human nutrition results', async t => {
  process.env.TAVILY_API_KEY = 'test-key';
  const topic = 'Dinh dưỡng cho lá cây';
  assert(buildResearchQueries(topic, 'Hiểu nhu cầu dinh dưỡng').every(query => query.startsWith(topic) && query.includes('thực vật')));
  assert.equal(isClearlyOffTopic(topic, 'Dinh dưỡng cho trẻ em và bà bầu'), true);
  assert.equal(isClearlyOffTopic(topic, 'Dinh dưỡng khoáng của thực vật và cây trồng'), false);
  assert.equal(isClearlyOffTopic(topic, 'Chế độ ăn con người và nhu cầu dinh dưỡng thực vật'), false);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ results: [
    { url: `${base}/human`, title: 'Dinh dưỡng cho con người', content: 'Chế độ ăn cho trẻ em' },
    { url: `${base}/plant`, title: 'Dinh dưỡng cho lá cây', content: 'Phân bón và dinh dưỡng khoáng thực vật' },
  ] }));
  try { assert.deepEqual(await searchUrls(topic), [`${base}/plant`]); }
  finally { restoreEnvironment(); }
});
function restoreEnvironment() {
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
  Object.assign(process.env, savedEnv);
}

test('reads nested Wikipedia content, removes navigation, and resolves media URLs', () => {
  const html = `<nav>MENU KHÔNG LIÊN QUAN</nav><div id="mw-content-text"><div><p>${paragraph}</p></div><p>${paragraph}</p><img src="/ai.jpg"><video><source src="/lesson.mp4"></video></div>`;
  const result = bocNoiDung(html, `${base}/wiki/AI`);
  assert.equal(result.text.includes('MENU KHÔNG LIÊN QUAN'), false);
  assert.equal(result.text.match(/Trí tuệ/g).length, 2);
  assert.deepEqual(result.media, [{ kind: 'image', url: `${base}/ai.jpg` }, { kind: 'video', url: `${base}/lesson.mp4` }]);
  assert.deepEqual(bocNoiDung(`<article>${paragraph.repeat(3)}</article>`, base).media, []);
});

test('fallback reads a public post but rejects a login page', async t => {
  process.env.TAVILY_API_KEY = 'test-key';
  let publicPost = true;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (String(url).endsWith('/extract')) {
      assert.equal(JSON.parse(options.body).include_images, true);
      return Response.json({ results: [{ url: `${base}/post`, raw_content: publicPost ? paragraph.repeat(3) : `Log in to Facebook ${paragraph.repeat(3)}`, images: [`${base}/post.jpg`] }] });
    }
    return new Response('Blocked', { status: 403 });
  });
  try {
    const result = await scrape(`${base}/post`);
    assert.equal(result.ok, true);
    assert.equal(result.extraction_method, 'tavily-extract');
    assert.equal(result.media[0].url, `${base}/post.jpg`);
    publicPost = false;
    const blocked = await scrape(`${base}/post`);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.text, '');
  } finally { restoreEnvironment(); }
});

test('retains injection detection from hidden comments when article extraction omits them', async () => {
  const directory = fileURLToPath(new URL('../fixtures/pages', import.meta.url));
  const sources = await danhSachFixture(directory);
  for (const id of ['n03', 'n07']) {
    const source = sources.find(item => item.nguon_id === id);
    const result = await scrape(source.url, { fixtures: directory });
    assert(result.lenh_an.length > 0, id);
  }
});

test('search includes objectives and distributes the 20 sources across queries', async t => {
  process.env.TAVILY_API_KEY = 'test-key';
  const queries = [];
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    const query = JSON.parse(options.body).query;
    queries.push(query);
    const group = queries.length;
    return Response.json({ results: Array.from({ length: 10 }, (_, i) => ({ url: `${base}/${group}/${i}` })) });
  });
  try {
    const urls = await searchUrls('AI', 'Giải thích học máy; Phân biệt AI và lập trình');
    assert.equal(urls.length, 20);
    assert(queries.includes('AI Giải thích học máy'));
    assert(queries.includes('AI Phân biệt AI và lập trình'));
    assert(!queries.includes('Giải thích học máy'));
    assert(!queries.includes('Phân biệt AI và lập trình'));
    assert.equal(queries[0], 'AI');
    assert(queries.every(query => query.startsWith('AI')));
    assert(urls.includes(`${base}/3/0`));
    assert(urls.includes(`${base}/4/0`));
  } finally { restoreEnvironment(); }
});

test('search retains every learning objective, including those after the third', () => {
  const queries = buildResearchQueries('Thế giới động vật', 'Nhận biết môi trường sống\nPhân loại động vật\nSo sánh cách sinh sản\nBảo vệ động vật hoang dã');
  assert(queries.includes('Thế giới động vật Bảo vệ động vật hoang dã'));
  assert(!queries.includes('Bảo vệ động vật hoang dã'));
  assert.equal(queries[0], 'Thế giới động vật');
  assert(queries.every(query => query.startsWith('Thế giới động vật')));
});

test('generation uses article content, saves new evidence and media per scene, rejects invented evidence', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'scriptscout-research-'));
  process.env.PROJECTS_DIR = directory;
  process.env.LLM_PROVIDER = 'openai';
  process.env.LLM_API_KEY = 'test-key';
  process.env.LLM_TRACE = '0';
  process.env.LLM_MIN_GAP_MS = '0';
  const quote = paragraph.trim();
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    const request = JSON.parse(options.body);
    const system = request.messages[0].content;
    if (system.includes('phân loại đầu vào')) return Response.json({ choices: [{ message: { content: '{"allowed":true}' } }] });
    if (system.includes('verdicts')) return Response.json({ choices: [{ message: { content: JSON.stringify({ verdicts: [{ id: 't1', status: 'supported', reason: 'Nội dung khớp cả hai nguồn' }] }) } }] });
    const context = request.messages.find(message => message.role === 'user').content;
    assert(context.includes('Mục tiêu bài học: Hiểu AI'));
    assert(context.includes(quote));
    assert(context.includes('noi_dung_bai_viet'));
    return Response.json({ choices: [{ message: { content: JSON.stringify({
      facts: [
        { id: 't1', noi_dung: quote, bang_chung: [{ nguon_id: 's1', doan_trich: quote }, { nguon_id: 's2', doan_trich: quote }] },
        { id: 't2', noi_dung: 'Nội dung bịa', bang_chung: [{ nguon_id: 's1', doan_trich: 'Nội dung hoàn toàn không có trong tài liệu này' }] },
      ],
      cau: [
        { loi: 'AI nghiên cứu các hệ thống có khả năng học.', fact_ids: ['t1'], media_url: `${base}/ai.jpg` },
        { loi: 'Câu cần kiểm chứng.', fact_ids: ['t2'], media_url: `${base}/invented.jpg` },
      ],
    }) } }] });
  });
  try {
    const project = await createProject({ mode: 'research', brief: { topic: 'AI', goal: 'Hiểu AI', audience: 'Sinh viên', duration: 1 } });
    project.sources = ['s1', 's2'].map((id, i) => ({ nguon_id: id, url: `${base}/${i}`, trang_thai: i === 0 ? 'loai' : 'dung', diem_tieu_chi: [1, 1, 0, 0, 1], snapshot: paragraph.repeat(3), snapshot_hash: 'test-hash', trich_dan: [], evidence: [], approved: false, media: [{ kind: 'image', url: `${base}/ai.jpg` }] }));
    await writeProject(project);
    const approved = await actionProject(project.id, { action: 'approve-sources', sourceIds: ['s1', 's2'], revision: project.revision });
    assert.equal(approved.sources[0].approved, true, 'teacher can approve a source rejected for relevance');
    const events = [];
    const result = await actionProject(project.id, { action: 'generate', revision: approved.revision }, event => events.push(event));
    for (let step = 1; step <= 4; step++) {
      assert.ok(events.some(event => event.type === 'progress' && event.message.startsWith(`Bước ${step}/4:`)));
    }
    assert.deepEqual(result.sentences[0].sourceIds, ['s1', 's2']);
    assert.equal(result.sentences[0].evidenceIds.length, 2);
    assert.equal(result.sentences[0].media.url, `${base}/ai.jpg`);
    assert.equal(result.sources[0].evidence[0].quote, quote);
    assert.equal(result.sentences[1].evidenceIds.length, 0);
    assert.equal(result.sentences[1].media, null);
    assert.equal(result.sentences[1].needsVerification, true);
  } finally { restoreEnvironment(); await rm(directory, { recursive: true, force: true }); }
});
