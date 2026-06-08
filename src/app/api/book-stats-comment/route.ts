import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { generateBookStatsYearComment } from '@/lib/gemini';

function yearInRange(year: number, maxYear: number) {
  return Number.isInteger(year) && year >= 2020 && year <= maxYear;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const raw = req.nextUrl.searchParams.get('year');
    const year = parseInt(String(raw ?? ''), 10);
    const maxY = new Date().getFullYear();
    if (!yearInRange(year, maxY)) {
      return NextResponse.json({ error: 'year invalid' }, { status: 400 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('book_stats_comments')
      .select('comment')
      .eq('user_id', user.id)
      .eq('year', year)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const c = data?.comment;
    return NextResponse.json({
      comment: typeof c === 'string' && c.trim() !== '' ? c : null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = (await req.json()) as { year?: unknown; force?: unknown };
    const year = typeof body.year === 'number' ? body.year : parseInt(String(body.year ?? ''), 10);
    const force = body.force === true;
    const maxY = new Date().getFullYear();
    if (!yearInRange(year, maxY)) {
      return NextResponse.json({ error: 'year invalid' }, { status: 400 });
    }
    const supabase = await createClient();
    if (!force) {
      const { data: cached } = await supabase
        .from('book_stats_comments')
        .select('comment')
        .eq('user_id', user.id)
        .eq('year', year)
        .maybeSingle();
      const c = cached?.comment;
      if (typeof c === 'string' && c.trim() !== '') {
        return NextResponse.json({ comment: c.trim() });
      }
    }
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('title,author,category,finished_at,status')
      .eq('status', '완독')
      .not('finished_at', 'is', null)
      .gte('finished_at', start)
      .lte('finished_at', end);
    if (booksError) {
      return NextResponse.json({ error: booksError.message }, { status: 500 });
    }
    const list = (books ?? []).filter((b) => b.finished_at);
    if (list.length === 0) {
      return NextResponse.json({ comment: null, message: 'no finished books' });
    }
    const comment = await generateBookStatsYearComment(
      year,
      list.map((b) => ({
        title: typeof b.title === 'string' ? b.title : '',
        author: typeof b.author === 'string' ? b.author : null,
        category: typeof b.category === 'string' ? b.category : '',
      })),
    );
    if (!comment) {
      return NextResponse.json(
        { message: '코멘트를 생성하지 못했습니다.', comment: null },
        { status: 503 },
      );
    }
    const { error: upsertError } = await supabase.from('book_stats_comments').upsert(
      {
        user_id: user.id,
        year,
        comment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,year' },
    );
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
