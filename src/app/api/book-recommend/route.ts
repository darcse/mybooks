import { NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { generateBookReadingRecommendations } from '@/lib/gemini';
import { searchAladinBooks } from '@/lib/aladin';
import { getOwnershipStatus } from '@/app/books/utils';
import type { Book } from '@/app/books/types';

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function matchScore(book: Book, aiTitle: string, aiAuthor: string): number {
  const bt = stripHtml((book.title || '').trim()).toLowerCase();
  const ba = stripHtml((book.author || '').trim()).toLowerCase();
  const at = stripHtml(aiTitle.trim()).toLowerCase();
  const aa = stripHtml((aiAuthor || '').trim()).toLowerCase();
  if (!at) return 0;
  if (bt === at && (!aa || ba === aa)) return 1000;
  if (bt === at) return 800;
  const cbt = bt.replace(/\s/g, '');
  const cat = at.replace(/\s/g, '');
  if (cbt && cat && cbt === cat) return 700;
  if (cbt && cat && (cbt.includes(cat) || cat.includes(cbt)))
    return 500 + Math.min(cbt.length, cat.length);
  return 0;
}

function bestUnreadMatch(books: Book[], title: string, author: string): Book | null {
  let best: Book | null = null;
  let hi = 0;
  for (const b of books) {
    const s = matchScore(b, title, author);
    if (s > hi) {
      hi = s;
      best = b;
    }
  }
  return hi >= 500 ? best : null;
}

function aladinSearchFallbackUrl(title: string): string {
  return `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&KeyWord=${encodeURIComponent(title.trim())}`;
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase.from('books').select('*');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const library = (data ?? []) as Book[];
    const finished = library.filter((b) => b.status === '완독');
    if (finished.length === 0) {
      return NextResponse.json(
        { error: '완독한 도서가 없어 추천을 생성할 수 없습니다.' },
        { status: 400 }
      );
    }
    const unreadOwned = library.filter(
      (b) =>
        getOwnershipStatus(b) === '보유중' &&
        (b.status === '읽기 전' || b.status === '읽는 중')
    );
    const finishedPayload = finished.map((b) => ({
      title: b.title,
      author: b.author,
      category: b.category,
    }));
    const unreadPayload = unreadOwned.map((b) => ({
      title: b.title,
      author: b.author,
      category: b.category,
    }));
    let raw;
    try {
      raw = await generateBookReadingRecommendations(finishedPayload, unreadPayload);
    } catch {
      return NextResponse.json({ error: '추천 생성에 실패했습니다.' }, { status: 503 });
    }
    if (!raw) {
      return NextResponse.json({ error: '응답을 해석하지 못했습니다.' }, { status: 502 });
    }
    const matched =
      unreadOwned.length > 0 ? bestUnreadMatch(unreadOwned, raw.owned.title, raw.owned.author) : null;
    const coverRaw = matched?.cover_image_url;
    const cover_image_url =
      typeof coverRaw === 'string' && coverRaw.trim() !== '' ? coverRaw.trim() : null;
    const ownedTitle = matched ? matched.title : raw.owned.title;
    const ownedAuthor = matched ? (matched.author ?? '') : raw.owned.author;

    let detail_url = aladinSearchFallbackUrl(raw.external.title);
    const q = `${raw.external.title} ${raw.external.author}`.trim().slice(0, 120);
    if (q) {
      try {
        const { items } = await searchAladinBooks(q);
        const link = items[0]?.link;
        if (typeof link === 'string' && link.trim() !== '') {
          detail_url = link.trim().replace(/^http:\/\//i, 'https://');
        }
      } catch {
        /* fallback URL */
      }
    }

    return NextResponse.json({
      owned: {
        title: ownedTitle,
        author: ownedAuthor,
        reason: raw.owned.reason,
        cover_image_url,
      },
      external: {
        ...raw.external,
        detail_url,
      },
      unreadOwnedCount: unreadOwned.length,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
