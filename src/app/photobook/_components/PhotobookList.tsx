'use client';

import { useEffect, useState } from 'react';
import { List, User, X } from 'lucide-react';
import { categoryOptions, rankFilterOptions } from '../constants';
import type { Photobook } from '../types';

interface PhotobookListProps {
  paginatedLibrary: Photobook[];
  listSearchQuery: string;
  setListSearchQuery: (v: string) => void;
  listCategoryFilter: string;
  setListCategoryFilter: (v: string) => void;
  listRankFilter: string;
  setListRankFilter: (v: string) => void;
  listSortOrder: string;
  setListSortOrder: (v: string) => void;
  listCurrentPage: number;
  setListCurrentPage: (v: number) => void;
  totalFilteredCount: number;
  listTotalPages: number;
  libraryEmpty?: boolean;
  onAuthorClick: (author: string) => void;
  onItemClick?: (book: Photobook) => void;
}

export function PhotobookList({
  paginatedLibrary,
  listSearchQuery,
  setListSearchQuery,
  listCategoryFilter,
  setListCategoryFilter,
  listRankFilter,
  setListRankFilter,
  listSortOrder,
  setListSortOrder,
  listCurrentPage,
  setListCurrentPage,
  totalFilteredCount,
  listTotalPages,
  libraryEmpty = false,
  onAuthorClick,
  onItemClick,
}: PhotobookListProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilters = [
    listCategoryFilter !== '전체' && {
      key: 'category',
      label: `카테고리: ${listCategoryFilter}`,
      reset: () => setListCategoryFilter('전체'),
    },
    listRankFilter !== '전체' && {
      key: 'rank',
      label: `별점: ${listRankFilter === '미평가' ? '미평가' : `${listRankFilter}점`}`,
      reset: () => setListRankFilter('전체'),
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
          Souls
        </h2>
        <div className="flex w-full flex-col gap-2 lg:ml-auto lg:w-auto">
          <div className="flex items-center justify-between gap-2 lg:justify-end">
            <div className="relative min-w-[140px] flex-1 md:min-w-[170px] lg:w-[320px] lg:flex-none">
              <input
                className="h-[38px] w-full rounded-md border border-hairline bg-surface-elevated px-3 py-2 pr-8 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]"
                placeholder="제목, 모델 검색..."
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
            value={listRankFilter}
            onChange={(e) => setListRankFilter(e.target.value)}
          >
            {rankFilterOptions.map((rank) => (
              <option key={rank} value={rank}>
                {rank === '전체' ? '별점: 전체' : rank === '미평가' ? '별점: 미평가' : `별점: ${rank}점`}
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
          {libraryEmpty ? '등록된 포토북이 없습니다.' : '조건에 맞는 사진집이 없습니다.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {paginatedLibrary.map((book) => (
              <div
                key={book.id}
                className={`group${onItemClick ? ' cursor-pointer' : ''}`}
                onClick={() => onItemClick?.(book)}
              >
                <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-sm border border-hairline bg-surface-elevated transition-transform duration-300 group-hover:scale-[1.02]">
                  {book.cover_image_url ? (
                    <img
                      src={book.cover_image_url}
                      alt="표지"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-card">
                      <User className="size-12 text-mute/40" strokeWidth={1.5} aria-hidden />
                    </div>
                  )}
                  {book.rank > 0 && (
                    <div className="absolute right-2 top-2 rounded-sm bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      ★ {book.rank}
                    </div>
                  )}
                </div>
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  {book.category && (
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className="rounded-sm bg-surface-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-body hover:text-ink"
                        onClick={() => setListCategoryFilter(book.category)}
                      >
                        {book.category}
                      </button>
                      {book.is_adult ? (
                        <span className="rounded-sm bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-body">
                          19+
                        </span>
                      ) : null}
                    </div>
                  )}
                  <h3
                    className="line-clamp-2 text-sm font-medium leading-tight text-ink"
                    dangerouslySetInnerHTML={{ __html: book.title }}
                  />
                  {book.author && (
                    <button
                      type="button"
                      className="block w-full truncate text-left text-xs text-mute hover:text-body"
                      onClick={() => onAuthorClick(book.author!)}
                    >
                      {book.author}
                    </button>
                  )}
                  {book.publish_date && (
                    <p className="text-[11px] text-mute">{book.publish_date}</p>
                  )}
                </div>
              </div>
            ))}
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
