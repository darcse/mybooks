'use client';

import { ExternalBookSearchSection } from '@/components/ExternalBookSearchSection';
import { formatComicAuthorName } from '@/lib/format';
import type { ExternalBookItem } from '../types';

interface ComicsSearchSectionProps {
  query: string;
  setQuery: (v: string) => void;
  items: ExternalBookItem[];
  hasSearched: boolean;
  isSearching: boolean;
  totalResults: number;
  onSearch: () => void;
  onClearSearch: () => void;
  onManualRegister: () => void;
  onSelectItem: (item: ExternalBookItem) => void;
  isAuthenticated: boolean | null;
  inputBaseClass: string;
}

export function ComicsSearchSection({ items, onSelectItem, ...props }: ComicsSearchSectionProps) {
  return (
    <ExternalBookSearchSection
      {...props}
      items={items}
      onSelectItem={(item) => onSelectItem(item as ExternalBookItem)}
      placeholder="만화를 검색하세요"
      formatAuthor={formatComicAuthorName}
    />
  );
}
