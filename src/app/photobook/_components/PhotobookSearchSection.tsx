'use client';

import { ExternalBookSearchSection } from '@/components/ExternalBookSearchSection';
import type { ExternalBookItem } from '../types';

interface PhotobookSearchSectionProps {
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

export function PhotobookSearchSection({ items, onSelectItem, ...props }: PhotobookSearchSectionProps) {
  return (
    <ExternalBookSearchSection
      {...props}
      items={items}
      onSelectItem={(item) => onSelectItem(item as ExternalBookItem)}
      placeholder="사진집을 검색하세요"
    />
  );
}
