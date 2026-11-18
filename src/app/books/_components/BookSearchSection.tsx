'use client';

import { ExternalBookSearchSection } from '@/components/ExternalBookSearchSection';
import { formatAuthorName } from '@/lib/format';
import type { ExternalBookItem } from '../types';

interface BookSearchSectionProps {
  query: string;
  setQuery: (v: string) => void;
  books: ExternalBookItem[];
  hasSearched: boolean;
  isSearching: boolean;
  totalResults: number;
  onSearch: () => void;
  onClearSearch: () => void;
  onManualRegister: () => void;
  onSelectBook: (book: ExternalBookItem) => void;
  isAuthenticated: boolean | null;
  inputBaseClass: string;
}

export function BookSearchSection({ books, onSelectBook, ...props }: BookSearchSectionProps) {
  return (
    <ExternalBookSearchSection
      {...props}
      items={books}
      onSelectItem={(item) => onSelectBook(item as ExternalBookItem)}
      placeholder="새로운 책을 검색하세요"
      formatAuthor={formatAuthorName}
    />
  );
}
