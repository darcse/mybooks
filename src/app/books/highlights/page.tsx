import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Book, BookHighlight } from '../types';
import { BookHighlightsPageContent, type BookHighlightListItem } from './_components/BookHighlightsPageContent';
import { HighlightBookCards, type HighlightBookSummary } from './_components/HighlightBookCards';

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
  searchParams: Promise<{ bookId?: string }>;
};

function buildHighlightBookSummaries(
  books: Pick<Book, 'id' | 'title' | 'author' | 'cover_image_url' | 'category' | 'status'>[],
  countByBookId: Map<number, number>,
): HighlightBookSummary[] {
  return books
    .map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      cover_image_url: book.cover_image_url,
      category: book.category,
      status: book.status,
      highlightCount: countByBookId.get(book.id) ?? 0,
    }))
    .filter((book) => book.highlightCount > 0)
    .sort((a, b) => b.highlightCount - a.highlightCount || a.title.localeCompare(b.title, 'ko'));
}

export default async function BookHighlightsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) return <BookHighlightsLoginPrompt />;

  const sp = await searchParams;
  const initialBookId =
    typeof sp.bookId === 'string' && /^\d+$/.test(sp.bookId.trim()) ? sp.bookId.trim() : undefined;
  const showLegacyList = !!initialBookId;

  const supabase = await createClient();

  const { data: highlightRows, error: highlightError } = await supabase
    .from('book_highlights')
    .select('id, book_id, user_id, content, tags, created_at, updated_at, source_app, ai_explanation');

  if (highlightError) throw highlightError;

  const highlights = (highlightRows as BookHighlight[]) || [];
  const countByBookId = new Map<number, number>();
  highlights.forEach((row) => {
    countByBookId.set(row.book_id, (countByBookId.get(row.book_id) ?? 0) + 1);
  });

  const bookIds = Array.from(countByBookId.keys());

  if (!showLegacyList) {
    let summaries: HighlightBookSummary[] = [];
    if (bookIds.length > 0) {
      const { data: bookRows, error: bookError } = await supabase
        .from('books')
        .select('id, title, author, cover_image_url, category, status')
        .in('id', bookIds);

      if (bookError) throw bookError;
      summaries = buildHighlightBookSummaries(
        (bookRows as Pick<
          Book,
          'id' | 'title' | 'author' | 'cover_image_url' | 'category' | 'status'
        >[]) || [],
        countByBookId,
      );
    }

    return (
      <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-medium text-ink">
            <BookOpen className="size-7 shrink-0 text-mute" strokeWidth={1.5} />
            Books
          </h1>
        </div>
        <HighlightBookCards books={summaries} />
      </div>
    );
  }

  const { data: libraryRows, error: libraryError } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (libraryError) throw libraryError;

  let bookMap = new Map<number, Pick<Book, 'id' | 'title' | 'author' | 'cover_image_url'>>();

  if (bookIds.length > 0) {
    const { data: bookRows, error: bookError } = await supabase
      .from('books')
      .select('id, title, author, cover_image_url')
      .in('id', bookIds);

    if (bookError) throw bookError;

    bookMap = new Map(
      ((bookRows as Pick<Book, 'id' | 'title' | 'author' | 'cover_image_url'>[]) || []).map(
        (book) => [book.id, book],
      ),
    );
  }

  const items: BookHighlightListItem[] = highlights
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((highlight) => ({
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
      <BookHighlightsPageContent
        items={items}
        library={(libraryRows as Book[]) || []}
        initialBookId={initialBookId}
      />
    </div>
  );
}
