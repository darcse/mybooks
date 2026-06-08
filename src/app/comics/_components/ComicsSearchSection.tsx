'use client';

import { AladinSearchSection } from '@/components/AladinSearchSection';
import { formatComicAuthorName } from '@/lib/format';
import type { AladinSearchBookItem } from '../types';

interface ComicsSearchSectionProps {
  query: string;
  setQuery: (v: string) => void;
  items: AladinSearchBookItem[];
  hasSearched: boolean;
  isSearching: boolean;
  totalResults: number;
  onSearch: () => void;
  onClearSearch: () => void;
  onManualRegister: () => void;
  onSelectItem: (item: AladinSearchBookItem) => void;
  isAuthenticated: boolean | null;
  inputBaseClass: string;
}

export function ComicsSearchSection({ items, onSelectItem, ...props }: ComicsSearchSectionProps) {
  return (
    <AladinSearchSection
      {...props}
      items={items}
      onSelectItem={(item) => onSelectItem(item as AladinSearchBookItem)}
      placeholder="만화를 검색하세요"
      formatAuthor={formatComicAuthorName}
    />
  );
}
