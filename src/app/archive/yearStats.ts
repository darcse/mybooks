import { createClient } from '@/lib/supabase/server';

export type ArchiveMonthCard = {
  month: number;
  booksFinished: number;
  comics: number;
  photobooks: number;
  thumbnails: string[];
};

type Bucket = {
  booksFinished: number;
  comics: number;
  photobooks: number;
};

type MonthImageLists = {
  books: string[];
  comics: string[];
  photobooks: string[];
};

function utcMonth(iso: string): number {
  return new Date(iso).getUTCMonth() + 1;
}

function emptyMonthImages(): MonthImageLists {
  return { books: [], comics: [], photobooks: [] };
}

function pushUrl(list: string[], url: string | null | undefined): void {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return;
  list.push(u);
}

function buildMonthThumbnails(lists: MonthImageLists, max = 6): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (url: string | null | undefined): boolean => {
    const u = typeof url === 'string' ? url.trim() : '';
    if (!u || seen.has(u)) return false;
    seen.add(u);
    out.push(u);
    return true;
  };
  const pools = [lists.books, lists.comics, lists.photobooks].filter((p) => p.length > 0);
  let round = 0;
  while (out.length < max && pools.length > 0) {
    let progressed = false;
    for (const pool of pools) {
      if (out.length >= max) break;
      if (round < pool.length) {
        push(pool[round]);
        progressed = true;
      }
    }
    if (!progressed) break;
    round++;
  }
  return out;
}

export async function loadArchiveYearStats(year: number): Promise<ArchiveMonthCard[]> {
  const supabase = await createClient();
  const startIso = new Date(Date.UTC(year, 0, 1)).toISOString();
  const endIso = new Date(Date.UTC(year + 1, 0, 1)).toISOString();
  const buckets: Record<number, Bucket> = {};
  const imagesByMonth: Record<number, MonthImageLists> = {};
  for (let mo = 1; mo <= 12; mo++) {
    buckets[mo] = { booksFinished: 0, comics: 0, photobooks: 0 };
    imagesByMonth[mo] = emptyMonthImages();
  }
  const [booksRes, comicsRes, photobookRes] = await Promise.all([
    supabase
      .from('books')
      .select('finished_at,cover_image_url')
      .eq('status', '완독')
      .not('finished_at', 'is', null)
      .gte('finished_at', startIso)
      .lt('finished_at', endIso)
      .order('finished_at', { ascending: false }),
    supabase
      .from('comics')
      .select('publish_date,cover_image_url')
      .not('publish_date', 'is', null)
      .gte('publish_date', startIso)
      .lt('publish_date', endIso),
    supabase
      .from('photobook')
      .select('purchase_date,cover_image_url')
      .not('purchase_date', 'is', null)
      .gte('purchase_date', startIso)
      .lt('purchase_date', endIso),
  ]);
  if (booksRes.error) throw new Error(booksRes.error.message);
  if (comicsRes.error) throw new Error(comicsRes.error.message);
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
  for (const row of comicsRes.data ?? []) {
    if (!row.publish_date) continue;
    const mo = utcMonth(row.publish_date);
    if (mo < 1 || mo > 12) continue;
    buckets[mo].comics += 1;
    pushUrl(imagesByMonth[mo].comics, row.cover_image_url);
  }
  for (const row of photobookRes.data ?? []) {
    if (!row.purchase_date) continue;
    const mo = utcMonth(row.purchase_date);
    if (mo < 1 || mo > 12) continue;
    buckets[mo].photobooks += 1;
    pushUrl(imagesByMonth[mo].photobooks, row.cover_image_url);
  }
  const out: ArchiveMonthCard[] = [];
  for (let mo = 1; mo <= 12; mo++) {
    const b = buckets[mo];
    const total = b.booksFinished + b.comics + b.photobooks;
    if (total === 0) continue;
    out.push({
      month: mo,
      booksFinished: b.booksFinished,
      comics: b.comics,
      photobooks: b.photobooks,
      thumbnails: buildMonthThumbnails(imagesByMonth[mo], 6),
    });
  }
  return out;
}
