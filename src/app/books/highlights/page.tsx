import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Book, BookHighlight } from '../types';
import { BookHighlightsPageContent, type BookHighlightListItem } from './_components/BookHighlightsPageContent';

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

export default async function BookHighlightsPage() {
  const user = await getCurrentUser();
  if (!user) return <BookHighlightsLoginPrompt />;

  const supabase = await createClient();
  const { data: libraryRows, error: libraryError } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (libraryError) throw libraryError;

  const { data: highlightRows, error: highlightError } = await supabase
    .from('book_highlights')
    .select('id, book_id, user_id, content, tags, created_at, updated_at, source_app')
    .order('created_at', { ascending: false });

  if (highlightError) throw highlightError;

  const highlights = (highlightRows as BookHighlight[]) || [];
  const bookIds = Array.from(new Set(highlights.map((row) => row.book_id)));
  let bookMap = new Map<number, Pick<Book, 'id' | 'title' | 'author' | 'cover_image_url'>>();

  if (bookIds.length > 0) {
    const { data: bookRows, error: bookError } = await supabase
      .from('books')
      .select('id, title, author, cover_image_url')
      .in('id', bookIds);

    if (bookError) throw bookError;

    bookMap = new Map(
      ((bookRows as Pick<Book, 'id' | 'title' | 'author' | 'cover_image_url'>[]) || []).map(
        (book) => [book.id, book]
      )
    );
  }

  const items: BookHighlightListItem[] = highlights.map((highlight) => ({
    ...highlight,
    book: bookMap.get(highlight.book_id) || {
      id: highlight.book_id,
      title: '알 수 없는 도서',
      author: null,
      cover_image_url: null,
    },
  }));

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-medium text-ink">
          <BookOpen className="size-7 shrink-0 text-mute" strokeWidth={1.5} />
          Books
        </h1>
      </div>
      <BookHighlightsPageContent items={items} library={(libraryRows as Book[]) || []} />
    </div>
  );
}
