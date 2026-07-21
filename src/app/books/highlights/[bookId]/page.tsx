import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Book, BookHighlight } from '../../types';
import {
  BookHighlightsPageContent,
  type BookHighlightListItem,
} from '../_components/BookHighlightsPageContent';

function BookHighlightsLoginPrompt() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="mb-3 text-xl font-medium text-ink">Book Highlights</h1>
      <p className="mb-6 text-[15px] leading-relaxed text-body">
        하이라이트 모아보기를 보려면 로그인이 필요합니다.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface-elevated px-5 py-2.5 text-sm font-medium text-body hover:text-ink"
      >
        로그인하기
      </Link>
    </div>
  );
}

type Props = {
  params: Promise<{ bookId: string }>;
};

export default async function BookHighlightDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return <BookHighlightsLoginPrompt />;

  const { bookId: rawBookId } = await params;
  const trimmedBookId = rawBookId.trim();
  if (!/^\d+$/.test(trimmedBookId)) {
    redirect('/books/highlights');
  }

  const bookId = Number(trimmedBookId);
  const supabase = await createClient();

  const { data: bookRow, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .maybeSingle();

  if (bookError) throw bookError;
  if (!bookRow) redirect('/books/highlights');

  const book = bookRow as Book;

  const { data: highlightRows, error: highlightError } = await supabase
    .from('book_highlights')
    .select('id, book_id, user_id, content, tags, created_at, updated_at, source_app, ai_explanation')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false });

  if (highlightError) throw highlightError;

  const bookSummary = {
    id: book.id,
    title: book.title,
    author: book.author,
    cover_image_url: book.cover_image_url,
  };

  const items: BookHighlightListItem[] = ((highlightRows as BookHighlight[]) || []).map(
    (highlight) => ({
      ...highlight,
      book: bookSummary,
    }),
  );

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-medium text-ink">
          <BookOpen className="size-7 shrink-0 text-mute" strokeWidth={1.5} />
          Books
        </h1>
      </div>
      <BookHighlightsPageContent
        items={items}
        library={[book]}
        fixedBookId={bookId}
        backHref="/books/highlights"
      />
    </div>
  );
}
