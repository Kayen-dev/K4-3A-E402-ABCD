export function canUseSource(source) {
  if (['dung', 'dung-canh-bao'].includes(source.trang_thai)) return true;
  // Quality/relevance is advisory: the teacher may approve a rejected source.
  // Content quarantined for instructions targeting AI remains excluded.
  return source.trang_thai === 'loai'
    && source.diem_tieu_chi?.[4] !== 0
    && typeof source.snapshot === 'string'
    && source.snapshot.trim().length > 0
    && !source.cach_ly?.length;
}
