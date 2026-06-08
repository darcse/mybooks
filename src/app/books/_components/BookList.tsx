'use client';

import { useEffect, useState } from 'react';
import { Book as BookClosedIcon, BookCheck, BookOpen, List, X } from 'lucide-react';
import { formatAuthorName } from '@/lib/format';
import { categoryOptions } from '../constants';
import type { Book } from '../types';
import { getOwnershipStatus } from '../utils';

const READING_STATUS_FOR_ICON = new Set(['읽기 전', '읽는 중', '완독']);

function ReadingStatusCoverIcon({ status }: { status: string }) {
  if (status === '읽기 전') return <BookClosedIcon className="size-4" strokeWidth={2} aria-hidden />;
  if (status === '읽는 중') return <BookOpen className="size-4" strokeWidth={2} aria-hidden />;
  if (status === '완독') return <BookCheck className="size-4" strokeWidth={2} aria-hidden />;
  return null;
}

interface BookListProps {
  paginatedLibrary: Book[];
  listSearchQuery: string;
  setListSearchQuery: (v: string) => void;
  listCategoryFilter: string;
  setListCategoryFilter: (v: string) => void;
  listOwnershipFilter: '전체' | '보유중' | '방출';
  setListOwnershipFilter: (v: '전체' | '보유중' | '방출') => void;
  listFormatFilter: string;
  setListFormatFilter: (v: string) => void;
  listStatusFilter: string;
  setListStatusFilter: (v: string) => void;
  listSortOrder: string;
  setListSortOrder: (v: string) => void;
  listCurrentPage: number;
  setListCurrentPage: (v: number) => void;
  totalFilteredCount: number;
  listTotalPages: number;
  isAuthenticated: boolean | null;
  libraryEmpty?: boolean;
  onItemClick?: (book: Book) => void;
}

export function BookList({
  paginatedLibrary,
  listSearchQuery,
  setListSearchQuery,
  listCategoryFilter,
  setListCategoryFilter,
  listOwnershipFilter,
  setListOwnershipFilter,
  listFormatFilter,
  setListFormatFilter,
  listStatusFilter,
  setListStatusFilter,
  listSortOrder,
  setListSortOrder,
  listCurrentPage,
  setListCurrentPage,
  totalFilteredCount,
  listTotalPages,
  isAuthenticated,
  libraryEmpty = false,
  onItemClick,
}: BookListProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilters = [
    listCategoryFilter !== '전체' && {
      key: 'category',
      label: `카테고리: ${listCategoryFilter}`,
      reset: () => setListCategoryFilter('전체'),
    },
    listOwnershipFilter !== '전체' && {
      key: 'ownership',
      label: `보유 상태: ${listOwnershipFilter}`,
      reset: () => setListOwnershipFilter('전체'),
    },
    listFormatFilter !== '전체' && {
      key: 'format',
      label: `형태: ${listFormatFilter}`,
      reset: () => setListFormatFilter('전체'),
    },
    listStatusFilter !== '전체' && {
      key: 'status',
      label: `상태: ${listStatusFilter}`,
      reset: () => setListStatusFilter('전체'),
    },
  ].filter(Boolean) as { key: string; label: string; reset: () => void }[];

  const hasActiveFilters = activeFilters.length > 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [listCurrentPage]);

  return (
    <div className="mt-8 border-t border-hairline pt-8">
      <div className="mb-2 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:gap-6">
        <h2 className="flex shrink-0 items-center gap-2 text-lg font-medium text-ink">
          <List className="size-5 shrink-0 text-mute" strokeWidth={1.5} />
          소장 목록
        </h2>
        <div className="flex w-full flex-col gap-2 lg:ml-auto lg:w-auto">
          <div className="flex items-center justify-between gap-2 lg:justify-end">
            <div className="relative min-w-[140px] flex-1 md:min-w-[170px] lg:w-[320px] lg:flex-none">
              <input
                className="h-[38px] w-full rounded-md border border-hairline bg-surface-elevated px-3 py-2 pr-8 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]"
                placeholder="제목, 저자, ISBN 검색..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
              />
              {listSearchQuery && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-mute hover:text-body"
                  onClick={() => setListSearchQuery('')}
                  title="검색어 지우기"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="inline-flex h-[34px] shrink-0 items-center gap-2 rounded-md border border-hairline bg-surface-elevated px-4 text-[13px] font-medium text-body hover:text-ink"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <span>필터</span>
              {hasActiveFilters && (
                <span
                  className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-surface-card px-1 text-[11px] font-semibold leading-none text-ink tabular-nums"
                  aria-label={`활성 필터 ${activeFilters.length}개`}
                >
                  {activeFilters.length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <div className="hidden flex-wrap justify-end gap-1 lg:flex">
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      f.reset();
                    }}
                    className="group inline-flex h-[34px] items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 text-[13px] font-medium text-body hover:text-ink"
                  >
                    <span className="max-w-[120px] truncate">{f.label}</span>
                    <X className="size-3 opacity-45 group-hover:opacity-80" strokeWidth={2} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {filtersOpen && (
        <div className="mb-4 flex w-full flex-wrap justify-end gap-2">
          <select
            className="h-[38px] rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink"
            value={listCategoryFilter}
            onChange={(e) => setListCategoryFilter(e.target.value)}
          >
            <option value="전체">카테고리: 전체</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            className="h-[38px] rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink"
            value={listOwnershipFilter}
            onChange={(e) => setListOwnershipFilter(e.target.value as '전체' | '보유중' | '방출')}
          >
            <option value="전체">보유 상태: 전체</option>
            <option value="보유중">보유 상태: 보유중</option>
            <option value="방출">보유 상태: 방출</option>
          </select>
          <select
            className="h-[38px] rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink"
            value={listFormatFilter}
            onChange={(e) => setListFormatFilter(e.target.value)}
          >
            <option value="전체">형태: 전체</option>
            <option value="종이책">종이책</option>
            <option value="e-book">e-book</option>
            <option value="오디오북">오디오북</option>
          </select>
          <select
            className="h-[38px] rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink"
            value={listStatusFilter}
            onChange={(e) => setListStatusFilter(e.target.value)}
          >
            <option value="전체">상태: 전체</option>
            <option value="읽기 전">읽기 전</option>
            <option value="읽는 중">읽는 중</option>
            <option value="완독">완독</option>
            <option value="Collection">Collection</option>
          </select>
          <select
            className="h-[38px] rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink"
            value={listSortOrder}
            onChange={(e) => setListSortOrder(e.target.value)}
          >
            <option value="created_desc">등록일 최신순</option>
            <option value="purchase_desc">구입일 최신순</option>
            <option value="purchase_asc">구입일 과거순</option>
            <option value="publish_desc">발매일 최신순</option>
            <option value="publish_asc">발매일 과거순</option>
          </select>
        </div>
      )}
      <p className="mb-3 text-sm font-medium text-body">
        총 <span className="text-ink">{totalFilteredCount}</span>권
      </p>
      {totalFilteredCount === 0 ? (
        <div className="rounded-sm border border-hairline bg-surface py-12 text-center text-body">
          {libraryEmpty ? '등록된 도서가 없습니다.' : '조건에 맞는 도서가 없습니다.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedLibrary.map((book) => {
              const isAdultAndAnon = book.is_adult && !isAuthenticated;
              const showReadingIcon = READING_STATUS_FOR_ICON.has(book.status);
              const statusFilterValue = book.status === '컬렉션' ? 'Collection' : book.status;
              return (
                <div
                  key={book.id}
                  className={`flex gap-4 rounded-sm border border-hairline bg-surface p-4${onItemClick ? ' cursor-pointer hover:bg-surface-elevated' : ''}`}
                  onClick={() => onItemClick?.(book)}
                >
                  <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-sm border border-hairline">
                    {showReadingIcon && (
                      <button
                        type="button"
                        className="absolute left-1.5 top-1.5 z-10 flex items-center justify-center rounded-sm bg-surface-card p-1 text-body hover:text-ink"
                        title={`상태: ${book.status}`}
                        aria-label={`상태 필터: ${book.status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setListStatusFilter(statusFilterValue);
                        }}
                      >
                        <ReadingStatusCoverIcon status={book.status} />
                      </button>
                    )}
                    {isAdultAndAnon ? (
                      <div className="flex h-full w-full items-center justify-center bg-surface-card text-xs font-medium text-ink">
                        19
                      </div>
                    ) : book.cover_image_url ? (
                      <img src={book.cover_image_url} alt="표지" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-card text-xs text-mute">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden pt-1">
                    <h3
                      className="truncate text-sm font-medium text-ink"
                      dangerouslySetInnerHTML={{ __html: book.title }}
                    />
                    <p className="mb-2 truncate text-xs text-mute">{formatAuthorName(book.author)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <button
                        type="button"
                        className="rounded-sm bg-surface-elevated px-2 py-0.5 text-body hover:text-ink"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListCategoryFilter(book.category);
                        }}
                      >
                        {book.category}
                      </button>
                      <button
                        type="button"
                        className="rounded-sm bg-surface-elevated px-2 py-0.5 text-body hover:text-ink"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListFormatFilter(book.format);
                        }}
                      >
                        {book.format}
                      </button>
                      {!showReadingIcon && (
                        <button
                          type="button"
                          className="rounded-sm bg-surface-elevated px-2 py-0.5 text-body hover:text-ink"
                          onClick={(e) => {
                            e.stopPropagation();
                            setListStatusFilter(statusFilterValue);
                          }}
                        >
                          {book.status === '컬렉션' ? 'Collection' : book.status}
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded-sm bg-surface-elevated px-2 py-0.5 text-body hover:text-ink"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListOwnershipFilter(getOwnershipStatus(book));
                        }}
                      >
                        {getOwnershipStatus(book)}
                      </button>
                    </div>
                    {book.publish_date && (
                      <p className="mt-1.5 text-xs text-mute">{book.publish_date}</p>
                    )}
                    {book.rank > 0 && (
                      <p className="mt-1.5 text-xs text-body">{'⭐'.repeat(book.rank)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {listTotalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={listCurrentPage === 1}
                onClick={() => setListCurrentPage(listCurrentPage - 1)}
                className="rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-body disabled:opacity-50 hover:text-ink"
              >
                &larr; 이전
              </button>
              <span className="text-sm font-medium text-body">
                {listCurrentPage} / {listTotalPages} 페이지
              </span>
              <button
                type="button"
                disabled={listCurrentPage === listTotalPages}
                onClick={() => setListCurrentPage(listCurrentPage + 1)}
                className="rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-body disabled:opacity-50 hover:text-ink"
              >
                다음 &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
