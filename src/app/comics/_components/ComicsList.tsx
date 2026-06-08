'use client';

import { useEffect, useState } from 'react';
import { List, X } from 'lucide-react';
import { formatComicAuthorName } from '@/lib/format';
import { categoryOptions } from '../constants';
import type { Comic } from '../types';

interface ComicsListProps {
  paginatedLibrary: Comic[];
  listSearchQuery: string;
  setListSearchQuery: (v: string) => void;
  listCategoryFilter: string;
  setListCategoryFilter: (v: string) => void;
  listStatusFilter: string;
  setListStatusFilter: (v: string) => void;
  statusOptions: string[];
  listSortOrder: string;
  setListSortOrder: (v: string) => void;
  listCurrentPage: number;
  setListCurrentPage: (v: number) => void;
  totalFilteredCount: number;
  listTotalPages: number;
  libraryEmpty?: boolean;
  isAuthenticated: boolean | null;
  onItemClick?: (comic: Comic) => void;
}

export function ComicsList({
  paginatedLibrary,
  listSearchQuery,
  setListSearchQuery,
  listCategoryFilter,
  setListCategoryFilter,
  listStatusFilter,
  setListStatusFilter,
  statusOptions,
  listSortOrder,
  setListSortOrder,
  listCurrentPage,
  setListCurrentPage,
  totalFilteredCount,
  listTotalPages,
  libraryEmpty = false,
  isAuthenticated,
  onItemClick,
}: ComicsListProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilters = [
    listCategoryFilter !== '전체' && {
      key: 'category',
      label: `카테고리: ${listCategoryFilter}`,
      reset: () => setListCategoryFilter('전체'),
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
                placeholder="제목, 저자 검색..."
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
            value={listStatusFilter}
            onChange={(e) => setListStatusFilter(e.target.value)}
          >
            <option value="전체">상태: 전체</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            className="h-[38px] rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink"
            value={listSortOrder}
            onChange={(e) => setListSortOrder(e.target.value)}
          >
            <option value="created_desc">등록일 최신순</option>
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
          {libraryEmpty ? '등록된 코믹스가 없습니다.' : '조건에 맞는 코믹스가 없습니다.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedLibrary.map((comic) => {
              const isAdultAndAnon = comic.is_adult && !isAuthenticated;
              return (
                <div
                  key={comic.id}
                  className={`flex gap-4 rounded-sm border border-hairline bg-surface p-4${onItemClick ? ' cursor-pointer hover:bg-surface-elevated' : ''}`}
                  onClick={() => onItemClick?.(comic)}
                >
                  {isAdultAndAnon ? (
                    <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-sm border border-hairline bg-surface-card text-xs font-medium text-ink">
                      19
                    </div>
                  ) : comic.cover_image_url ? (
                    <img
                      src={comic.cover_image_url}
                      alt="표지"
                      className="h-28 w-20 shrink-0 rounded-sm border border-hairline object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-sm border border-hairline bg-surface-card text-xs text-mute">
                      No Image
                    </div>
                  )}
                  <div className="min-w-0 flex-1 overflow-hidden pt-1">
                    <h3
                      className="truncate text-sm font-medium text-ink"
                      dangerouslySetInnerHTML={{ __html: comic.title }}
                    />
                    <p className="mb-2 truncate text-xs text-mute">
                      {formatComicAuthorName(comic.author)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <button
                        type="button"
                        className="rounded-sm bg-surface-elevated px-2 py-0.5 text-body hover:text-ink"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListCategoryFilter(comic.category);
                        }}
                      >
                        {comic.category}
                      </button>
                      {comic.status?.trim() ? (
                        <button
                          type="button"
                          className="rounded-sm bg-surface-elevated px-2 py-0.5 text-body hover:text-ink"
                          onClick={(e) => {
                            e.stopPropagation();
                            setListStatusFilter(comic.status);
                          }}
                        >
                          {comic.status}
                        </button>
                      ) : null}
                      <span className="rounded-sm bg-surface-elevated px-2 py-0.5 text-body">
                        {comic.format}
                      </span>
                    </div>
                    {comic.rank > 0 && (
                      <p className="mt-1.5 text-xs text-body">{'⭐'.repeat(comic.rank)}</p>
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
                className="rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-body hover:text-ink disabled:opacity-50"
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
                className="rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-body hover:text-ink disabled:opacity-50"
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
