export function formatAuthorName(author: string | null | undefined): string {
  if (author == null || author === '') return '';
  const idx = author.indexOf('(지은이)');
  if (idx >= 0) return author.slice(0, idx).trim();
  return author.trim();
}

export function formatComicAuthorName(author: string | null | undefined): string {
  if (author == null || author === '') return '';
  const s = author.trim();
  const idx그림 = s.indexOf('(그림)');
  const idx지은이 = s.indexOf('(지은이)');
  const endAfter그림 = idx그림 >= 0 ? idx그림 + '(그림)'.length : s.length;
  const endBefore지은이 = idx지은이 >= 0 ? idx지은이 : s.length;
  const cut = Math.min(endAfter그림, endBefore지은이);
  if (cut < s.length) return s.slice(0, cut).trim();
  return s;
}
