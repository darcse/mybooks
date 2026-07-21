'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';
import { formatAuthorName } from '@/lib/format';
import { categoryOptions } from '../../constants';

export type HighlightBookSummary = {
  id: number;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  category: string;
  status: string;
  highlightCount: number;
};

const STATUS_FILTER_OPTIONS = ['전체', '읽기 전', '읽는 중', '완독', 'Collection'] as const;

function stripHtml(raw: string) {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesStatus(book: HighlightBookSummary, filter: string) {
  if (filter === '전체') return true;
  if (filter === 'Collection') return book.status === '컬렉션';
  return book.status === filter;
}

type HighlightBookCardsProps = {
  books: HighlightBookSummary[];
};

export function HighlightBookCards({ books }: HighlightBookCardsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState<string>('전체');

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      if (categoryFilter !== '전체' && book.category !== categoryFilter) return false;
      if (!matchesStatus(book, statusFilter)) return false;
      if (!q) return true;
      const title = stripHtml(book.title).toLowerCase();
      const author = (book.author ?? '').toLowerCase();
      return title.includes(q) || author.includes(q);
    });
  }, [books, categoryFilter, searchQuery, statusFilter]);

  return (
    <div className="mt-8 space-y-6 border-t border-hairline pt-8">
      <div className="mb-2 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/books"
            className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface-elevated p-2 text-body hover:text-ink"
            aria-label="소장 목록으로 돌아가기"
            title="소장 목록으로 돌아가기"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
          </Link>
          <h2 className="text-lg font-medium text-ink">하이라이트</h2>
        </div>
      </div>

      <div className="rounded-sm border border-hairline bg-surface-elevated p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_1fr]">
          <label className="space-y-2 text-sm">
            <span className="block font-medium text-mute">도서 검색</span>
            <div className="relative">
              <input
                className="h-[42px] w-full rounded-md border border-hairline bg-surface px-3 py-2 pr-8 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]"
                placeholder="도서명, 저자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-mute hover:text-body"
                  onClick={() => setSearchQuery('')}
                  title="검색어 지우기"
                  aria-label="검색어 지우기"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </label>
          <div className="space-y-2 text-sm">
            <span className="block font-medium text-mute">필터</span>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-[42px] min-w-[140px] flex-1 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-[var(--hairline-strong)] sm:flex-none sm:min-w-[160px]"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="전체">카테고리: 전체</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                className="h-[42px] min-w-[140px] flex-1 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-[var(--hairline-strong)] sm:flex-none sm:min-w-[160px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_FILTER_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    상태: {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm font-medium text-body">
        총 <span className="text-ink">{filteredBooks.length}</span>권
      </p>

      {books.length === 0 ? (
        <div className="rounded-sm border border-hairline bg-surface-elevated px-5 py-12 text-center text-sm text-mute">
          하이라이트가 등록된 도서가 없습니다.
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="rounded-sm border border-hairline bg-surface-elevated px-5 py-12 text-center text-sm text-mute">
          조건에 맞는 도서가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/books/highlights/${book.id}`}
              className="flex gap-4 rounded-sm border border-hairline bg-surface p-4 transition-colors hover:bg-surface-elevated"
            >
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-sm border border-hairline">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-elevated text-xs text-mute">
                    No cover
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p
                    className="line-clamp-2 text-sm font-semibold text-ink"
                    dangerouslySetInnerHTML={{ __html: book.title }}
                  />
                  <span className="shrink-0 rounded-full border border-hairline bg-surface-elevated px-2 py-0.5 text-xs font-medium text-body tabular-nums">
                    {book.highlightCount}
                  </span>
                </div>
                {book.author ? (
                  <p className="truncate text-sm text-body">{formatAuthorName(book.author)}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
