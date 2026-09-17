export function canUseSource(source) {
  if (['dung', 'dung-canh-bao'].includes(source.trang_thai)) return true;
  // A missing author or organization can be reviewed manually. Sources that
  // failed relevance or injection checks must stay out of the writing context.
  const scores = source.diem_tieu_chi;
  return source.trang_thai === 'loai'
    && Array.isArray(scores)
    && scores[0] === 0
    && scores[3] === 1
    && scores[4] === 1
    && typeof source.snapshot === 'string'
    && source.snapshot.length > 0
    && !source.cach_ly?.length;
}
