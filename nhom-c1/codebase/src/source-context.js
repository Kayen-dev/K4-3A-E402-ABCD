const normalize = text => String(text || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').toLowerCase();
const stopWords = new Set('va la cua cho ve cac nhung mot hoc bai muc tieu giup hieu co ban sau khi duoc nguoi sinh vien'.split(' '));
const terms = text => [...new Set(normalize(text).match(/[\p{L}\p{N}]{2,}/gu) || [])].filter(word => !stopWords.has(word));

// Select original spans, retaining their offsets and order. Never summarize or
// modify evidence here: the writer must still quote the supplied text exactly.
export function selectSourceContext(source, { topic = '', goal = '', budget = 8000 } = {}) {
  const text = source.snapshot || '';
  if (text.length <= budget) return text;
  const topicTerms = terms(topic), goalTerms = terms(goal);
  const windows = [];
  const size = Math.min(1000, budget);
  for (let start = 0; start < text.length; start += Math.max(1, size - 150)) {
    const end = Math.min(text.length, start + size);
    const words = new Set(terms(text.slice(start, end)));
    const score = topicTerms.reduce((sum, word) => sum + (words.has(word) ? 4 : 0), 0)
      + goalTerms.reduce((sum, word) => sum + (words.has(word) ? 1 : 0), 0);
    windows.push({ start, end, score: score + (start === 0 ? 0.5 : 0) });
  }
  for (const quote of source.trich_dan || []) {
    const start = typeof quote === 'string' ? text.indexOf(quote) : -1;
    if (start >= 0 && quote.length <= budget) windows.push({ start, end: start + quote.length, score: 20 });
  }
  const selected = [];
  let used = 0;
  for (const window of windows.sort((a, b) => b.score - a.score || a.start - b.start)) {
    if (selected.some(span => window.start < span.end && window.end > span.start)) continue;
    const cost = window.end - window.start + (selected.length ? 9 : 0);
    if (used + cost > budget) continue;
    selected.push(window);
    used += cost;
  }
  return selected.sort((a, b) => a.start - b.start).map(span => text.slice(span.start, span.end)).join('\n\n[...]\n\n');
}
