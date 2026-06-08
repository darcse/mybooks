'use client';

import { Building2, Calendar, Search, User, X } from 'lucide-react';

const iconClass = 'size-4 shrink-0 text-mute';

interface AladinSearchSectionProps {
  query: string;
  setQuery: (v: string) => void;
  items: Array<Record<string, unknown>>;
  hasSearched: boolean;
  isSearching: boolean;
  totalResults: number;
  placeholder: string;
  onSearch: () => void;
  onClearSearch: () => void;
  onManualRegister: () => void;
  onSelectItem: (item: Record<string, unknown>) => void;
  isAuthenticated: boolean | null;
  inputBaseClass: string;
  formatAuthor?: (author: string) => string;
}

export function AladinSearchSection({
  query,
  setQuery,
  items,
  hasSearched,
  isSearching,
  totalResults,
  placeholder,
  onSearch,
  onClearSearch,
  onManualRegister,
  onSelectItem,
  isAuthenticated,
  inputBaseClass,
  formatAuthor,
}: AladinSearchSectionProps) {
  return (
    <>
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <input
            className={`${inputBaseClass} w-full pr-10`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={placeholder}
          />
          {query && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-mute hover:text-body"
              onClick={onClearSearch}
              title="검색어 지우기"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          )}
        </div>
        <button
          type="button"
          className="inline-flex h-[42px] items-center justify-center rounded-full bg-primary px-3 text-on-primary"
          onClick={() => onSearch()}
        >
          <Search className="size-4 sm:mr-1" strokeWidth={2} />
          <span className="hidden text-sm font-medium sm:inline">검색</span>
        </button>
        {isAuthenticated && (
          <button
            type="button"
            className="inline-flex h-[42px] items-center justify-center rounded-md border border-hairline bg-surface-elevated px-3 text-sm font-medium text-body hover:text-ink"
            onClick={onManualRegister}
          >
            <span className="text-lg leading-none sm:mr-1">＋</span>
            <span className="hidden sm:inline">직접 등록하기</span>
          </button>
        )}
      </div>
      {isSearching && (
        <div className="mb-4 flex items-center gap-2 text-sm text-mute">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          <span>검색 중...</span>
        </div>
      )}
      {!isSearching && hasSearched && items.length === 0 && (
        <p className="mb-4 text-sm text-body">검색 결과가 없습니다.</p>
      )}
      {!isSearching && items.length > 0 && (
        <div className="mb-8 rounded-sm border border-hairline bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-body">
              <Search className={iconClass} />
              알라딘 검색 결과 (총 {totalResults.toLocaleString()}건)
            </span>
          </div>
          <ul className="mb-4 grid gap-2">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-sm border border-hairline bg-surface-elevated p-4"
              >
                <div className="flex-1 pr-4">
                  <h3
                    className="text-lg font-medium text-ink"
                    dangerouslySetInnerHTML={{ __html: String(item.title ?? '') }}
                  />
                  <div className="mt-1 flex flex-wrap gap-x-2 text-sm text-mute">
                    <span className="flex items-center gap-1">
                      <User className={iconClass} />
                      {(formatAuthor ? formatAuthor(String(item.author ?? '')) : String(item.author ?? '')) || '저자 미상'}
                    </span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <Building2 className={iconClass} />
                      {String(item.publisher ?? '') || '출판사 미상'}
                    </span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <Calendar className={iconClass} />
                      {item.pubdate ? String(item.pubdate).substring(0, 4) + '년' : '발매일 미상'}
                    </span>
                  </div>
                </div>
                {isAuthenticated && (
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
                    onClick={() => onSelectItem(item)}
                  >
                    등록
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
