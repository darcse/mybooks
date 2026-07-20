'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookMarked, BookOpen, Bookmark, Check, FileText, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { InlineSpinner, SavingLabel } from '@/components/AsyncMutationUi';
import { formatAuthorName } from '@/lib/format';
import {
  createBookHighlight,
  deleteBookHighlight,
  getBookHighlights,
  updateBookCurrentPage,
  updateBookHighlight,
} from '../actions';
import type { Book, BookHighlight } from '../types';
import { getOwnershipStatus } from '../utils';

interface BookDetailModalProps {
  viewingBook: Book;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAuthenticated: boolean | null;
  isDeleting?: boolean;
  onHighlightChange?: (bookId: number) => void | Promise<void>;
  onBookUpdated?: (book: Book) => void | Promise<void>;
}

const inputClass =
  'h-9 w-full rounded-md border border-hairline bg-surface-elevated px-3 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]';
const textareaClass =
  'w-full min-h-24 rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]';
const inlineNumberClass =
  'inline h-8 w-[4.5rem] rounded-md border border-hairline bg-surface-elevated px-2 text-sm text-ink outline-none focus:border-[var(--hairline-strong)] disabled:opacity-50';

function normalizeTag(raw: string) {
  const trimmed = raw.trim().replace(/^#+/, '').replace(/\s+/g, '');
  return trimmed ? `#${trimmed}` : null;
}

function parseTagsFromInput(raw: string) {
  return raw
    .split(/\s+/)
    .map(normalizeTag)
    .filter((tag): tag is string => Boolean(tag));
}

function formatDateTime(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function isUnauthorizedError(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export function BookDetailModal({
  viewingBook,
  onClose,
  onEdit,
  onDelete,
  isAuthenticated,
  isDeleting = false,
  onHighlightChange,
  onBookUpdated,
}: BookDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'highlight'>('info');
  const [highlights, setHighlights] = useState<BookHighlight[]>([]);
  const [isHighlightsLoading, setIsHighlightsLoading] = useState(false);
  const [isSubmittingHighlight, setIsSubmittingHighlight] = useState(false);
  const [highlightContent, setHighlightContent] = useState('');
  const [highlightTagInput, setHighlightTagInput] = useState('');
  const [highlightTags, setHighlightTags] = useState<string[]>([]);
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditingContent, setInlineEditingContent] = useState('');
  const [inlineEditingTagInput, setInlineEditingTagInput] = useState('');
  const [inlineEditingTags, setInlineEditingTags] = useState<string[]>([]);
  const [isSavingInlineEdit, setIsSavingInlineEdit] = useState(false);
  const [currentPageInput, setCurrentPageInput] = useState('');
  const [isSavingCurrentPage, setIsSavingCurrentPage] = useState(false);

  const sortedHighlights = useMemo(
    () =>
      [...highlights].sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      ),
    [highlights]
  );

  const resetHighlightForm = () => {
    setHighlightContent('');
    setHighlightTagInput('');
    setHighlightTags([]);
  };

  const resetInlineEdit = () => {
    setInlineEditingId(null);
    setInlineEditingContent('');
    setInlineEditingTagInput('');
    setInlineEditingTags([]);
    setIsSavingInlineEdit(false);
  };

  const fetchHighlights = async () => {
    if (!isAuthenticated || !viewingBook?.id) {
      setHighlights([]);
      return;
    }
    setIsHighlightsLoading(true);
    try {
      const data = await getBookHighlights(viewingBook.id);
      setHighlights(data);
    } catch {
      toast.error('하이라이트 목록을 불러오지 못했습니다.');
    } finally {
      setIsHighlightsLoading(false);
    }
  };

  const commitPendingTags = () => {
    const pendingTags = parseTagsFromInput(highlightTagInput);
    if (pendingTags.length === 0) return;
    setHighlightTags((prev) => Array.from(new Set([...prev, ...pendingTags])));
    setHighlightTagInput('');
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    commitPendingTags();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setHighlightTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const beginInlineEdit = (highlight: BookHighlight) => {
    setInlineEditingId(highlight.id);
    setInlineEditingContent(highlight.content);
    setInlineEditingTags(highlight.tags || []);
    setInlineEditingTagInput('');
  };

  const commitInlinePendingTags = () => {
    const pendingTags = parseTagsFromInput(inlineEditingTagInput);
    if (pendingTags.length === 0) return;
    setInlineEditingTags((prev) => Array.from(new Set([...prev, ...pendingTags])));
    setInlineEditingTagInput('');
  };

  const handleInlineTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    commitInlinePendingTags();
  };

  const handleRemoveInlineTag = (tagToRemove: string) => {
    setInlineEditingTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSaveInlineEdit = async (highlightId: number) => {
    const normalizedContent = inlineEditingContent.trim();
    const normalizedTags = Array.from(
      new Set([...inlineEditingTags, ...parseTagsFromInput(inlineEditingTagInput)])
    );
    if (!normalizedContent) {
      toast.error('하이라이트 내용을 입력해 주세요.');
      return;
    }
    setIsSavingInlineEdit(true);
    try {
      const data = await updateBookHighlight(
        highlightId,
        viewingBook.id,
        normalizedContent,
        normalizedTags
      );
      setHighlights((prev) => prev.map((item) => (item.id === highlightId ? data : item)));
      await onHighlightChange?.(viewingBook.id);
      resetInlineEdit();
      toast.success('하이라이트가 수정되었습니다.');
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '하이라이트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingInlineEdit(false);
    }
  };

  const handleSaveHighlight = async () => {
    const normalizedContent = highlightContent.trim();
    const normalizedTags = Array.from(
      new Set([...highlightTags, ...parseTagsFromInput(highlightTagInput)])
    );
    if (!normalizedContent) {
      toast.error('하이라이트 내용을 입력해 주세요.');
      return;
    }
    setIsSubmittingHighlight(true);
    try {
      const data = await createBookHighlight(viewingBook.id, normalizedContent, normalizedTags);
      setHighlights((prev) => [data, ...prev]);
      await onHighlightChange?.(viewingBook.id);
      toast.success('하이라이트가 저장되었습니다.');
      resetHighlightForm();
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '하이라이트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingHighlight(false);
    }
  };

  const handleSaveCurrentPage = async () => {
    if (!isAuthenticated) return;

    const totalPages = viewingBook.total_pages || 0;
    const rawParsed = parseInt(currentPageInput, 10);
    let normalized = Number.isNaN(rawParsed) || rawParsed < 0 ? 0 : rawParsed;
    let wasClamped = false;

    if (totalPages > 0 && normalized > totalPages) {
      normalized = totalPages;
      wasClamped = true;
    }

    setCurrentPageInput(String(normalized));

    if (normalized === viewingBook.current_page) {
      if (wasClamped) {
        toast.info(`총 페이지(${totalPages}p)를 초과하여 ${totalPages}p로 조정했습니다.`);
      }
      return;
    }

    setIsSavingCurrentPage(true);
    try {
      const updated = await updateBookCurrentPage(viewingBook.id, normalized);
      await onBookUpdated?.(updated);
      if (wasClamped) {
        toast.info(`총 페이지(${totalPages}p)를 초과하여 ${totalPages}p로 저장했습니다.`);
      }
    } catch (error) {
      setCurrentPageInput(String(viewingBook.current_page ?? 0));
      toast.error(
        isUnauthorizedError(error) ? '로그인이 필요합니다.' : '독서 진행 저장 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSavingCurrentPage(false);
    }
  };

  const handleCurrentPageKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.currentTarget.blur();
  };

  const handleDeleteHighlight = async (highlightId: number) => {
    if (!confirm('이 하이라이트를 삭제하시겠습니까?')) return;
    try {
      await deleteBookHighlight(highlightId, viewingBook.id);
      setHighlights((prev) => prev.filter((item) => item.id !== highlightId));
      if (inlineEditingId === highlightId) {
        resetInlineEdit();
      }
      await onHighlightChange?.(viewingBook.id);
      toast.success('하이라이트가 삭제되었습니다.');
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '하이라이트 삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    setActiveTab('info');
    resetHighlightForm();
    resetInlineEdit();
    setHighlights([]);
    setCurrentPageInput(String(viewingBook.current_page ?? 0));
  }, [viewingBook]);

  useEffect(() => {
    fetchHighlights();
  }, [viewingBook?.id, isAuthenticated]);

  const hasHighlights = highlights.length > 0;
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
          dangerouslySetInnerHTML={{ __html: viewingBook.title }}
        />
        <div className="mb-6 flex flex-col gap-6 border-b border-hairline pb-6 sm:flex-row">
          {viewingBook.cover_image_url && (
            <img
              src={viewingBook.cover_image_url}
              alt="표지"
              className="mx-auto h-48 w-32 shrink-0 rounded-sm border border-hairline object-cover sm:mx-0"
            />
          )}
          <div className="flex-1 space-y-2 pt-4 text-sm text-body">
            <p>
              <strong className="text-ink">저자:</strong> {formatAuthorName(viewingBook.author)}
            </p>
            <p>
              <strong className="text-ink">출판사:</strong> {viewingBook.publisher || '-'}
            </p>
            <p>
              <strong className="text-ink">발매일:</strong> {viewingBook.publish_date || '-'}
            </p>
            <p>
              <strong className="text-ink">ISBN:</strong> {viewingBook.isbn || '-'}
            </p>
            <p>
              <strong className="text-ink">판매가:</strong>{' '}
              {viewingBook.price ? `${Number(viewingBook.price).toLocaleString()}원` : '-'}
            </p>
            {viewingBook.link && (
              <p>
                <strong className="text-ink">도서 링크:</strong>{' '}
                <a
                  href={viewingBook.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-ink underline underline-offset-4"
                >
                  도서 정보
                </a>
              </p>
            )}
            <p>
              <strong className="text-ink">보유 상태:</strong>{' '}
              <span className="font-medium text-ink">{getOwnershipStatus(viewingBook)}</span>
            </p>
          </div>
        </div>
        <div className="mb-6 border-b border-hairline">
          <div className="-mb-px flex items-center justify-between gap-4">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`border-b-2 px-1 pb-3 text-sm transition-colors ${
                  activeTab === 'info'
                    ? 'border-ink font-medium text-ink'
                    : 'border-transparent text-mute hover:text-body'
                }`}
                aria-pressed={activeTab === 'info'}
              >
                도서 정보
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('highlight')}
                className={`border-b-2 px-1 pb-3 text-sm transition-colors ${
                  activeTab === 'highlight'
                    ? 'border-ink font-medium text-ink'
                    : 'border-transparent text-mute hover:text-body'
                }`}
                aria-pressed={activeTab === 'highlight'}
              >
                하이라이트
              </button>
            </div>
            {hasHighlights ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/books/highlights?bookId=${viewingBook.id}`);
                }}
                className="mb-px inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline text-body transition-colors hover:bg-surface-elevated hover:text-ink"
                aria-label="하이라이트 화면에서 이 도서 보기"
                title="하이라이트 화면에서 이 도서 보기"
              >
                <BookMarked className="size-4" strokeWidth={1.8} />
              </button>
            ) : null}
          </div>
        </div>
        {activeTab === 'info' ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm text-body">
              <p>
                <strong className="text-ink">카테고리:</strong> {viewingBook.category}
              </p>
              <p>
                <strong className="text-ink">형태:</strong> {viewingBook.format}
              </p>
              <p>
                <strong className="text-ink">상태:</strong>{' '}
                <span className="font-medium text-ink">
                  {viewingBook.status === '완독' && viewingBook.finished_at
                    ? `완독 (${viewingBook.finished_at})`
                    : viewingBook.status === '컬렉션'
                      ? 'Collection'
                      : viewingBook.status}
                </span>
              </p>
              <p>
                <strong className="text-ink">구입일:</strong> {viewingBook.purchase_date || '-'}
              </p>
              <p>
                <strong className="text-ink">별점:</strong>{' '}
                {viewingBook.rank > 0 ? '⭐'.repeat(viewingBook.rank) : '미평가'}
              </p>
              <p className="flex flex-wrap items-center gap-1">
                <strong className="text-ink">독서 진행:</strong>
                {isAuthenticated ? (
                  <>
                    <input
                      type="number"
                      min={0}
                      max={viewingBook.total_pages > 0 ? viewingBook.total_pages : undefined}
                      value={currentPageInput}
                      onChange={(event) => setCurrentPageInput(event.target.value)}
                      onBlur={handleSaveCurrentPage}
                      onKeyDown={handleCurrentPageKeyDown}
                      disabled={isSavingCurrentPage}
                      className={inlineNumberClass}
                      aria-label="현재 읽은 페이지"
                    />
                    <span>/ {viewingBook.total_pages}p</span>
                  </>
                ) : (
                  <span>
                    {viewingBook.current_page} / {viewingBook.total_pages}p
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-4 border-t border-hairline pt-6 text-sm">
              {viewingBook.description && (
                <div>
                  <strong className="mb-2 flex items-center text-ink">
                    <BookOpen className="mr-1.5 size-4 shrink-0 text-mute" />
                    책 소개
                  </strong>
                  <p className="whitespace-pre-wrap rounded-sm border border-hairline bg-surface-elevated p-4 leading-relaxed text-body">
                    {viewingBook.description}
                  </p>
                </div>
              )}
              {viewingBook.bookmark?.trim() && (
                <div>
                  <strong className="mb-2 flex items-center text-ink">
                    <Bookmark className="mr-1.5 size-4 shrink-0 text-mute" />
                    북마크
                  </strong>
                  <p className="whitespace-pre-wrap rounded-sm border border-hairline bg-surface-elevated p-4 leading-relaxed text-body">
                    {viewingBook.bookmark}
                  </p>
                </div>
              )}
              {viewingBook.memo?.trim() && (
                <div>
                  <strong className="mb-2 flex items-center text-ink">
                    <FileText className="mr-1.5 size-4 shrink-0 text-mute" />
                    메모
                  </strong>
                  <p className="whitespace-pre-wrap rounded-sm border border-hairline bg-surface-elevated p-4 leading-relaxed text-body">
                    {viewingBook.memo}
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
          </>
        ) : (
          <div className="space-y-6">
            {isAuthenticated ? (
              <>
                <div className="rounded-sm border border-hairline bg-surface-elevated p-5">
                  <div className="mb-4">
                    <h3 className="text-base font-medium text-ink">하이라이트 기록</h3>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      value={highlightContent}
                      onChange={(event) => setHighlightContent(event.target.value)}
                      placeholder="문장, 메모, 아이디어를 기록해 보세요."
                      className={`${textareaClass} min-h-32`}
                    />
                    <div className="space-y-3">
                      <input
                        value={highlightTagInput}
                        onChange={(event) => setHighlightTagInput(event.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={commitPendingTags}
                        placeholder="#인용구 #아이디어 형태로 입력 후 스페이스 또는 엔터"
                        className={inputClass}
                      />
                      {highlightTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {highlightTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-body hover:text-ink"
                            >
                              {tag} ×
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveHighlight}
                        disabled={isSubmittingHighlight}
                        className="rounded-md border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-body hover:text-ink disabled:opacity-50"
                      >
                        {isSubmittingHighlight ? <SavingLabel text="저장 중..." /> : '하이라이트 저장'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {isHighlightsLoading ? (
                    <div className="rounded-sm border border-hairline bg-surface-elevated px-5 py-10 text-center text-sm text-mute">
                      하이라이트를 불러오는 중입니다.
                    </div>
                  ) : sortedHighlights.length > 0 ? (
                    sortedHighlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="rounded-sm border border-hairline bg-surface-elevated p-5"
                      >
                        <div className="mb-3 flex items-start justify-between gap-4">
                          {inlineEditingId === highlight.id ? (
                            <div className="min-w-0 flex-1 space-y-3">
                              <textarea
                                value={inlineEditingContent}
                                onChange={(event) => setInlineEditingContent(event.target.value)}
                                className={`${textareaClass} min-h-28`}
                              />
                              <input
                                value={inlineEditingTagInput}
                                onChange={(event) => setInlineEditingTagInput(event.target.value)}
                                onKeyDown={handleInlineTagKeyDown}
                                onBlur={commitInlinePendingTags}
                                placeholder="#인용구 #아이디어 형태로 입력 후 스페이스 또는 엔터"
                                className={inputClass}
                              />
                              {inlineEditingTags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {inlineEditingTags.map((tag) => (
                                    <button
                                      key={`${highlight.id}-edit-${tag}`}
                                      type="button"
                                      onClick={() => handleRemoveInlineTag(tag)}
                                      className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-body hover:text-ink"
                                    >
                                      {tag} ×
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <p
                              className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-body"
                              onDoubleClick={() => beginInlineEdit(highlight)}
                            >
                              {highlight.content}
                            </p>
                          )}
                          <div className="flex shrink-0 items-center gap-2">
                            {inlineEditingId === highlight.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={resetInlineEdit}
                                  disabled={isSavingInlineEdit}
                                  className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink disabled:opacity-50"
                                  aria-label="수정 취소"
                                  title="취소"
                                >
                                  <X className="size-4" strokeWidth={1.8} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineEdit(highlight.id)}
                                  disabled={isSavingInlineEdit}
                                  className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface p-2 text-body hover:text-ink disabled:opacity-50"
                                  aria-label="수정 저장"
                                  title="저장"
                                >
                                  <Check className="size-4" strokeWidth={1.8} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => beginInlineEdit(highlight)}
                                  className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink"
                                  aria-label="하이라이트 수정"
                                  title="수정"
                                >
                                  <Pencil className="size-4" strokeWidth={1.8} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHighlight(highlight.id)}
                                  className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink"
                                  aria-label="하이라이트 삭제"
                                  title="삭제"
                                >
                                  <Trash2 className="size-4" strokeWidth={1.8} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {inlineEditingId !== highlight.id && (highlight.tags || []).length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {(highlight.tags || []).map((tag) => (
                              <span
                                key={`${highlight.id}-${tag}`}
                                className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-body"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-3 text-xs text-mute">
                          {formatDateTime(highlight.updated_at || highlight.created_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-sm border border-hairline bg-surface-elevated px-5 py-10 text-center text-sm text-mute">
                      저장된 하이라이트가 없습니다.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-sm border border-hairline bg-surface-elevated px-5 py-10 text-center text-sm text-mute">
                하이라이트는 로그인 후 기록하고 관리할 수 있습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
