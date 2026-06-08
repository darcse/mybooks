'use client';

import { useEffect } from 'react';
import { BookOpen, Bookmark, FileText, Pencil, Trash2 } from 'lucide-react';
import { InlineSpinner } from '@/components/AsyncMutationUi';
import { formatComicAuthorName } from '@/lib/format';
import type { Comic } from '../types';

interface ComicsDetailModalProps {
  viewingComic: Comic;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAuthenticated: boolean | null;
  isDeleting?: boolean;
}

export function ComicsDetailModal({
  viewingComic,
  onClose,
  onEdit,
  onDelete,
  isAuthenticated,
  isDeleting = false,
}: ComicsDetailModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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
          dangerouslySetInnerHTML={{ __html: viewingComic.title }}
        />
        <div className="mb-6 flex flex-col gap-6 border-b border-hairline pb-6 sm:flex-row">
          {viewingComic.cover_image_url ? (
            <img
              src={viewingComic.cover_image_url}
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
              <strong className="text-ink">저자:</strong> {formatComicAuthorName(viewingComic.author)}
            </p>
            <p>
              <strong className="text-ink">출판사:</strong> {viewingComic.publisher || '-'}
            </p>
            <p>
              <strong className="text-ink">발매일:</strong> {viewingComic.publish_date || '-'}
            </p>
            <p>
              <strong className="text-ink">ISBN:</strong> {viewingComic.isbn || '-'}
            </p>
            <p>
              <strong className="text-ink">판매가:</strong>{' '}
              {viewingComic.price ? `${Number(viewingComic.price).toLocaleString()}원` : '-'}
            </p>
            {viewingComic.link && (
              <p>
                <strong className="text-ink">도서 링크:</strong>{' '}
                <a
                  href={viewingComic.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-ink underline underline-offset-4"
                >
                  도서 정보
                </a>
              </p>
            )}
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm text-body">
          <p>
            <strong className="text-ink">카테고리:</strong> {viewingComic.category}
          </p>
          <p>
            <strong className="text-ink">형태:</strong> {viewingComic.format}
          </p>
          {viewingComic.status?.trim() ? (
            <p>
              <strong className="text-ink">시리즈:</strong> {viewingComic.status}
            </p>
          ) : null}
          <p>
            <strong className="text-ink">별점:</strong>{' '}
            {viewingComic.rank > 0 ? '⭐'.repeat(viewingComic.rank) : '미평가'}
          </p>
          <p>
            <strong className="text-ink">독서 진행:</strong> {viewingComic.current_page} /{' '}
            {viewingComic.total_pages}p
          </p>
        </div>
        <div className="space-y-4 border-t border-hairline pt-6 text-sm">
          {viewingComic.description && (
            <div>
              <strong className="mb-2 flex items-center text-ink">
                <BookOpen className="mr-1.5 size-4 shrink-0 text-mute" />
                책 소개
              </strong>
              <p className="whitespace-pre-wrap rounded-sm border border-hairline bg-surface-elevated p-4 leading-relaxed text-body">
                {viewingComic.description}
              </p>
            </div>
          )}
          {viewingComic.bookmark?.trim() && (
            <div>
              <strong className="mb-2 flex items-center text-ink">
                <Bookmark className="mr-1.5 size-4 shrink-0 text-mute" />
                북마크
              </strong>
              <p className="whitespace-pre-wrap rounded-sm border border-hairline bg-surface-elevated p-4 leading-relaxed text-body">
                {viewingComic.bookmark}
              </p>
            </div>
          )}
          {viewingComic.memo?.trim() && (
            <div>
              <strong className="mb-2 flex items-center text-ink">
                <FileText className="mr-1.5 size-4 shrink-0 text-mute" />
                메모
              </strong>
              <p className="whitespace-pre-wrap rounded-sm border border-hairline bg-surface-elevated p-4 leading-relaxed text-body">
                {viewingComic.memo}
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
