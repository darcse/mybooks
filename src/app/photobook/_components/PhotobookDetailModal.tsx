'use client';

import { useEffect, useState } from 'react';
import { BookOpen, FileText, Pencil, Trash2 } from 'lucide-react';
import { InlineSpinner } from '@/components/AsyncMutationUi';
import type { Photobook, SameModelPhotobookItem } from '../types';
import { displayPhotobookCategory, displayPhotobookStatus } from '../utils';
import { SameModelPhotobooks } from './SameModelPhotobooks';

interface PhotobookDetailModalProps {
  viewingPhotobook: Photobook;
  matchedSameModel: SameModelPhotobookItem[];
  sameModelOpen: boolean;
  setSameModelOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAuthenticated: boolean | null;
  isDeleting?: boolean;
}

type WikiSummary = {
  title: string;
  extract: string;
  type?: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page: string } };
};

export function PhotobookDetailModal({
  viewingPhotobook,
  matchedSameModel,
  sameModelOpen,
  setSameModelOpen,
  onClose,
  onEdit,
  onDelete,
  isAuthenticated,
  isDeleting = false,
}: PhotobookDetailModalProps) {
  const modelName = viewingPhotobook.author || '모델';
  const displayStatus = displayPhotobookStatus(viewingPhotobook.status);
  const displayCategory = displayPhotobookCategory(viewingPhotobook.category);
  const [wikiData, setWikiData] = useState<WikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!viewingPhotobook.author?.trim()) {
      setWikiData(null);
      setWikiLoading(false);
      return;
    }
    setWikiData(null);
    setWikiLoading(true);
    const encoded = encodeURIComponent(viewingPhotobook.author.trim());
    fetch(`https://ja.wikipedia.org/api/rest_v1/page/summary/${encoded}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WikiSummary | null) => {
        if (data?.extract && data.type !== 'disambiguation') {
          setWikiData(data);
        }
      })
      .catch(() => null)
      .finally(() => setWikiLoading(false));
  }, [viewingPhotobook.author]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-hairline bg-surface p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-4 text-2xl font-medium text-mute hover:text-ink"
        >
          &times;
        </button>
        <h2
          className="mb-4 pr-8 text-xl font-medium text-ink"
          dangerouslySetInnerHTML={{ __html: viewingPhotobook.title }}
        />
        <div className="mb-6 flex flex-col gap-6 border-b border-hairline pb-6 sm:flex-row">
          {viewingPhotobook.cover_image_url ? (
            <img
              src={viewingPhotobook.cover_image_url}
              alt="표지"
              className="mx-auto h-48 w-32 shrink-0 rounded-sm border border-hairline object-cover sm:mx-0"
            />
          ) : (
            <div className="mx-auto flex h-48 w-32 shrink-0 items-center justify-center rounded-sm border border-hairline bg-surface-card text-xs text-mute sm:mx-0">
              No Image
            </div>
          )}
          <div className="flex-1 space-y-2 pt-4 text-sm text-body">
            <p>
              <strong className="text-ink">모델:</strong> {viewingPhotobook.author || '-'}
            </p>
            <p>
              <strong className="text-ink">출판사:</strong> {viewingPhotobook.publisher || '-'}
            </p>
            <p>
              <strong className="text-ink">발매일:</strong> {viewingPhotobook.publish_date || '-'}
            </p>
            <p>
              <strong className="text-ink">ISBN:</strong> {viewingPhotobook.isbn || '-'}
            </p>
            <p>
              <strong className="text-ink">판매가:</strong>{' '}
              {viewingPhotobook.price
                ? `${Number(viewingPhotobook.price).toLocaleString()}원`
                : '-'}
            </p>
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm text-body">
          <p>
            <strong className="text-ink">카테고리:</strong> {displayCategory}
          </p>
          <p>
            <strong className="text-ink">형태:</strong> {viewingPhotobook.format || '-'}
          </p>
          <p>
            <strong className="text-ink">상태:</strong> {displayStatus}
          </p>
          <p>
            <strong className="text-ink">구입일:</strong> {viewingPhotobook.purchase_date || '-'}
          </p>
          <p>
            <strong className="text-ink">별점:</strong>{' '}
            {viewingPhotobook.rank > 0 ? '⭐'.repeat(viewingPhotobook.rank) : '미평가'}
          </p>
        </div>
        <div className="space-y-4 border-t border-hairline pt-6 text-sm">
          {wikiLoading && viewingPhotobook.author?.trim() && (
            <div className="flex items-center gap-2 py-3 text-mute">
              <span className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-hairline border-t-ink" />
              <span className="text-xs">Wikipedia 정보 불러오는 중...</span>
            </div>
          )}
          {!wikiLoading && wikiData && (
            <div className="border-b border-hairline pb-4">
              <strong className="mb-3 flex items-center text-ink">
                <BookOpen className="mr-1.5 size-4 shrink-0 text-mute" />
                Wikipedia
              </strong>
              <div className="flex gap-4">
                {wikiData.thumbnail?.source && (
                  <img
                    src={wikiData.thumbnail.source}
                    alt={wikiData.title}
                    className="h-24 w-20 shrink-0 rounded-sm border border-hairline object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-6 text-sm leading-relaxed text-body">
                    {wikiData.extract}
                  </p>
                  {wikiData.content_urls?.desktop?.page && (
                    <a
                      href={wikiData.content_urls.desktop.page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-ink underline underline-offset-4"
                    >
                      Wikipedia에서 더 보기 →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          {matchedSameModel.length > 0 && (
            <SameModelPhotobooks
              modelName={modelName}
              items={matchedSameModel}
              open={sameModelOpen}
              onToggle={() => setSameModelOpen((o) => !o)}
            />
          )}
          {viewingPhotobook.memo?.trim() && (
            <div>
              <strong className="mb-2 flex items-center text-ink">
                <FileText className="mr-1.5 size-4 shrink-0 text-mute" />
                메모
              </strong>
              <p className="whitespace-pre-wrap rounded-sm border border-hairline bg-surface-elevated p-4 leading-relaxed text-body">
                {viewingPhotobook.memo}
              </p>
            </div>
          )}
        </div>
        {isAuthenticated && (
          <div className="mt-6 flex justify-end gap-2 border-t border-hairline pt-6">
            <button
              type="button"
              onClick={onEdit}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink disabled:opacity-60"
              aria-label="정보 수정"
              title="수정"
            >
              <Pencil className="size-4" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink disabled:opacity-60"
              aria-label="삭제"
              title="삭제"
              aria-busy={isDeleting}
            >
              {isDeleting ? <InlineSpinner /> : <Trash2 className="size-4" strokeWidth={1.8} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
