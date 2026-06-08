'use client';

import { useEffect } from 'react';

export type BookRecommendPayload = {
  owned: {
    title: string;
    author: string;
    reason: string;
    cover_image_url: string | null;
  };
  external: { title: string; author: string; reason: string; detail_url: string };
  unreadOwnedCount: number;
};

type BookRecommendModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  data: BookRecommendPayload | null;
  emptyMessage?: string | null;
};

export function BookRecommendModal({
  open,
  onClose,
  loading,
  data,
  emptyMessage = null,
}: BookRecommendModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-sm border border-hairline bg-surface p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-4 text-2xl font-medium text-mute hover:text-ink"
        >
          &times;
        </button>
        <h2 className="pr-8 text-xl font-medium text-ink">다음에 읽을 책 추천</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="size-10 animate-spin rounded-full border-2 border-hairline border-t-ink" />
            <p className="text-sm text-mute">추천을 생성하는 중입니다…</p>
          </div>
        ) : emptyMessage ? (
          <p className="py-8 text-sm leading-relaxed text-body">{emptyMessage}</p>
        ) : data ? (
          <>
            <section>
              <p className="mb-3 text-sm font-medium text-ink">보유 중 미독서 추천</p>
              {data.unreadOwnedCount === 0 ? (
                <p className="text-sm leading-relaxed text-body">
                  보유 중인 미독서 도서가 없어 소장 목록에서의 추천은 표시할 수 없습니다.
                </p>
              ) : (
                <div className="flex gap-4 rounded-sm border border-hairline bg-surface-elevated p-4">
                  {data.owned.cover_image_url ? (
                    <img
                      src={data.owned.cover_image_url}
                      alt=""
                      className="h-[104px] w-16 shrink-0 rounded-sm border border-hairline object-cover"
                    />
                  ) : (
                    <div className="h-[104px] w-16 shrink-0 rounded-sm border border-hairline bg-surface-card" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-medium leading-snug text-ink">
                      {data.owned.title || '—'}
                    </p>
                    <p className="text-xs text-mute">{data.owned.author || '—'}</p>
                    <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-body">
                      {data.owned.reason || '—'}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="border-t border-hairline pt-1">
              <p className="mb-3 text-sm font-medium text-ink">이 책은 어때?</p>
              <div className="space-y-2 rounded-sm border border-hairline bg-surface-elevated p-4">
                <a
                  href={data.external.detail_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium leading-snug text-ink underline-offset-4 hover:underline"
                >
                  {data.external.title}
                </a>
                <p className="text-xs text-mute">{data.external.author || '—'}</p>
                <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-body">
                  {data.external.reason || '—'}
                </p>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
