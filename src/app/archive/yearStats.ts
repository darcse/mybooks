import { createClient } from '@/lib/supabase/server';

export type ArchiveMonthCard = {
  month: number;
  booksFinished: number;
  photobooks: number;
  thumbnails: string[];
};

type Bucket = {
  booksFinished: number;
  photobooks: number;
};

type MonthImageLists = {
  books: string[];
  photobooks: string[];
};

function utcMonth(iso: string): number {
  return new Date(iso).getUTCMonth() + 1;
}

function emptyMonthImages(): MonthImageLists {
  return { books: [], photobooks: [] };
}

function pushUrl(list: string[], url: string | null | undefined): void {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return;
  list.push(u);
}

function pickUniqueUrls(urls: string[], limit: number, seen: Set<string>): string[] {
  const out: string[] = [];
  for (const raw of urls) {
    const u = typeof raw === 'string' ? raw.trim() : '';
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= limit) break;
  }
  return out;
}

function buildMonthThumbnails(lists: MonthImageLists): string[] {
  const seen = new Set<string>();
  const { books, photobooks } = lists;
  if (books.length > 0 && photobooks.length > 0) {
    return [
      ...pickUniqueUrls(books, 1, seen),
      ...pickUniqueUrls(photobooks, 1, seen),
    ];
  }
  if (books.length > 0) return pickUniqueUrls(books, 2, seen);
  return pickUniqueUrls(photobooks, 2, seen);
}

export async function loadArchiveYearStats(year: number): Promise<ArchiveMonthCard[]> {
  const supabase = await createClient();
  const startIso = new Date(Date.UTC(year, 0, 1)).toISOString();
  const endIso = new Date(Date.UTC(year + 1, 0, 1)).toISOString();
  const buckets: Record<number, Bucket> = {};
  const imagesByMonth: Record<number, MonthImageLists> = {};
  for (let mo = 1; mo <= 12; mo++) {
    buckets[mo] = { booksFinished: 0, photobooks: 0 };
    imagesByMonth[mo] = emptyMonthImages();
  }
  const [booksRes, photobookRes] = await Promise.all([
    supabase
      .from('books')
      .select('finished_at,cover_image_url')
      .eq('status', '완독')
      .not('finished_at', 'is', null)
      .gte('finished_at', startIso)
      .lt('finished_at', endIso)
      .order('finished_at', { ascending: false }),
    supabase
      .from('photobook')
      .select('created_at,cover_image_url')
      .gte('created_at', startIso)
      .lt('created_at', endIso),
  ]);
  if (booksRes.error) throw new Error(booksRes.error.message);
  if (photobookRes.error) throw new Error(photobookRes.error.message);
  const booksSorted = [...(booksRes.data ?? [])].sort(
    (a, b) => new Date(b.finished_at ?? 0).getTime() - new Date(a.finished_at ?? 0).getTime(),
  );
  for (const row of booksSorted) {
    if (!row.finished_at) continue;
    const mo = utcMonth(row.finished_at);
    if (mo < 1 || mo > 12) continue;
    buckets[mo].booksFinished += 1;
    pushUrl(imagesByMonth[mo].books, row.cover_image_url);
  }
  for (const row of photobookRes.data ?? []) {
    if (!row.created_at) continue;
    const mo = utcMonth(row.created_at);
    if (mo < 1 || mo > 12) continue;
    buckets[mo].photobooks += 1;
    pushUrl(imagesByMonth[mo].photobooks, row.cover_image_url);
  }
  const out: ArchiveMonthCard[] = [];
  for (let mo = 1; mo <= 12; mo++) {
    const b = buckets[mo];
    if (b.booksFinished === 0 && b.photobooks === 0) continue;
    out.push({
      month: mo,
      booksFinished: b.booksFinished,
      photobooks: b.photobooks,
      thumbnails: buildMonthThumbnails(imagesByMonth[mo]),
    });
  }
  return out;
}
