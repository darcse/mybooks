'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Bookmark, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { DeletingLabel, SavingLabel } from '@/components/AsyncMutationUi';
import { formatComicAuthorName } from '@/lib/format';
import { updateComicPartialInDB } from '../actions';
import type { Comic } from '../types';

interface ComicsDetailModalProps {
  viewingComic: Comic;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComicUpdated: (comic: Comic) => void;
  isAuthenticated: boolean | null;
  isDeleting?: boolean;
}

const inputClass =
  'h-9 w-full rounded-md border border-hairline bg-surface-elevated px-3 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]';
const textareaClass =
  'w-full min-h-24 rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]';

function isUnauthorizedError(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export function ComicsDetailModal({
  viewingComic,
  onClose,
  onEdit,
  onDelete,
  onComicUpdated,
  isAuthenticated,
  isDeleting = false,
}: ComicsDetailModalProps) {
  const [currentPage, setCurrentPage] = useState(String(viewingComic.current_page ?? 0));
  const [memo, setMemo] = useState(viewingComic.memo ?? '');
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    setCurrentPage(String(viewingComic.current_page ?? 0));
    setMemo(viewingComic.memo ?? '');
  }, [viewingComic]);

  const handleSaveProgress = async () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setIsSavingProgress(true);
    try {
      const updated = await updateComicPartialInDB(viewingComic.id, {
        current_page: parseInt(currentPage) || 0,
      });
      onComicUpdated(updated as Comic);
      toast.success('진행도가 저장되었습니다.');
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleSaveMemo = async () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setIsSavingMemo(true);
    try {
      const updated = await updateComicPartialInDB(viewingComic.id, {
        memo: memo.trim() || null,
      });
      onComicUpdated(updated as Comic);
      toast.success('메모가 저장되었습니다.');
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingMemo(false);
    }
  };

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
          {viewingComic.rank > 0 && (
            <p>
              <strong className="text-ink">별점:</strong> {'⭐'.repeat(viewingComic.rank)}
            </p>
          )}
        </div>
        {isAuthenticated && (
          <div className="mb-6 space-y-4 border-t border-hairline pt-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-mute">
                독서 진행 ({viewingComic.total_pages}p)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={viewingComic.total_pages || undefined}
                  className={inputClass}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleSaveProgress}
                  disabled={isSavingProgress}
                  className="shrink-0 rounded-md border border-hairline bg-surface-elevated px-4 text-sm font-medium text-body hover:text-ink disabled:opacity-50"
                >
                  {isSavingProgress ? <SavingLabel text="저장 중..." /> : '저장'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-mute">메모</label>
              <textarea
                className={textareaClass}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모를 입력하세요"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveMemo}
                  disabled={isSavingMemo}
                  className="rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-body hover:text-ink disabled:opacity-50"
                >
                  {isSavingMemo ? <SavingLabel text="저장 중..." /> : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}
        {!isAuthenticated && (
          <div className="mb-6 space-y-2 border-t border-hairline pt-6 text-sm text-body">
            <p>
              <strong className="text-ink">독서 진행:</strong> {viewingComic.current_page} /{' '}
              {viewingComic.total_pages}p
            </p>
          </div>
        )}
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
          {!isAuthenticated && viewingComic.memo?.trim() && (
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
          <div className="mt-6 flex gap-4 border-t border-hairline pt-6">
            <button
              type="button"
              onClick={onEdit}
              disabled={isDeleting}
              className="flex-1 rounded-md border border-hairline bg-surface-elevated py-3 text-sm font-medium text-body hover:text-ink disabled:opacity-60"
            >
              정보 수정하기
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex-1 rounded-md border border-hairline bg-surface-elevated py-3 text-sm font-medium text-body hover:text-ink disabled:opacity-60"
              aria-busy={isDeleting}
            >
              {isDeleting ? <DeletingLabel /> : '삭제하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
