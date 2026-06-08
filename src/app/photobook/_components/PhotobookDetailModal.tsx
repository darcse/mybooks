'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { DeletingLabel, SavingLabel } from '@/components/AsyncMutationUi';
import { updatePhotobookPartialInDB } from '../actions';
import { statusOptions } from '../constants';
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
  onPhotobookUpdated: (book: Photobook) => void;
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

export function PhotobookDetailModal({
  viewingPhotobook,
  matchedSameModel,
  sameModelOpen,
  setSameModelOpen,
  onClose,
  onEdit,
  onDelete,
  onPhotobookUpdated,
  isAuthenticated,
  isDeleting = false,
}: PhotobookDetailModalProps) {
  const [rank, setRank] = useState(viewingPhotobook.rank ?? 0);
  const [memo, setMemo] = useState(viewingPhotobook.memo ?? '');
  const [status, setStatus] = useState(displayPhotobookStatus(viewingPhotobook.status));
  const [isSavingRank, setIsSavingRank] = useState(false);
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const modelName = viewingPhotobook.author || '모델';
  const displayStatus = displayPhotobookStatus(viewingPhotobook.status);
  const displayCategory = displayPhotobookCategory(viewingPhotobook.category);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    setRank(viewingPhotobook.rank ?? 0);
    setMemo(viewingPhotobook.memo ?? '');
    setStatus(displayPhotobookStatus(viewingPhotobook.status));
  }, [viewingPhotobook]);

  const handleSaveRank = async () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setIsSavingRank(true);
    try {
      const updated = await updatePhotobookPartialInDB(viewingPhotobook.id, { rank });
      onPhotobookUpdated(updated as Photobook);
      toast.success('별점이 저장되었습니다.');
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingRank(false);
    }
  };

  const handleSaveMemo = async () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setIsSavingMemo(true);
    try {
      const updated = await updatePhotobookPartialInDB(viewingPhotobook.id, {
        memo: memo.trim() || null,
      });
      onPhotobookUpdated(updated as Photobook);
      toast.success('메모가 저장되었습니다.');
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setIsSavingStatus(true);
    try {
      const updated = await updatePhotobookPartialInDB(viewingPhotobook.id, { status });
      onPhotobookUpdated(updated as Photobook);
      toast.success('상태가 저장되었습니다.');
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingStatus(false);
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
            <strong className="text-ink">구입일:</strong>{' '}
            {viewingPhotobook.purchase_date
              ? `${viewingPhotobook.purchase_date} (${displayStatus})`
              : '-'}
          </p>
          {!isAuthenticated && (
            <p>
              <strong className="text-ink">별점:</strong>{' '}
              {viewingPhotobook.rank > 0 ? '⭐'.repeat(viewingPhotobook.rank) : '미평가'}
            </p>
          )}
        </div>
        {isAuthenticated && (
          <div className="mb-6 space-y-4 border-t border-hairline pt-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-mute">별점</label>
              <div className="flex gap-2">
                <select
                  className={inputClass}
                  value={rank}
                  onChange={(e) => setRank(parseInt(e.target.value))}
                >
                  <option value={0}>미평가</option>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}점
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSaveRank}
                  disabled={isSavingRank}
                  className="shrink-0 rounded-md border border-hairline bg-surface-elevated px-4 text-sm font-medium text-body hover:text-ink disabled:opacity-50"
                >
                  {isSavingRank ? <SavingLabel text="저장 중..." /> : '저장'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-mute">상태</label>
              <div className="flex gap-2">
                <select
                  className={inputClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={isSavingStatus}
                  className="shrink-0 rounded-md border border-hairline bg-surface-elevated px-4 text-sm font-medium text-body hover:text-ink disabled:opacity-50"
                >
                  {isSavingStatus ? <SavingLabel text="저장 중..." /> : '저장'}
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
        <div className="space-y-4 border-t border-hairline pt-6 text-sm">
          {matchedSameModel.length > 0 && (
            <SameModelPhotobooks
              modelName={modelName}
              items={matchedSameModel}
              open={sameModelOpen}
              onToggle={() => setSameModelOpen((o) => !o)}
            />
          )}
          {!isAuthenticated && viewingPhotobook.memo?.trim() && (
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
