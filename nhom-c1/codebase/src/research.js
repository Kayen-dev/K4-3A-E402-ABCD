import { quyetDinhNguon } from './pipeline.js';
import { validatePublicUrl, scrape } from './scrape.js';
import { createHash } from 'node:crypto';

export async function searchUrls(topic, goal = '', signal) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) { const e = new Error('Chưa cấu hình tìm kiếm. Liên hệ người quản trị hoặc thêm URL tài liệu.'); e.code = 'SEARCH_NOT_CONFIGURED'; throw e; }
  const objectives = String(goal).split(/[\n.;]+/).map(x => x.trim()).filter(Boolean).slice(0, 3);
  const queries = [...new Set([
    topic,
    ...objectives.map(objective => `${topic} ${objective}`),
    `${topic} nghiên cứu tài liệu`,
    `${topic} research evidence`,
  ])];
  const MAX_SOURCES = 20;
  const groups = [];
  for (const query of queries) {
    const group = [];
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST', signal,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query, search_depth: 'basic', max_results: 10, include_answer: false }),
    });
    if (!res.ok) throw new Error(`Tìm kiếm gặp lỗi HTTP ${res.status}`);
    const data = await res.json();
    for (const row of data.results || []) {
      try {
        const url = await validatePublicUrl(row.url);
        const normalized = new URL(url); normalized.hash = ''; normalized.searchParams.delete('utm_source'); normalized.searchParams.delete('utm_medium');
        group.push(normalized.toString());
      } catch { /* Skip private and invalid URLs. */ }
    }
    groups.push(group);
  }
  const found = new Set();
  for (let rank = 0; rank < 10; rank++) for (const group of groups) {
    if (group[rank]) found.add(group[rank]);
    if (found.size >= MAX_SOURCES) return [...found];
  }
  return [...found];
}

export async function assessUrls(urls, topic, goal = '', emit = () => {}, signal) {
  const output = [];
  let index = 0;
  async function worker() {
    while (index < urls.length && !signal?.aborted) {
      const i = index++;
      let result;
      if (!process.env.LLM_API_KEY || (process.env.LLM_PROVIDER || 'stub') === 'stub') {
        const page = await scrape(urls[i], { signal });
        result = { url: urls[i], meta: page.meta, media: page.media || [], snapshot: page.text, snapshot_hash: page.ok ? createHash('sha256').update(page.text).digest('hex') : null,
          extraction_method: page.extraction_method, fetched_at: page.fetched_at,
          trang_thai: page.lenh_an?.length ? 'loai' : page.ok ? 'chua-cham' : 'khong-doc-duoc', cach_ly: page.lenh_an || [], trich_dan: [],
          ly_do: page.ok ? 'Đã đọc trang nhưng chưa đánh giá được. Liên hệ người quản trị để cấu hình dịch vụ.' : page.ly_do };
      } else result = await quyetDinhNguon(urls[i], { chu_de: topic, muc_tieu: goal, signal });
      output[i] = { ...result, nguon_id: `s${i + 1}`, approved: false };
      emit({ type: 'progress', message: `Đã đọc ${output.filter(Boolean).length}/${urls.length} tài liệu`, source: output[i] });
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, urls.length) }, worker));
  return output.filter(Boolean);
}
