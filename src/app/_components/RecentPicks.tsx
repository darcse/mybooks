/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { formatAuthorName, formatComicAuthorName } from '@/lib/format';
import type { Book } from '@/app/books/types';
import type { Comic } from '@/app/comics/types';
import { RecentPicksAdultRow } from './RecentPicksAdultRow';
import layout from './DashboardLayout.module.css';

function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-surface-elevated ${className ?? ''}`}
      style={style}
      aria-hidden
    />
  );
}

function RecentPicksListSkeleton({ thumbClass }: { thumbClass: string }) {
  return (
    <div className="flex-1 space-y-3 pt-2" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className={`${thumbClass} shrink-0`} />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-full max-w-[12rem]" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentPicksSkeleton() {
  return (
    <div aria-busy="true" aria-label="Recent Picks 로딩 중">
      <Skeleton className="mb-4 h-7 w-40" />
      <div className={layout.recentPicksRow}>
        {[
          { titleW: 'w-28', thumb: 'h-14 w-10' },
          { titleW: 'w-28', thumb: 'h-14 w-10' },
          { titleW: 'w-28', thumb: 'h-14 w-10' },
        ].map((col, i) => (
          <div key={i} className={`${layout.recentPicksCol} flex flex-col rounded-sm border border-hairline bg-surface p-5`}>
            <div className="mb-5 flex items-center justify-between pt-0.5">
              <Skeleton className={`h-4 ${col.titleW}`} />
              <Skeleton className="h-4 w-14" />
            </div>
            <RecentPicksListSkeleton thumbClass={col.thumb} />
          </div>
        ))}
      </div>
    </div>
  );
}

export async function RecentPicks() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const isLoggedIn = Boolean(user);

  const [recentPurchaseRes, readingRes, recentComicsRes] = await Promise.all([
    supabase
      .from('books')
      .select('id,title,author,cover_image_url,is_adult,purchase_date')
      .not('purchase_date', 'is', null)
      .order('purchase_date', { ascending: false })
      .limit(5),
    supabase
      .from('books')
      .select('id,title,author,cover_image_url,is_adult,status')
      .eq('status', '읽는 중')
      .or('ownership_status.is.null,ownership_status.neq.방출')
      .or('format.is.null,format.neq.방출')
      .order('purchase_date', { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from('comics')
      .select('id,title,author,cover_image_url,is_adult,created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const recentBooks = (recentPurchaseRes.data ?? []) as Book[];
  const readingBooks = (readingRes.data ?? []) as Book[];
  const recentComics = (recentComicsRes.data ?? []) as Comic[];

  return (
    <>
      <h2 className="mb-4 flex items-center gap-2 border-b border-hairline pb-2 text-xl font-medium text-ink">
        <Sparkles className="size-5 shrink-0 text-mute" strokeWidth={1.5} /> Recent Picks
      </h2>
      <div className={layout.recentPicksRow}>
        <div className={`${layout.recentPicksCol} flex flex-col rounded-sm border border-hairline bg-surface p-5`}>
          <div className="mb-5 flex items-center justify-between pt-0.5">
            <h3 className="text-[15px] font-semibold text-ink">최근 구입 도서</h3>
            <Link href="/books" className="text-sm text-[var(--accent-blue)] transition-opacity hover:opacity-80">
              더보기 &rarr;
            </Link>
          </div>
          <div className="flex-1 space-y-3 pt-2">
            {recentBooks.length === 0 ? (
              <p className="py-6 text-center text-sm text-mute">등록된 도서가 없습니다.</p>
            ) : (
              recentBooks.map((book) => {
                const isAdultAndAnon = Boolean(book.is_adult) && !isLoggedIn;
                if (isAdultAndAnon) {
                  return <RecentPicksAdultRow key={book.id} book={book} />;
                }
                return (
                  <Link
                    key={book.id}
                    href={`/books?view=${book.id}`}
                    className="flex items-center gap-3 transition-opacity hover:opacity-95"
                  >
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt="표지"
                        className="h-14 w-10 shrink-0 rounded-sm border border-hairline object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-sm bg-surface-elevated text-[10px] text-mute" />
                    )}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-ink" dangerouslySetInnerHTML={{ __html: book.title }} />
                      <p className="truncate text-xs text-mute">{formatAuthorName(book.author)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className={`${layout.recentPicksCol} flex flex-col rounded-sm border border-hairline bg-surface p-5`}>
          <div className="mb-5 pt-0.5">
            <h3 className="text-[15px] font-semibold text-ink">읽는 중인 도서</h3>
          </div>
          <div className="flex-1 space-y-3 pt-2">
            {readingBooks.length === 0 ? (
              <p className="py-6 text-center text-sm text-mute">읽는 중인 도서가 없습니다.</p>
            ) : (
              readingBooks.map((book) => {
                const isAdultAndAnon = Boolean(book.is_adult) && !isLoggedIn;
                if (isAdultAndAnon) {
                  return <RecentPicksAdultRow key={book.id} book={book} />;
                }
                return (
                  <Link
                    key={book.id}
                    href={`/books?view=${book.id}`}
                    className="flex items-center gap-3 transition-opacity hover:opacity-95"
                  >
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt="표지"
                        className="h-14 w-10 shrink-0 rounded-sm border border-hairline object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-sm bg-surface-elevated text-[10px] text-mute" />
                    )}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-ink" dangerouslySetInnerHTML={{ __html: book.title }} />
                      <p className="truncate text-xs text-mute">{formatAuthorName(book.author)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className={`${layout.recentPicksCol} flex flex-col rounded-sm border border-hairline bg-surface p-5`}>
          <div className="mb-5 flex items-center justify-between pt-0.5">
            <h3 className="text-[15px] font-semibold text-ink">최근 구입 코믹스</h3>
            <Link href="/comics" className="text-sm text-[var(--accent-blue)] transition-opacity hover:opacity-80">
              더보기 &rarr;
            </Link>
          </div>
          <div className="flex-1 space-y-3 pt-2">
            {recentComics.length === 0 ? (
              <p className="py-6 text-center text-sm text-mute">등록된 코믹스가 없습니다.</p>
            ) : (
              recentComics.map((comic) => {
                const isAdultAndAnon = Boolean(comic.is_adult) && !isLoggedIn;
                if (isAdultAndAnon) {
                  return <RecentPicksAdultRow key={comic.id} book={comic} />;
                }
                return (
                  <Link
                    key={comic.id}
                    href={`/comics?view=${comic.id}`}
                    className="flex items-center gap-3 transition-opacity hover:opacity-95"
                  >
                    {comic.cover_image_url ? (
                      <img
                        src={comic.cover_image_url}
                        alt="표지"
                        className="h-14 w-10 shrink-0 rounded-sm border border-hairline object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-sm bg-surface-elevated text-[10px] text-mute" />
                    )}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-ink" dangerouslySetInnerHTML={{ __html: comic.title }} />
                      <p className="truncate text-xs text-mute">{formatComicAuthorName(comic.author)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
