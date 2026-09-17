import { randomUUID } from 'node:crypto';
import { readProject, writeProject, listProjectIds, removeProject } from './storage.js';
import { searchUrls, assessUrls } from './research.js';
import { canUseSource } from './source-policy.js';
import { approvedFeedbackForReview } from './feedback.js';
import { validatePublicUrl } from './scrape.js';
import { vietCau, gomFact, soatVanNoi, kiemChungClaims } from './pipeline.js';

const locks = new Map();
const runs = new Map();
const validId = id => typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
const pathFor = id => { if (!validId(id)) throw fault(400, 'INVALID_ID', 'Mã phiên không hợp lệ'); return id; };
const fault = (status, code, message) => Object.assign(new Error(message), { status, code });
const stamp = () => new Date().toISOString();
const clean = value => JSON.parse(JSON.stringify(value));

async function locked(id, fn) {
  const previous = locks.get(id) || Promise.resolve();
  let release;
  const current = new Promise(resolve => { release = resolve; });
  locks.set(id, current);
  await previous;
  try { return await fn(); } finally { release(); if (locks.get(id) === current) locks.delete(id); }
}
async function save(p) {
  pathFor(p.id);
  await writeProject(p);
}
export async function getProject(id) {
  try {
    const p = await readProject(pathFor(id));
    const leaseExpired = !process.env.VERCEL || Date.now() - Date.parse(p.run?.startedAt || 0) > 90_000;
    if (p.run?.status === 'running' && !runs.has(id) && leaseExpired) {
      p.run.status = 'interrupted'; p.run.message = 'Tác vụ bị gián đoạn. Bạn có thể thử lại.';
      await save(p);
    }
    return p;
  } catch (e) { if (e.code === 'ENOENT') throw fault(404, 'NOT_FOUND', 'Không tìm thấy phiên'); throw e; }
}
export async function listProjects() {
  const ids = await listProjectIds();
  const items = await Promise.all(ids.map(async id => { try { const p = await getProject(id); return { id: p.id, mode: p.mode, title: p.brief?.topic || 'Kịch bản rà soát', updatedAt: p.updatedAt, revision: p.revision }; } catch { return null; } }));
  return items.filter(Boolean).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function createProject(body) {
  const mode = body?.mode;
  if (!['research', 'qa'].includes(mode)) throw fault(400, 'INVALID_MODE', 'Chọn một cách bắt đầu');
  const topic = String(body.brief?.topic || '').trim();
  const script = String(body.script || '').trim();
  if (mode === 'research' && (!topic || topic.length > 300)) throw fault(400, 'INVALID_TOPIC', 'Nhập chủ đề bài học (tối đa 300 ký tự)');
  if (mode === 'research' && !String(body.brief?.goal || '').trim()) throw fault(400, 'INVALID_GOAL', 'Nhập mục tiêu bài học');
  if (mode === 'research' && !String(body.brief?.audience || '').trim()) throw fault(400, 'INVALID_AUDIENCE', 'Nhập người học');
  if (mode === 'qa' && (!script || script.length > 30000)) throw fault(400, 'INVALID_SCRIPT', 'Dán kịch bản (tối đa 30.000 ký tự)');
  if (String(body.brief?.goal || '').length > 2000 || String(body.brief?.audience || '').length > 300) throw fault(400, 'INVALID_BRIEF', 'Mục tiêu hoặc người học quá dài');
  const now = stamp();
  const p = { id: randomUUID(), mode, revision: 1, createdAt: now, updatedAt: now,
    brief: { topic, goal: String(body.brief?.goal || ''), audience: String(body.brief?.audience || ''), duration: Number(body.brief?.duration || 5) },
    sources: [], claims: {}, sentences: mode === 'qa' ? splitScript(script) : [], findings: [],
    sourceApprovalRevision: null, approvedRevision: null, reviewStatus: 'not-run', run: null, audit: [], requestIds: [] };
  if (!Number.isFinite(p.brief.duration) || p.brief.duration < 1 || p.brief.duration > 120) throw fault(400, 'INVALID_DURATION', 'Thời lượng phải từ 1 đến 120 phút');
  await save(p); return p;
}
function splitScript(text) {
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  if (lines.length > 200 || lines.some(s => s.length > 2000)) throw fault(400, 'SCRIPT_TOO_LONG', 'Tối đa 200 dòng, mỗi dòng tối đa 2.000 ký tự');
  return lines.map((text, i) => ({ id: `c${i + 1}`, scene: i + 1, text, original: text, claimIds: [], evidenceIds: [], visual: '', seconds: Math.max(4, Math.ceil(text.split(/\s+/).length / 2.5)) }));
}
function audit(p, action, target, before, after) { p.audit.push({ at: stamp(), actor: 'user', action, target, revision: p.revision, before, after }); }
function change(p) { p.revision++; p.updatedAt = stamp(); p.approvedRevision = null; }
function eligible(p) { return p.sources.filter(s => s.approved && canUseSource(s)); }
function invalidate(p) { p.sourceApprovalRevision = null; p.approvedRevision = null; }
function normalizeFindings(p, raw) {
  return raw.flatMap((f, i) => {
    const sentence = p.sentences.find(s => s.scene === f.cau);
    if (!sentence) return [];
    const quote = typeof f.quote === 'string' ? f.quote : null;
    const start = quote ? sentence.text.indexOf(quote) : 0;
    if (quote && start < 0) return [];
    return [{ id: `f${i + 1}`, sentenceId: sentence.id, revision: p.revision, quote, start, end: quote ? start + quote.length : sentence.text.length,
      category: f.loai || 'khác', feedbackId: f.feedback_id || null, feedbackTitle: f.feedback_title || null, severity: f.sev || 'trung bình', reason: f.vi || '', suggestion: f.goiY || '', replacement: typeof f.thay === 'string' ? f.thay : null,
      decision: null, originalSentence: sentence.text, previousText: null }];
  });
}
async function mutate(id, expected, fn) {
  return locked(id, async () => {
    const p = await getProject(id);
    if (p.revision !== expected) throw fault(409, 'REVISION_CONFLICT', 'Phiên đã thay đổi. Tải lại rồi thử tiếp.');
    const result = await fn(p);
    change(p); await save(p); return result || p;
  });
}
export async function deleteProject(id) {
  runs.get(id)?.abort();
  return locked(id, async () => { await removeProject(pathFor(id)); return { deleted: true }; });
}
export async function actionProject(id, body, emit = () => {}) {
  const action = body?.action, rev = body?.revision;
  if (!Number.isInteger(rev)) throw fault(400, 'INVALID_REVISION', 'Thiếu phiên bản dữ liệu');
  const requestId = String(body.requestId || '');
  if (requestId.length > 100) throw fault(400, 'INVALID_REQUEST_ID', 'Mã yêu cầu quá dài');
  const p = await getProject(id);
  if (requestId && p.requestIds.includes(requestId)) return p;
  if (p.revision !== rev) throw fault(409, 'REVISION_CONFLICT', 'Phiên đã thay đổi. Tải lại rồi thử tiếp.');
  if (action === 'cancel') {
    runs.get(id)?.abort();
    return mutate(id, rev, p => { p.run = { status: 'cancelled', message: 'Đã hủy tác vụ' }; audit(p, action, id, null, null); });
  }
  if (['research', 'add-source', 'generate', 'review', 'rewrite'].includes(action)) return longAction(id, body, emit);
  return mutate(id, rev, p => {
    const selected = body.sourceIds;
    if (action === 'approve-sources') {
      if (!Array.isArray(selected) || selected.some(x => typeof x !== 'string' || !p.sources.some(s => s.nguon_id === x))) throw fault(400, 'INVALID_SOURCES', 'Danh sách tài liệu không hợp lệ');
      const allowed = new Set(selected);
      const previous = new Set(p.sources.filter(s => s.approved).map(s => s.nguon_id));
      p.sources.forEach(s => { s.approved = allowed.has(s.nguon_id) && canUseSource(s); });
      if (!p.sources.some(s => s.approved)) throw fault(400, 'NO_SOURCES', 'Chọn ít nhất một tài liệu có thể dùng');
      const removed = new Set([...previous].filter(x => !allowed.has(x)));
      if (removed.size) {
        const removedEvidence = new Set(p.sources.filter(s => removed.has(s.nguon_id)).flatMap(s => (s.evidence || []).map(e => e.id)));
        p.sentences.forEach(s => {
          if (s.evidenceIds.some(id => removedEvidence.has(id))) {
            s.needsRewrite = true;
            s.evidenceIds = s.evidenceIds.filter(id => !removedEvidence.has(id));
            s.sourceIds = (s.sourceIds || []).filter(id => !removed.has(id));
            s.media = null;
          }
        });
        const recalculated = gomFact(Object.values(p.claims), eligible(p));
        const impactedClaims = new Set(Object.values(p.claims).filter(f => f.bang_chung?.some(b => removed.has(b.nguon_id))).map(f => f.id));
        p.claims = Object.fromEntries(Object.entries(recalculated.facts).map(([id, f]) => [id, impactedClaims.has(id) ? { ...f, supportStatus: f.mau_thuan ? 'conflicting' : 'insufficient', supportReason: 'Tập nguồn đã thay đổi; cần kiểm chứng lại' } : f]));
        p.sentences.forEach(s => { if (s.claimIds?.some(id => impactedClaims.has(id))) s.needsVerification = true; });
        p.reviewStatus = 'stale';
      }
      p.sourceApprovalRevision = p.revision + 1; audit(p, action, id, null, selected);
    } else if (action === 'edit-sentence') {
      const sentence = p.sentences.find(s => s.id === body.sentenceId);
      const text = String(body.text || '').trim();
      if (!sentence || !text || text.length > 2000) throw fault(400, 'INVALID_SENTENCE', 'Câu không hợp lệ');
      const before = sentence.text; sentence.text = text;
      if (sentence.claimIds?.length) sentence.needsVerification = true;
      p.findings = p.findings.filter(f => f.sentenceId !== sentence.id); p.reviewStatus = 'stale';
      audit(p, action, sentence.id, before, text);
    } else if (action === 'decision') {
      if (body.target === 'project') {
        if (body.decision !== 'approve') throw fault(400, 'INVALID_DECISION', 'Quyết định không hợp lệ');
        if (p.reviewStatus !== 'complete' || p.findings.some(f => (f.category === 'thieu-can-cu' && f.decision !== 'accepted') || (f.severity === 'cao' && !['accepted', 'rejected'].includes(f.decision))) || p.sentences.some(s => s.needsRewrite || s.needsVerification)) throw fault(400, 'BLOCKING_FINDINGS', 'Còn câu cần kiểm tra hoặc góp ý quan trọng chưa xử lý');
        p.approvedRevision = p.revision + 1; audit(p, 'approve-project', id, null, 'approved');
      } else {
        const f = p.findings.find(x => x.id === body.findingId);
        const s = p.sentences.find(x => x.id === f?.sentenceId);
        if (!f || !s || !['accept', 'reject', 'undo'].includes(body.decision)) throw fault(400, 'INVALID_FINDING', 'Góp ý không hợp lệ');
        const before = s.text;
        if (body.decision === 'accept') {
          if (f.decision || !f.replacement || s.text.slice(f.start, f.end) !== f.quote) throw fault(409, 'STALE_FINDING', 'Góp ý đã cũ hoặc không có đoạn sửa an toàn');
          f.previousText = s.text; s.text = s.text.slice(0, f.start) + f.replacement + s.text.slice(f.end); f.decision = 'accepted'; p.reviewStatus = 'stale';
        } else if (body.decision === 'reject') { f.decision = 'rejected'; }
        else { if (f.decision === 'accepted' && f.previousText) s.text = f.previousText; f.decision = null; f.previousText = null; p.reviewStatus = 'stale'; }
        audit(p, body.decision, f.id, before, s.text);
      }
    } else throw fault(400, 'INVALID_ACTION', 'Hành động không hợp lệ');
    if (requestId) p.requestIds = [...p.requestIds, requestId].slice(-50);
  });
}

async function longAction(id, body, emit) {
  const start = await getProject(id);
  if (runs.has(id)) throw fault(409, 'RUN_ACTIVE', 'Một tác vụ khác đang chạy');
  const controller = new AbortController(); const runId = randomUUID(); runs.set(id, controller);
  try {
    await locked(id, async () => {
      const p = await getProject(id);
      if (p.revision !== body.revision) throw fault(409, 'REVISION_CONFLICT', 'Phiên đã thay đổi');
      if (p.run?.status === 'running') throw fault(409, 'RUN_ACTIVE', 'Một tác vụ khác đang chạy');
      p.run = { id: runId, status: 'running', startedAt: stamp(), action: body.action, message: 'Đang xử lý', sequence: 0 };
      await save(p);
    });
  } catch (e) { runs.delete(id); throw e; }
  let sequence = 0;
  const progress = e => emit({ runId, sequence: ++sequence, ...e });
  try {
    let result;
    const researchQueries = [];
    if (body.action === 'research') {
      const topic = start.mode === 'qa'
        ? start.sentences.find(s => s.id === body.sentenceId)?.text.slice(0, 300)
        : start.brief.topic;
      if (!topic) throw fault(400, 'INVALID_SENTENCE', 'Chọn câu cần kiểm chứng');
      const goal = start.mode === 'research' ? start.brief.goal : '';
      const urls = await searchUrls(topic, goal, controller.signal, query => {
        researchQueries.push(query);
        progress({ type: 'progress', message: `Đang tìm: ${query}` });
      });
      progress({ type: 'progress', message: `Tìm thấy ${urls.length} tài liệu. Đang đọc...` });
      result = await assessUrls(urls, topic, goal, progress, controller.signal);
    } else if (body.action === 'add-source') {
      const url = await validatePublicUrl(String(body.url || ''));
      result = await assessUrls([url], start.brief.topic, start.brief.goal, progress, controller.signal);
    } else if (body.action === 'generate' || body.action === 'rewrite') {
      if (start.mode !== 'research' || start.sourceApprovalRevision === null || !eligible(start).length) throw fault(400, 'SOURCES_NOT_APPROVED', 'Duyệt ít nhất một tài liệu trước khi viết');
      if (start.sourceApprovalRevision > start.revision) throw fault(409, 'REVISION_CONFLICT', 'Tài liệu đã thay đổi');
      if ((process.env.LLM_PROVIDER || 'stub') === 'stub' || !process.env.LLM_API_KEY) throw fault(503, 'LLM_NOT_CONFIGURED', 'Chưa cấu hình viết kịch bản. Liên hệ người quản trị.');
      const count = Math.min(40, Math.max(3, Math.round(start.brief.duration * 5)));
      result = await vietCau({ chu_de: start.brief.topic, muc_tieu: start.brief.goal, nguoi_hoc: start.brief.audience, so_cau: count, nguonList: eligible(start) });
      if (!Array.isArray(result.cau) || !result.cau.length || result.cau.length > 40 || result.cau.some(c => typeof c.loi !== 'string' || !c.loi.trim() || c.loi.length > 2000)) throw fault(502, 'INVALID_DRAFT', 'Kết quả viết chưa hợp lệ. Thử lại sau.');
      if (body.action === 'rewrite' && start.sentences.some((s, i) => s.needsRewrite && i >= result.cau.length)) throw fault(502, 'INCOMPLETE_REWRITE', 'Chưa viết đủ câu bị ảnh hưởng. Thử lại sau.');
      result.verifiedFacts = await kiemChungClaims(gomFact(result.facts, eligible(start)).facts);
    } else if (body.action === 'review') {
      if (!start.sentences.length) throw fault(400, 'NO_SCRIPT', 'Chưa có kịch bản để rà soát');
      const cau = start.sentences.map((s, i) => ({ n: i + 1, loi: s.text, fact_ids: s.claimIds }));
      const approved = new Set(eligible(start).map(s => s.nguon_id));
      const reviewedFeedback = await approvedFeedbackForReview();
      result = await soatVanNoi(cau, start.claims, approved, { boQuaAI: !process.env.LLM_API_KEY || (process.env.LLM_PROVIDER || 'stub') === 'stub', approvedFeedback: reviewedFeedback });
      result.feedbackIds = reviewedFeedback.map(item => item.id);
    }
    return await locked(id, async () => {
      const p = await getProject(id);
      if (controller.signal.aborted || p.revision !== body.revision || p.run?.id !== runId) throw fault(409, 'STALE_RUN', 'Tác vụ đã bị hủy hoặc dữ liệu đã đổi');
      if (body.action === 'research' || body.action === 'add-source') {
        if (body.action === 'research') p.researchQueries = researchQueries;
        for (const s of result) {
          const existing = p.sources.find(item => item.url === s.url);
          if (existing?.snapshot && existing.trang_thai !== 'khong-doc-duoc') continue;
          const sourceId = existing?.nguon_id || randomUUID();
          const evidence = (s.trich_dan || []).map(quote => ({ id: randomUUID(), sourceId, snapshotHash: s.snapshot_hash,
            quote, start: s.snapshot.indexOf(quote), end: s.snapshot.indexOf(quote) + quote.length }));
          const updated = { ...s, nguon_id: sourceId, evidence, approved: false };
          if (existing) p.sources[p.sources.indexOf(existing)] = updated;
          else p.sources.push(updated);
        }
        invalidate(p); audit(p, body.action, id, null, p.sources.map(s => s.url));
      } else if (body.action === 'generate' || body.action === 'rewrite') {
        const facts = result.verifiedFacts;
        for (const fact of Object.values(facts)) for (const proof of fact.bang_chung || []) {
          const source = p.sources.find(s => s.nguon_id === proof.nguon_id);
          if (!source || !source.snapshot?.includes(proof.doan_trich)) continue;
          source.evidence ||= [];
          if (!source.evidence.some(e => e.quote === proof.doan_trich)) {
            const offset = source.snapshot.indexOf(proof.doan_trich);
            source.evidence.push({ id: randomUUID(), sourceId: source.nguon_id, snapshotHash: source.snapshot_hash, quote: proof.doan_trich, start: offset, end: offset + proof.doan_trich.length });
          }
        }
        for (const fact of Object.values(facts)) fact.evidenceIds = (fact.bang_chung || []).flatMap(b => p.sources.filter(s => s.nguon_id === b.nguon_id).flatMap(s => (s.evidence || []).filter(e => e.quote === b.doan_trich).map(e => e.id)));
        p.claims = facts;
        const built = result.cau.map((c, i) => {
          const claimIds = c.fact_ids.filter(x => facts[x]);
          const sourceIds = [...new Set(claimIds.flatMap(x => facts[x]?.bang_chung?.map(b => b.nguon_id) || []))];
          const referenced = sourceIds.map(sourceId => p.sources.find(s => s.nguon_id === sourceId)).filter(Boolean);
          const media = referenced.flatMap(s => s.media || []).find(item => item.url === c.media_url);
          return { id: `c${i + 1}`, scene: i + 1, text: c.loi, original: c.loi, claimIds, sourceIds, evidenceIds: claimIds.flatMap(x => facts[x]?.evidenceIds || []), needsVerification: c.fact_ids.some(x => !facts[x] || facts[x].supportStatus !== 'supported'), visual: c.y_do_hinh, media: media || null, seconds: Math.max(4, Math.ceil(c.loi.split(/\s+/).length / 2.5)) };
        });
        if (body.action === 'rewrite') { const affected = new Set(p.sentences.filter(s => s.needsRewrite).map(s => s.id)); p.sentences = p.sentences.map((s, i) => affected.has(s.id) ? { ...built[i], id: s.id } : s); }
        else p.sentences = built;
        p.findings = []; p.reviewStatus = 'not-run'; audit(p, body.action, id, null, p.sentences.map(s => s.id));
      } else { p.findings = normalizeFindings(p, result.findings); p.reviewFeedbackIds = result.feedbackIds || []; p.reviewStatus = process.env.LLM_API_KEY && (process.env.LLM_PROVIDER || 'stub') !== 'stub' && !result.aiFailed ? 'complete' : 'partial'; audit(p, 'review', id, null, { findings: p.findings.length, feedbackIds: p.reviewFeedbackIds }); }
      p.run = { id: runId, status: 'complete', action: body.action, message: 'Đã hoàn thành', sequence };
      change(p); if (body.requestId) p.requestIds = [...p.requestIds, String(body.requestId)].slice(-50); await save(p); return p;
    });
  } catch (e) {
    await locked(id, async () => { const p = await getProject(id); if (p.run?.id === runId) { p.run.status = controller.signal.aborted ? 'cancelled' : 'error'; p.run.message = e.message; await save(p); } });
    throw e;
  } finally { runs.delete(id); }
}
