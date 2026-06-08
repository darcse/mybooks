'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatAuthorName, formatComicAuthorName } from '@/lib/format';
import { useAuthState } from '@/hooks/useAuthState';
import { createClient } from '@/lib/supabase/client';
import type { MonthlyReviewTimeline } from '@/app/api/monthly-review-comment/route';
import { BookDetailModal } from '@/app/books/_components/BookDetailModal';
import { ComicsDetailModal } from '@/app/comics/_components/ComicsDetailModal';
import { PhotobookDetailModal } from '@/app/photobook/_components/PhotobookDetailModal';
import { ArchivePhotobookGrid } from '@/app/archive/[year]/[month]/_components/ArchivePhotobookGrid';
import type { Book } from '@/app/books/types';
import type { Comic } from '@/app/comics/types';
import type { Photobook } from '@/app/photobook/types';

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function renderCommentLine(line: string, key: number) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={key}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </span>
  );
}

function MonthlyCommentBody({ comment }: { comment: string }) {
  const lines = comment.split('\n');
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-body sm:text-base">
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-1" aria-hidden />
        ) : (
          <p key={i}>{renderCommentLine(line, i)}</p>
        ),
      )}
    </div>
  );
}

function sortBooks(t: MonthlyReviewTimeline['booksFinished']) {
  return [...t].sort((a, b) => new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime());
}

function sortByCreatedAt<T extends { created_at: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

type Props = {
  year: number;
  month: number;
};

const bookGridClass = 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3';
const sectionTitleClass = 'mb-3 text-base font-medium text-ink';

export function MonthlyTimeline({ year, month }: Props) {
  const router = useRouter();
  const isAuthenticated = useAuthState();
  const [timeline, setTimeline] = useState<MonthlyReviewTimeline | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [viewingComic, setViewingComic] = useState<Comic | null>(null);
  const [viewingPhotobook, setViewingPhotobook] = useState<Photobook | null>(null);
  const [sameModelOpen, setSameModelOpen] = useState(false);

  const load = useCallback(
    async (opts: { refresh?: boolean; signal?: AbortSignal }) => {
      const refresh = opts.refresh ?? false;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const q = new URLSearchParams({ year: String(year), month: String(month) });
        if (refresh) q.set('refresh', '1');
        const res = await fetch(`/api/monthly-review-comment?${q.toString()}`, { signal: opts.signal });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          comment?: string | null;
          timeline?: MonthlyReviewTimeline;
        };
        if (!res.ok) {
          toast.error(body.error ?? '불러오지 못했습니다.');
          if (!refresh) {
            setTimeline(null);
            setComment(null);
          }
          return;
        }
        if (body.timeline) {
          const t = body.timeline;
          setTimeline({
            booksFinished: sortBooks(t.booksFinished),
            booksPurchased: t.booksPurchased ?? [],
            comics: sortByCreatedAt(t.comics),
            photobooks: sortByCreatedAt(t.photobooks),
          });
        } else {
          setTimeline(null);
        }
        setComment(body.comment ?? null);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        toast.error('네트워크 오류가 났습니다.');
      } finally {
        if (refresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [year, month],
  );

  useEffect(() => {
    const ac = new AbortController();
    void load({ signal: ac.signal });
    return () => ac.abort();
  }, [load]);

  const openBookById = async (id: number) => {
    const { data, error } = await createClient().from('books').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      toast.error('도서 정보를 불러오지 못했습니다.');
      return;
    }
    setViewingBook(data as Book);
  };

  const openComicById = async (id: number) => {
    const { data, error } = await createClient().from('comics').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      toast.error('만화 정보를 불러오지 못했습니다.');
      return;
    }
    setViewingComic(data as Comic);
  };

  const openPhotobookById = async (id: number) => {
    const { data, error } = await createClient().from('photobook').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      toast.error('포토북 정보를 불러오지 못했습니다.');
      return;
    }
    setViewingPhotobook(data as Photobook);
  };

  const busy = loading || refreshing;
  const t = timeline;
  const hasCommentActivity =
    t != null && t.booksFinished.length + t.photobooks.length > 0;
  const hasAny =
    t != null &&
    t.booksFinished.length + t.booksPurchased.length + t.comics.length + t.photobooks.length > 0;

  return (
    <div className="mt-6 flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-hairline bg-surface shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1 bg-[var(--accent-blue)]" aria-hidden />
        <div className="p-5 pl-6 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-base font-semibold text-ink">이달의 활동</span>
            {isAuthenticated === true ? (
              <button
                type="button"
                onClick={() => void load({ refresh: true })}
                disabled={busy || !hasCommentActivity}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-mute hover:text-body disabled:pointer-events-none disabled:opacity-40"
                aria-label="코멘트 새로고침"
                title="코멘트 새로고침"
              >
                <RefreshCw className={`size-4 shrink-0 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
          <div>
            {loading && !refreshing ? (
              <p className="flex items-center gap-2 text-sm text-mute">
                <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={2} aria-hidden />
                불러오는 중…
              </p>
            ) : comment != null && comment.trim() !== '' ? (
              <MonthlyCommentBody comment={comment} />
            ) : !hasCommentActivity ? (
              <p className="text-sm text-mute">이달 완독 도서·포토북 활동이 없어 코멘트가 없습니다.</p>
            ) : (
              <p className="text-sm text-mute">코멘트를 불러오지 못했습니다.</p>
            )}
          </div>
        </div>
      </div>

      {loading && !refreshing ? (
        <div
          className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-sm border border-hairline bg-surface py-10"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-8 shrink-0 animate-spin text-mute" strokeWidth={1.75} aria-hidden />
          <p className="text-sm text-body">타임라인을 불러오는 중…</p>
        </div>
      ) : !hasAny ? (
        <p className="text-sm text-body">이달에는 표시할 활동이 없습니다.</p>
      ) : (
        t && (
          <div className="flex flex-col gap-14 pt-6">
            {t.booksFinished.length > 0 && (
              <section>
                <h2 className={sectionTitleClass}>📚 완독 도서</h2>
                <div className={bookGridClass}>
                  {t.booksFinished.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => void openBookById(b.id)}
                      className="flex gap-4 rounded-sm border border-hairline bg-surface p-4 text-left transition-colors hover:bg-surface-elevated"
                    >
                      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-sm border border-hairline">
                        {b.cover_image_url ? (
                          <img
                            src={b.cover_image_url}
                            alt="표지"
                            className="block h-full w-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface-card text-xs text-mute">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden pt-1">
                        <h3 className="truncate text-sm font-medium text-ink">{stripHtml(b.title)}</h3>
                        <p className="mb-2 truncate text-xs text-mute">
                          {b.author ? formatAuthorName(b.author) : '—'}
                        </p>
                        <span className="inline-block rounded-sm bg-surface-elevated px-2 py-0.5 text-xs text-body">
                          {b.category ?? '—'}
                        </span>
                        <p className="mt-2 text-xs tabular-nums text-mute">
                          완독 {new Date(b.finished_at).toLocaleDateString('ko-KR')}
                        </p>
                        {b.memo?.trim() ? (
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-mute">{b.memo}</p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {t.comics.length > 0 && (
              <section>
                <h2 className={sectionTitleClass}>📖 코믹스</h2>
                <div className={bookGridClass}>
                  {t.comics.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => void openComicById(c.id)}
                      className="flex gap-4 rounded-sm border border-hairline bg-surface p-4 text-left transition-colors hover:bg-surface-elevated"
                    >
                      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-sm border border-hairline">
                        {c.cover_image_url ? (
                          <img
                            src={c.cover_image_url}
                            alt="표지"
                            className="block h-full w-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface-card text-xs text-mute">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden pt-1">
                        <h3 className="truncate text-sm font-medium text-ink">{stripHtml(c.title)}</h3>
                        <p className="mb-2 truncate text-xs text-mute">{formatComicAuthorName(c.author)}</p>
                        <span className="inline-block rounded-sm bg-surface-elevated px-2 py-0.5 text-xs text-body">
                          {c.category ?? '—'}
                        </span>
                        <p className="mt-2 text-xs tabular-nums text-mute">
                          등록 {new Date(c.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {t.photobooks.length > 0 && (
              <section className="mt-10 pt-6">
                <h2 className="mb-5 text-base font-medium text-ink">📷 포토북</h2>
                <ArchivePhotobookGrid
                  items={t.photobooks}
                  onSelect={(id) => void openPhotobookById(id)}
                />
              </section>
            )}
          </div>
        )
      )}

      {viewingBook && (
        <BookDetailModal
          viewingBook={viewingBook}
          onClose={() => setViewingBook(null)}
          onEdit={() => {
            const id = viewingBook.id;
            setViewingBook(null);
            router.push(`/books?edit=${id}`);
          }}
          onDelete={() => toast.info('삭제는 도서 화면에서 진행해 주세요.')}
          isAuthenticated={isAuthenticated}
        />
      )}

      {viewingComic && (
        <ComicsDetailModal
          viewingComic={viewingComic}
          onClose={() => setViewingComic(null)}
          onEdit={() => {
            const id = viewingComic.id;
            setViewingComic(null);
            router.push(`/comics?view=${id}`);
          }}
          onDelete={() => toast.info('삭제는 만화 화면에서 진행해 주세요.')}
          isAuthenticated={isAuthenticated}
        />
      )}

      {viewingPhotobook && (
        <PhotobookDetailModal
          viewingPhotobook={viewingPhotobook}
          matchedSameModel={[]}
          sameModelOpen={sameModelOpen}
          setSameModelOpen={setSameModelOpen}
          onClose={() => setViewingPhotobook(null)}
          onEdit={() => {
            const id = viewingPhotobook.id;
            setViewingPhotobook(null);
            router.push(`/photobook?view=${id}`);
          }}
          onDelete={() => toast.info('삭제는 포토북 화면에서 진행해 주세요.')}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
}
