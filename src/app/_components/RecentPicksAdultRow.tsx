'use client';

import { formatAuthorName } from '@/lib/format';
import type { Book } from '@/app/books/types';

type RowBook = Pick<Book, 'id' | 'title' | 'author'>;

export function RecentPicksAdultRow({ book }: { book: RowBook }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-95"
      onClick={() => alert('로그인 후 열람 가능한 도서입니다.')}
    >
      <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-sm border border-hairline bg-surface-elevated text-[10px] font-semibold text-mute">
        19
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="truncate text-sm font-semibold text-ink" dangerouslySetInnerHTML={{ __html: book.title }} />
        <p className="truncate text-xs text-mute">{formatAuthorName(book.author)}</p>
      </div>
    </button>
  );
}
