import type { CSSProperties } from 'react';
import Link from 'next/link';
import { LayoutGrid, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BOOK_CATEGORY_ICON } from './_dashboardIcons';
import { buildSortedBookCategories } from './_utils';
import layout from './DashboardLayout.module.css';

function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-surface-elevated ${className ?? ''}`}
      style={style}
      aria-hidden
    />
  );
}

export function CategoryStatsSkeleton() {
  return (
    <div
      className={layout.summaryCard}
      aria-busy="true"
      aria-label="카테고리 분포 로딩 중"
    >
      <div className={layout.summaryCardHeader}>
        <Skeleton className="h-5 w-28" />
      </div>
      <div className={layout.categoryGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={layout.categoryItem}>
            <Skeleton className="size-4 shrink-0 rounded-sm" />
            <div className={layout.categoryLine}>
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function CategoryStats() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('books')
    .select('category, status, ownership_status, format');
  const sortedCategories = buildSortedBookCategories(data ?? []);

  return (
    <div className={layout.summaryCard}>
      <div className={layout.summaryCardHeader}>
        <Link
          href="/books?ownership=보유중"
          className="inline-flex min-w-0 items-center rounded-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/40"
        >
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <LayoutGrid className="size-4 shrink-0 text-mute" strokeWidth={1.5} /> 카테고리 분포
          </h2>
        </Link>
      </div>
      {sortedCategories.length === 0 ? (
        <p className="text-sm text-mute">보유 중인 도서가 없습니다.</p>
      ) : (
        <div className={layout.categoryScroll}>
          <div className={layout.categoryGrid}>
            {sortedCategories.map(([cat, { completed, owned }]) => (
              <Link
                key={cat}
                href={`/books?category=${encodeURIComponent(cat)}&ownership=보유중`}
                className={layout.categoryItem}
              >
                <span className={layout.categoryIcon}>
                  {BOOK_CATEGORY_ICON[cat] ?? <Package className="size-4" strokeWidth={1.5} />}
                </span>
                <span className={layout.categoryLine}>
                  <span className={layout.categoryName}>{cat}</span>
                  <span className={layout.categoryCount}>
                    {completed}/{owned}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
