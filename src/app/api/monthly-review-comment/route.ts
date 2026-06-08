import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { generateMonthlyReviewComment } from '@/lib/gemini';

const MONTHLY_REVIEW_SYSTEM_INSTRUCTION = `너는 mybooks 앱의 개인 독서·컬렉션 큐레이터야.

제공된 활동 데이터에 없는 항목은 추측하거나 만들어내지 마. 코믹스·구매 도서·음악·오디오 관련 내용은 절대 언급하지 마.

아래 데이터만 근거로 한국어 월간 리포트를 작성해줘:
- 완독 도서
- 등록 포토북

출력 형식(마크다운 **굵게** 사용):
1) 첫 줄: "{year}년 {month}월의 독서·컬렉션 활동을 보고합니다."
2) 빈 줄
3) "**📚 {month}월 독서·컬렉션 리포트**"
4) 빈 줄
5) 2~3문장 서술 — 실제 제목·작가(모델)를 구체적으로 언급하고, 이달의 독서·컬렉션 성향과 장르 패턴을 분석
6) 빈 줄
7) 해당 데이터가 있을 때만 bullet:
- **도서:** (완독 목록을 한 줄로 요약)
- **포토북:** (등록 목록을 한 줄로 요약)

수박 겉핥기식 표현 금지.`;

export type MonthlyReviewTimeline = {
  booksFinished: {
    id: number;
    title: string;
    author: string | null;
    finished_at: string;
    cover_image_url: string | null;
    category: string | null;
    memo: string | null;
  }[];
  booksPurchased: {
    id: number;
    title: string;
    author: string | null;
    purchase_date: string;
    category: string | null;
  }[];
  comics: {
    id: number;
    title: string;
    author: string | null;
    created_at: string;
    cover_image_url: string | null;
    category: string | null;
  }[];
  photobooks: {
    id: number;
    title: string;
    author: string | null;
    created_at: string;
    cover_image_url: string | null;
    category: string | null;
  }[];
};

function monthUtcIsoRange(year: number, month: number): { startIso: string; endExclusiveIso: string } {
  const startIso = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const endExclusiveIso = new Date(Date.UTC(year, month, 1)).toISOString();
  return { startIso, endExclusiveIso };
}

function validYearMonth(year: number, month: number, now: Date): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month)) return false;
  if (month < 1 || month > 12) return false;
  if (year < 2026) return false;
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  if (year > cy || (year === cy && month > cm)) return false;
  return true;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function buildUserPrompt(year: number, month: number, t: MonthlyReviewTimeline): string {
  const blocks: string[] = [
    `${year}년 ${month}월 mybooks 활동 (완독 도서·포토북만):`,
    '',
  ];
  if (t.booksFinished.length) {
    blocks.push(
      `📚 완독 도서: ${t.booksFinished.map((b) => `${stripHtml(b.title)} - ${(b.author ?? '').trim()}`).join(', ')}`,
    );
  }
  if (t.photobooks.length) {
    blocks.push(
      `📷 등록 포토북: ${t.photobooks.map((p) => `${stripHtml(p.title)} - ${(p.author ?? '').trim()}`).join(', ')}`,
    );
  }
  return blocks.join('\n');
}

function hasCommentActivity(t: MonthlyReviewTimeline): boolean {
  return t.booksFinished.length + t.photobooks.length > 0;
}

async function loadTimeline(
  supabase: Awaited<ReturnType<typeof createClient>>,
  year: number,
  month: number,
): Promise<MonthlyReviewTimeline> {
  const { startIso, endExclusiveIso } = monthUtcIsoRange(year, month);
  const [booksFinishedRes, booksPurchasedRes, comicsRes, photobookRes] = await Promise.all([
    supabase
      .from('books')
      .select('id,title,author,finished_at,status,cover_image_url,category,memo')
      .eq('status', '완독')
      .not('finished_at', 'is', null)
      .gte('finished_at', startIso)
      .lt('finished_at', endExclusiveIso),
    supabase
      .from('books')
      .select('id,title,author,purchase_date,category')
      .not('purchase_date', 'is', null)
      .gte('purchase_date', startIso)
      .lt('purchase_date', endExclusiveIso),
    supabase
      .from('comics')
      .select('id,title,author,cover_image_url,category,created_at')
      .gte('created_at', startIso)
      .lt('created_at', endExclusiveIso),
    supabase
      .from('photobook')
      .select('id,title,author,cover_image_url,category,created_at')
      .gte('created_at', startIso)
      .lt('created_at', endExclusiveIso),
  ]);
  if (booksFinishedRes.error) throw new Error(booksFinishedRes.error.message);
  if (booksPurchasedRes.error) throw new Error(booksPurchasedRes.error.message);
  if (comicsRes.error) throw new Error(comicsRes.error.message);
  if (photobookRes.error) throw new Error(photobookRes.error.message);

  return {
    booksFinished: (booksFinishedRes.data ?? []) as MonthlyReviewTimeline['booksFinished'],
    booksPurchased: (booksPurchasedRes.data ?? []) as MonthlyReviewTimeline['booksPurchased'],
    comics: (comicsRes.data ?? []) as MonthlyReviewTimeline['comics'],
    photobooks: (photobookRes.data ?? []) as MonthlyReviewTimeline['photobooks'],
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const y = parseInt(req.nextUrl.searchParams.get('year') ?? '', 10);
    const m = parseInt(req.nextUrl.searchParams.get('month') ?? '', 10);
    const refresh =
      req.nextUrl.searchParams.get('refresh') === '1' ||
      req.nextUrl.searchParams.get('refresh') === 'true';
    const now = new Date();
    if (!validYearMonth(y, m, now)) {
      return NextResponse.json({ error: '연도 또는 월이 올바르지 않습니다.' }, { status: 400 });
    }
    const supabase = await createClient();
    const timeline = await loadTimeline(supabase, y, m);
    const activityText = buildUserPrompt(y, m, timeline);
    const hasAny = hasCommentActivity(timeline);

    let comment: string | null = null;
    if (!refresh) {
      const { data: cached, error: cErr } = await supabase
        .from('monthly_review_comments')
        .select('comment')
        .eq('year', y)
        .eq('month', m)
        .maybeSingle();
      if (cErr) {
        return NextResponse.json({ error: cErr.message }, { status: 500 });
      }
      const c = cached?.comment;
      if (typeof c === 'string' && c.trim() !== '') {
        comment = c.trim();
      }
    }

    if (comment == null) {
      if (!hasAny) {
        comment = null;
      } else {
        const generated = await generateMonthlyReviewComment(
          y,
          m,
          activityText,
          MONTHLY_REVIEW_SYSTEM_INSTRUCTION,
        );
        if (!generated) {
          return NextResponse.json({ error: '코멘트를 생성하지 못했습니다.' }, { status: 503 });
        }
        const { error: upErr } = await supabase.from('monthly_review_comments').upsert(
          {
            year: y,
            month: m,
            comment: generated,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'year,month' },
        );
        if (upErr) {
          return NextResponse.json({ error: upErr.message }, { status: 500 });
        }
        comment = generated;
      }
    }

    return NextResponse.json({ comment, timeline });
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
