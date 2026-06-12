'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Book } from '../types';

type ReadingStatsCommentProps = {
  stats3Year: number;
  stats3FinishedForYear: Book[];
  isAuthenticated: boolean;
  activeTab: 'overview' | 'stats' | 'stats2' | 'stats3';
};

export function ReadingStatsComment({
  stats3Year,
  stats3FinishedForYear,
  isAuthenticated,
  activeTab,
}: ReadingStatsCommentProps) {
  const [comment, setComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeTab !== 'stats3' || !isAuthenticated) {
      if (activeTab === 'stats3' && !isAuthenticated) {
        setComment(null);
      }
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/book-stats-comment?year=${stats3Year}`);
        const data = (await res.json()) as { comment?: unknown; error?: unknown };
        if (cancelled) return;
        if (!res.ok) {
          setComment(null);
          return;
        }
        let c =
          typeof data.comment === 'string' && data.comment.trim() !== ''
            ? data.comment.trim()
            : null;
        if (c === null && stats3FinishedForYear.length > 0) {
          const res2 = await fetch('/api/book-stats-comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: stats3Year, force: false }),
          });
          const data2 = (await res2.json()) as {
            comment?: unknown;
            message?: unknown;
            error?: unknown;
          };
          if (cancelled) return;
          if (res2.ok && typeof data2.comment === 'string' && data2.comment.trim() !== '') {
            c = data2.comment.trim();
          } else if (!res2.ok) {
            const msg =
              (typeof data2.message === 'string' && data2.message) ||
              (typeof data2.error === 'string' && data2.error) ||
              '요청에 실패했습니다.';
            toast.error(msg);
          }
        }
        if (!cancelled) setComment(c);
      } catch {
        if (!cancelled) setComment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, stats3Year, isAuthenticated, stats3FinishedForYear]);

  return (
    <div
      className="flex gap-2 items-start rounded-xl p-3 shrink-0"
      style={{ background: 'var(--surface-elevated)' }}
    >
      <div
        className={`flex-1 min-w-0 text-sm leading-snug ${comment ? 'whitespace-pre-line' : ''}`}
        style={{ color: 'var(--ink)' }}
      >
        {stats3FinishedForYear.length === 0 ? (
          <span className="opacity-60">해당 연도에 완독한 도서가 없습니다.</span>
        ) : loading ? (
          <span className="opacity-50">불러오는 중…</span>
        ) : comment ? (
          comment
        ) : (
          <span className="opacity-60">
            {isAuthenticated ? '분석 코멘트가 없습니다. 새로고침으로 생성할 수 있습니다.' : '로그인 시 분석 코멘트를 확인할 수 있습니다.'}
          </span>
        )}
      </div>
      {isAuthenticated && (
        <button
          type="button"
          className="shrink-0 p-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40 disabled:pointer-events-none"
          style={{ border: '1px solid var(--hairline)', color: 'var(--ink)' }}
          disabled={
            stats3FinishedForYear.length === 0 ||
            loading ||
            refreshing
          }
          aria-label="코멘트 새로고침"
          onClick={async () => {
            if (stats3FinishedForYear.length === 0) return;
            setRefreshing(true);
            try {
              const res = await fetch('/api/book-stats-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year: stats3Year, force: true }),
              });
              const data = (await res.json()) as {
                comment?: unknown;
                error?: unknown;
                message?: unknown;
              };
              if (!res.ok) {
                const msg =
                  (typeof data.message === 'string' && data.message) ||
                  (typeof data.error === 'string' && data.error) ||
                  '요청에 실패했습니다.';
                toast.error(msg);
                return;
              }
              const c = data.comment;
              if (typeof c === 'string' && c.trim() !== '') {
                setComment(c.trim());
              } else {
                setComment(null);
              }
            } catch {
              toast.error('요청에 실패했습니다.');
            } finally {
              setRefreshing(false);
            }
          }}
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            aria-hidden
          />
        </button>
      )}
    </div>
  );
}
