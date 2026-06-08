'use client';

import { AladinSearchSection } from '@/components/AladinSearchSection';
import { formatAuthorName } from '@/lib/format';
import type { AladinSearchBookItem } from '../types';

interface BookSearchSectionProps {
  query: string;
  setQuery: (v: string) => void;
  books: AladinSearchBookItem[];
  hasSearched: boolean;
  isSearching: boolean;
  totalResults: number;
  onSearch: () => void;
  onClearSearch: () => void;
  onManualRegister: () => void;
  onSelectBook: (book: AladinSearchBookItem) => void;
  isAuthenticated: boolean | null;
  inputBaseClass: string;
}

export function BookSearchSection({ books, onSelectBook, ...props }: BookSearchSectionProps) {
  return (
    <AladinSearchSection
      {...props}
      items={books}
      onSelectItem={(item) => onSelectBook(item as AladinSearchBookItem)}
      placeholder="새로운 책을 검색하세요"
      formatAuthor={formatAuthorName}
    />
  );
}
