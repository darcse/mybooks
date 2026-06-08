'use client';

import { AladinSearchSection } from '@/components/AladinSearchSection';
import type { AladinSearchBookItem } from '../types';

interface PhotobookSearchSectionProps {
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

export function PhotobookSearchSection({ items, onSelectItem, ...props }: PhotobookSearchSectionProps) {
  return (
    <AladinSearchSection
      {...props}
      items={items}
      onSelectItem={(item) => onSelectItem(item as AladinSearchBookItem)}
      placeholder="사진집을 검색하세요"
    />
  );
}
