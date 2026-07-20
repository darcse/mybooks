import { NextRequest, NextResponse } from 'next/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { generateHighlightExplanation } from '@/lib/anthropic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { highlightId?: unknown; force?: unknown };
    const highlightId =
      typeof body.highlightId === 'number'
        ? body.highlightId
        : parseInt(String(body.highlightId ?? ''), 10);
    const force = body.force === true;

    if (!Number.isInteger(highlightId) || highlightId <= 0) {
      return NextResponse.json({ error: 'highlightId invalid' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: highlight, error: highlightError } = await supabase
      .from('book_highlights')
      .select('id, book_id, content, ai_explanation')
      .eq('id', highlightId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (highlightError) {
      return NextResponse.json({ error: highlightError.message }, { status: 500 });
    }
    if (!highlight) {
      return NextResponse.json({ error: '하이라이트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const cached = highlight.ai_explanation;
    if (!force && typeof cached === 'string' && cached.trim() !== '') {
      return NextResponse.json({ explanation: cached.trim() });
    }

    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('title, author')
      .eq('id', highlight.book_id)
      .maybeSingle();

    if (bookError) {
      return NextResponse.json({ error: bookError.message }, { status: 500 });
    }

    const explanation = await generateHighlightExplanation(
      typeof highlight.content === 'string' ? highlight.content : '',
      {
        title: typeof book?.title === 'string' ? book.title : '알 수 없는 도서',
        author: typeof book?.author === 'string' ? book.author : null,
      },
    );

    if (!explanation) {
      return NextResponse.json(
        { message: 'AI 해설을 생성하지 못했습니다.', explanation: null },
        { status: 503 },
      );
    }

    const { error: updateError } = await supabase
      .from('book_highlights')
      .update({
        ai_explanation: explanation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', highlightId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ explanation });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { highlightId?: unknown };
    const highlightId =
      typeof body.highlightId === 'number'
        ? body.highlightId
        : parseInt(String(body.highlightId ?? ''), 10);

    if (!Number.isInteger(highlightId) || highlightId <= 0) {
      return NextResponse.json({ error: 'highlightId invalid' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('book_highlights')
      .update({
        ai_explanation: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', highlightId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
