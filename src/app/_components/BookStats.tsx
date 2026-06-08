import type { CSSProperties } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
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

export function BookStatsSkeleton() {
  return (
    <div
      className={`${layout.summaryCard}`}
      aria-busy="true"
      aria-label="소장 도서 로딩 중"
    >
      <Skeleton className="mb-3 h-5 w-24" />
      <div className={layout.bookStatsBody} aria-hidden>
        <Skeleton className={`${layout.bookDonut} shrink-0 rounded-full`} />
        <div className={layout.bookStatsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="contents">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-5 w-10 justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export async function BookStats() {
  const supabase = await createClient();
  const [
    booksTotalRes,
    booksReleasedRes,
    booksReadingRes,
    booksCompletedRes,
  ] = await Promise.all([
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .or('ownership_status.eq.방출,format.eq.방출,status.eq.방출'),
    supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('status', '읽는 중')
      .or('ownership_status.is.null,ownership_status.neq.방출')
      .or('format.is.null,format.neq.방출'),
    supabase.from('books').select('*', { count: 'exact', head: true }).eq('status', '완독'),
  ]);

  const totalBooksCount = booksTotalRes.count ?? 0;
  const releasedBooksCount = booksReleasedRes.count ?? 0;
  const readingBooksCount = booksReadingRes.count ?? 0;
  const completedBooksCount = booksCompletedRes.count ?? 0;
  const ownedBooksCount = totalBooksCount - releasedBooksCount;
  const completedRatio = totalBooksCount > 0 ? completedBooksCount / totalBooksCount : 0;

  return (
    <div className={layout.summaryCard}>
      <h2 className={`${layout.summaryCardHeader} flex items-center gap-2 text-[15px] font-semibold text-ink`}>
        <Link href="/books" className="inline-flex items-center gap-2 transition-opacity hover:opacity-90">
          <BookOpen className="size-4 shrink-0 text-mute" strokeWidth={1.5} /> 소장 도서
        </Link>
      </h2>
      {totalBooksCount === 0 ? (
        <p className="text-sm text-mute">등록된 도서가 없습니다.</p>
      ) : (
        <div className={layout.bookStatsBody}>
          <div className={layout.bookDonut}>
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--surface-elevated)" strokeWidth="7" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="var(--accent-blue)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${completedRatio * 276.46} 276.46`}
                className="transition-all duration-700"
              />
              <circle cx="50" cy="50" r="34" fill="none" stroke="var(--surface-elevated)" strokeWidth="7" />
              <circle
                cx="50"
                cy="50"
                r="34"
                fill="none"
                stroke="var(--accent-yellow)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(readingBooksCount / (totalBooksCount || 1)) * 213.63} 213.63`}
                className="transition-all duration-700"
              />
              <circle cx="50" cy="50" r="24" fill="none" stroke="var(--surface-elevated)" strokeWidth="7" />
              <circle
                cx="50"
                cy="50"
                r="24"
                fill="none"
                stroke="var(--accent-green)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(Math.max(ownedBooksCount - readingBooksCount - completedBooksCount, 0) / (totalBooksCount || 1)) * 150.8} 150.8`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[22px] font-semibold tracking-tight text-ink tabular-nums">
              {Math.round(completedRatio * 100)}%
            </span>
          </div>
          <div className={layout.bookStatsGrid}>
            <Link href="/books?ownership=전체" className={layout.bookStatsLabel}>
              총 권수
            </Link>
            <Link href="/books?ownership=전체" className={layout.bookStatsValue}>
              {totalBooksCount}권
            </Link>
            <Link href="/books?ownership=보유중" className={layout.bookStatsLabel}>
              보유 권수
            </Link>
            <Link href="/books?ownership=보유중" className={layout.bookStatsValue}>
              {ownedBooksCount}권
            </Link>
            <Link href="/books?status=읽는중" className={layout.bookStatsLabel}>
              읽는 중
            </Link>
            <Link
              href="/books?status=읽는중"
              className={layout.bookStatsValue}
              style={{ color: 'var(--accent-yellow)' }}
            >
              {readingBooksCount}권
            </Link>
            <Link href="/books?status=완독" className={layout.bookStatsLabel}>
              완독
            </Link>
            <Link
              href="/books?status=완독"
              className={layout.bookStatsValue}
              style={{ color: 'var(--accent-blue)' }}
            >
              {completedBooksCount}권
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
