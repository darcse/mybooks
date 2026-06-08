export function normalizePhotobookModelKey(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function matchesPhotobookRankFilter(rank: number, filter: string): boolean {
  if (filter === '전체') return true;
  if (filter === '미평가') return !rank || rank === 0;
  return String(rank) === filter;
}

export function normalizePhotobookStatusForFilter(raw: string | null | undefined): string {
  const s = (raw ?? '').trim();
  if (['컬렉션', 'Collection', '보유', '보유중'].includes(s)) return '보유중';
  if (s === '방출') return '방출';
  if (!s) return '보유중';
  return s;
}

export function displayPhotobookStatus(raw: string | null | undefined): string {
  return normalizePhotobookStatusForFilter(raw);
}

export function displayPhotobookCategory(category: string | null | undefined): string {
  if (category === '사진집') return '기타';
  return category || '-';
}
