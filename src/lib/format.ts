export function formatAuthorName(author: string | null | undefined): string {
  if (author == null || author === '') return '';
  const idx = author.indexOf('(지은이)');
  if (idx >= 0) return author.slice(0, idx).trim();
  return author.trim();
}
