import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, dirname, resolve, sep, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const HERE = dirname(fileURLToPath(import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'scriptscout-refactor-'));
process.env.PROJECTS_DIR = join(temp, 'projects');
process.env.LLM_PROVIDER = 'stub';
const { soatVanNoi } = await import('./src/pipeline.js');
const { createProject, getProject, actionProject } = await import('./src/projects.js');
const { validatePublicUrl } = await import('./src/scrape.js');
const cases = JSON.parse(await readFile(join(HERE, 'fixtures', 'qa-cases.json'), 'utf8'));
const results = [];
const timings = [];
function assert(value, message) { if (!value) throw new Error(message); }
try {
  for (const c of cases) {
    const sentences = c.text.split('\n').map((loi, i) => ({ n: i + 1, loi, fact_ids: c.fact ? [c.fact.id] : [] }));
    const facts = c.fact ? { [c.fact.id]: c.fact } : {};
    const t0 = performance.now();
    const { findings } = await soatVanNoi(sentences, facts, new Set(c.fact ? ['s1'] : []), { boQuaAI: true });
    timings.push(performance.now() - t0);
    const matched = c.category ? findings.find(f => f.loai === c.category && f.sev === c.severity && (!f.quote || c.text.includes(f.quote))) : findings.length === 0;
    results.push({ id: c.id, provenance: c.provenance, expected: c.category, passed: !!matched, found: findings.map(f => f.loai), reviewer: c.reviewer });
  }
  const p = await createProject({ mode: 'qa', script: 'Bạn chào lớp.\nQuý vị nghe tiếp.' });
  const review = await actionProject(p.id, { action: 'review', revision: p.revision, requestId: 'qa-review' });
  assert(review.findings.length === 1, 'QA finding count');
  const f = review.findings[0];
  const accepted = await actionProject(p.id, { action: 'decision', revision: review.revision, findingId: f.id, decision: 'accept' });
  assert(accepted.sentences[1].text.startsWith('bạn'), 'accept edit');
  const undone = await actionProject(p.id, { action: 'decision', revision: accepted.revision, findingId: f.id, decision: 'undo' });
  assert(undone.sentences[1].text.startsWith('Quý vị'), 'undo edit');
  assert((await getProject(p.id)).revision === undone.revision, 'reload revision');
  let conflict = false;
  try { await actionProject(p.id, { action: 'decision', revision: 1, findingId: f.id, decision: 'reject' }); } catch (e) { conflict = e.status === 409; }
  assert(conflict, 'revision conflict');

  const research = await createProject({ mode: 'research', brief: { topic: 'Chủ đề kiểm thử', goal: 'Hiểu quy trình', audience: 'Giảng viên', duration: 5 } });
  research.sources = [
    { nguon_id: 's1', url: 'https://example.org/a', trang_thai: 'dung', trich_dan: ['Đoạn A'], evidence: [{ id: 'e1', sourceId: 's1', quote: 'Đoạn A', start: 0, end: 6 }], approved: false },
    { nguon_id: 's2', url: 'https://example.org/b', trang_thai: 'dung', trich_dan: ['Đoạn B'], evidence: [{ id: 'e2', sourceId: 's2', quote: 'Đoạn B', start: 0, end: 6 }], approved: false },
  ];
  research.sentences = [
    { id: 'c1', scene: 1, text: 'Câu A', evidenceIds: ['e1'], claimIds: [] },
    { id: 'c2', scene: 2, text: 'Câu B', evidenceIds: ['e2'], claimIds: [] },
  ];
  await writeFile(join(process.env.PROJECTS_DIR, `${research.id}.json`), JSON.stringify(research));
  const all = await actionProject(research.id, { action: 'approve-sources', revision: 1, sourceIds: ['s1', 's2'] });
  const one = await actionProject(research.id, { action: 'approve-sources', revision: all.revision, sourceIds: ['s1'] });
  assert(!one.sentences[0].needsRewrite && one.sentences[0].text === 'Câu A', 'unaffected sentence');
  assert(one.sentences[1].needsRewrite && one.sentences[1].text === 'Câu B', 'affected sentence');

  for (const url of ['http://127.0.0.1/', 'http://localhost/', 'http://10.1.2.3/', 'http://169.254.169.254/']) {
    let blocked = false; try { await validatePublicUrl(url); } catch { blocked = true; }
    assert(blocked, `SSRF URL ${url}`);
  }
  const passed = results.filter(r => r.passed).length;
  const report = { date: new Date().toISOString(), dataset: 'fixtures/qa-cases.json', provider: 'stub', scope: 'deterministic rules only', cases: results, passed, total: results.length,
    lifecycle: { acceptUndoReload: true, revisionConflict: true, sourceDependency: true, privateUrlBlock: true },
    latencyMs: { count: timings.length, median: [...timings].sort((a,b) => a-b)[Math.floor(timings.length/2)], max: Math.max(...timings), note: 'local rule execution only; no web or model latency' },
    limitations: ['All QA labels are synthetic and await human review.', 'No live search, LLM quality, citation semantic support, or user UX rate measured.'] };
  await writeFile(join(HERE, 'EVAL-REFACTOR-REPORT.json'), JSON.stringify(report, null, 2));
  await writeFile(join(HERE, 'EVAL-REFACTOR-REPORT.md'), `# Refactor evaluation\n\n${passed}/${results.length} deterministic QA cases passed.\n\nProject lifecycle, source dependency, revision conflict, and private URL checks passed.\n\nNo live or human acceptance measurements were available. See JSON for counts and limitations.\n`);
  console.log(`${passed}/${results.length} QA cases; lifecycle and security checks passed`);
  if (passed !== results.length) process.exitCode = 1;
} finally {
  const actual = resolve(temp), parent = resolve(tmpdir()) + sep;
  if (actual.startsWith(parent) && basename(actual).startsWith('scriptscout-refactor-')) await rm(actual, { recursive: true, force: true });
}
