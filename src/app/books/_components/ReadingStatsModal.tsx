'use client';

import { useMemo, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Book } from '../types';
import { categoryOptions } from '../constants';

const READING_GOALS = {
  monthly: 3,
  yearly: 36,
};

type ReadingStatsModalProps = {
  library: Book[];
  onClose: () => void;
  onReadingBookClick?: (book: Book) => void;
  isAuthenticated?: boolean;
};

function ProgressRing({
  value,
  max,
  color,
  size = 80,
  strokeWidth = 7,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--surface-elevated)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${ratio * circ} ${circ}`}
        className="transition-all duration-700"
      />
    </svg>
  );
}

function MonthlyCompletionBarChartSVG({
  data,
  selectedYear,
  thisYear,
  thisMonth,
}: {
  data: number[];
  selectedYear: number;
  thisYear: number;
  thisMonth: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const W = 600;
  const H = 160;
  const marginLeft = 24;
  const marginRight = 12;
  const marginTop = 16;
  const marginBottom = 30;

  const chartW = W - marginLeft - marginRight;
  const chartH = H - marginTop - marginBottom;
  const max = Math.max(...data, 1);
  const step = chartW / 12;
  const barW = step * 0.6;

  const hoveredInfo =
    hoveredIndex != null
      ? (() => {
          const count = data[hoveredIndex];
          const barH = (count / max) * chartH;
          const x = marginLeft + hoveredIndex * step + (step - barW) / 2;
          const y = marginTop + (chartH - barH);
          return { count, x, y };
        })()
      : null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="img"
        aria-label="월별 완독 통계"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <line
          x1={marginLeft}
          x2={W - marginRight}
          y1={marginTop + chartH}
          y2={marginTop + chartH}
          stroke="var(--hairline)"
        />

        {data.map((count, i) => {
          const month = i + 1;
          const barH = (count / max) * chartH;
          const x = marginLeft + i * step + (step - barW) / 2;
          const y = marginTop + (chartH - barH);

          const baseOpacity =
            selectedYear === thisYear
              ? month === thisMonth
                ? 1
                : month < thisMonth
                  ? 0.35
                  : 0.15
              : selectedYear < thisYear
                ? 0.35
                : 0.15;

          const isHovered = hoveredIndex === i;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill="var(--accent-blue)"
              fillOpacity={isHovered ? 1 : baseOpacity}
              stroke={isHovered ? 'var(--ink)' : 'transparent'}
              strokeWidth={isHovered ? 1 : 0}
              style={{ cursor: 'default' }}
              onMouseEnter={() => setHoveredIndex(i)}
            />
          );
        })}

        {data.map((_, i) => {
          const month = i + 1;
          const x = marginLeft + i * step + step / 2;
          return (
            <text
              key={i}
              x={x}
              y={H - 10}
              textAnchor="middle"
              fontSize="12"
              fill="var(--mute)"
            >
              {month}월
            </text>
          );
        })}
      </svg>

      {hoveredIndex != null && (
        <div
          style={{
            position: 'absolute',
            left: `${((hoveredInfo!.x + barW / 2) / W) * 100}%`,
            top: `${(hoveredInfo!.y / H) * 100}%`,
            transform: 'translate(-50%, -100%)',
            background: 'var(--surface-card)',
            border: '1px solid var(--hairline)',
            color: 'var(--ink)',
            borderRadius: 10,
            padding: '6px 10px',
            fontSize: 12,
            opacity: 0.98,
            pointerEvents: 'none',
          }}
        >
          {data[hoveredIndex]}권
        </div>
      )}
    </div>
  );
}

function YearlyCompletionBarChartSVG({
  data,
  thisYear,
  yearlyGoal,
  showGoalRate = true,
  barFill = 'var(--accent-blue)',
  barStroke = 'var(--ink)',
  priceData,
}: {
  data: { year: number; yearLabel?: string; count: number }[];
  thisYear: number;
  yearlyGoal: number;
  showGoalRate?: boolean;
  barFill?: string;
  barStroke?: string;
  priceData?: Record<number, number>;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const W = 600;
  const H = 140;
  const marginLeft = 20;
  const marginRight = 12;
  const marginTop = 16;
  const marginBottom = 30;

  const chartW = W - marginLeft - marginRight;
  const chartH = H - marginTop - marginBottom;
  const max = Math.max(...data.map((d) => d.count), 1);
  const n = Math.max(data.length, 1);
  const step = chartW / n;
  const barW = step * 0.6;

  const hoveredInfo =
    hoveredIndex != null
      ? (() => {
          const entry = data[hoveredIndex];
          const barH = (entry.count / max) * chartH;
          const x = marginLeft + hoveredIndex * step + (step - barW) / 2;
          const y = marginTop + (chartH - barH);
          const xCenter = x + barW / 2;
          return { year: entry.year, count: entry.count, xCenter, y };
        })()
      : null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="img"
        aria-label="연도별 완독 통계"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <line
          x1={marginLeft}
          x2={W - marginRight}
          y1={marginTop + chartH}
          y2={marginTop + chartH}
          stroke="var(--hairline)"
        />

        {data.map((entry, i) => {
          const barH = (entry.count / max) * chartH;
          const x = marginLeft + i * step + (step - barW) / 2;
          const y = marginTop + (chartH - barH);
          const baseOpacity = entry.year === thisYear ? 1 : 0.35;
          const isHovered = hoveredIndex === i;

          return (
            <rect
              key={entry.year}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={barFill}
              fillOpacity={isHovered ? 1 : baseOpacity}
              stroke={isHovered ? barStroke : 'transparent'}
              strokeWidth={isHovered ? 1 : 0}
              style={{ cursor: 'default' }}
              onMouseEnter={() => setHoveredIndex(i)}
            />
          );
        })}

        {data.map((entry, i) => {
          const x = marginLeft + i * step + step / 2;
          return (
            <text
              key={entry.year}
              x={x}
              y={H - 10}
              textAnchor="middle"
              fontSize="12"
              fill="var(--mute)"
            >
              {entry.yearLabel ?? entry.year}
            </text>
          );
        })}
      </svg>

      {hoveredIndex != null && hoveredInfo && (
        <div
          style={{
            position: 'absolute',
            left: `${(hoveredInfo.xCenter / W) * 100}%`,
            top: `${(hoveredInfo.y / H) * 100}%`,
            transform: 'translate(-50%, -100%)',
            background: 'var(--surface-card)',
            border: '1px solid var(--hairline)',
            color: 'var(--ink)',
            borderRadius: 10,
            padding: '6px 10px',
            fontSize: 12,
            opacity: 0.98,
            pointerEvents: 'none',
          }}
        >
          {hoveredInfo.count}권
          {showGoalRate && yearlyGoal > 0
            ? ` (${Math.round((hoveredInfo.count / yearlyGoal) * 100)}%)`
            : ''}
          {priceData && priceData[hoveredInfo.year] ? (
            <><br />{priceData[hoveredInfo.year].toLocaleString()}원</>
          ) : ''}
        </div>
      )}
    </div>
  );
}

export function ReadingStatsModal({
  library,
  onClose,
  onReadingBookClick,
  isAuthenticated = false,
}: ReadingStatsModalProps) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'stats2' | 'stats3'>('overview');
  const [selectedYear, setSelectedYear] = useState<number>(thisYear);
  const [stats3Year, setStats3Year] = useState<number>(thisYear);
  const [stats3Comment, setStats3Comment] = useState<string | null>(null);
  const [stats3CommentLoading, setStats3CommentLoading] = useState(false);
  const [stats3Refreshing, setStats3Refreshing] = useState(false);

  const finishedBooks = useMemo(
    () =>
      library.filter(
        (b) =>
          b.status === '완독' &&
          !!b.finished_at &&
          String(b.finished_at) >= '2020-01-01',
      ),
    [library],
  );

  const readingBooks = useMemo(
    () => library.filter((b) => b.status === '읽는 중'),
    [library],
  );

  const thisMonthFinished = useMemo(
    () =>
      finishedBooks.filter((b) => {
        const d = new Date(b.finished_at as string);
        return d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth;
      }),
    [finishedBooks, thisYear, thisMonth],
  );

  const thisYearFinished = useMemo(
    () =>
      finishedBooks.filter((b) => {
        const d = new Date(b.finished_at as string);
        return d.getFullYear() === thisYear;
      }),
    [finishedBooks, thisYear],
  );

  const yearlyData = useMemo(() => {
    const before2019Count = library.filter(
      (b) =>
        b.status === '완독' &&
        !!b.finished_at &&
        String(b.finished_at) < '2020-01-01',
    ).length;

    const map: Record<number, number> = {};
    finishedBooks.forEach((b) => {
      const y = new Date(b.finished_at as string).getFullYear();
      map[y] = (map[y] || 0) + 1;
    });
    const yearlyData2020Plus = Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, count]) => ({ year: Number(year), count }));

    return before2019Count > 0
      ? [{ year: 2019, yearLabel: '~2019', count: before2019Count }, ...yearlyData2020Plus]
      : yearlyData2020Plus;
  }, [finishedBooks, library]);

  const monthlyData = useMemo(() => {
    const map: Record<number, number> = {};
    finishedBooks
      .filter((b) => new Date(b.finished_at as string).getFullYear() === selectedYear)
      .forEach((b) => {
        const m = new Date(b.finished_at as string).getMonth() + 1;
        map[m] = (map[m] || 0) + 1;
      });
    return Array.from({ length: 12 }, (_, i) => ({
      month: `${i + 1}월`,
      count: map[i + 1] || 0,
    }));
  }, [finishedBooks, selectedYear]);

  const yearlyPurchaseData = useMemo(() => {
    const countMap: Record<number, number> = {};
    const priceMap: Record<number, number> = {};

    const cutoffTime = new Date('2020-01-01').getTime();
    let before2019Count = 0;
    let before2019TotalPrice = 0;

    library.forEach((b) => {
      if (!b.purchase_date) return;
      const d = new Date(b.purchase_date as string);
      if (Number.isNaN(d.getTime())) return;

      if (d.getTime() < cutoffTime) {
        before2019Count += 1;
        before2019TotalPrice += (b.price || 0);
        return;
      }

      const y = d.getFullYear();
      countMap[y] = (countMap[y] || 0) + 1;
      priceMap[y] = (priceMap[y] || 0) + (b.price || 0);
    });

    const yearlyPurchaseData2020Plus = Object.entries(countMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, count]) => ({
        year: Number(year),
        count,
        totalPrice: priceMap[Number(year)] || 0,
      }));

    return before2019Count > 0
      ? [{ year: 2019, yearLabel: '~2019', count: before2019Count, totalPrice: before2019TotalPrice }, ...yearlyPurchaseData2020Plus]
      : yearlyPurchaseData2020Plus;
  }, [library]);

  const availableYears = useMemo(
    () => yearlyData.filter((d) => d.year >= 2020).map((d) => d.year).sort((a, b) => b - a),
    [yearlyData],
  );

  const categoryStatsData = useMemo(() => {
    const purchaseMap: Record<string, number> = {};
    const finishedMap: Record<string, number> = {};
    library.forEach((b) => {
      const rawCat = String(b.category ?? '').trim();
      if (!rawCat) return;
      if (!(categoryOptions as readonly string[]).includes(rawCat)) return;
      const cat = rawCat;
      if (b.purchase_date) purchaseMap[cat] = (purchaseMap[cat] || 0) + 1;
      if (b.status === '완독') finishedMap[cat] = (finishedMap[cat] || 0) + 1;
    });
    return categoryOptions
      .map((cat) => ({
        category: cat,
        purchased: purchaseMap[cat] || 0,
        finished: finishedMap[cat] || 0,
        rate: purchaseMap[cat] > 0
          ? Math.round(((finishedMap[cat] || 0) / purchaseMap[cat]) * 100)
          : 0,
      }))
      .filter(({ purchased }) => purchased > 0)
      .sort((a, b) => b.purchased - a.purchased);
  }, [library]);

  useEffect(() => {
    if (availableYears.length === 0) return;
    const isInOptions = availableYears.includes(selectedYear);
    if (isInOptions) return;
    const nextYear = availableYears.includes(thisYear) ? thisYear : availableYears[0];
    setSelectedYear(nextYear);
  }, [availableYears, selectedYear, thisYear]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const stats3YearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 2020; y <= thisYear; y += 1) years.push(y);
    return years.sort((a, b) => b - a);
  }, [thisYear]);

  const stats3FinishedForYear = useMemo(
    () =>
      finishedBooks.filter((b) => new Date(b.finished_at as string).getFullYear() === stats3Year),
    [finishedBooks, stats3Year],
  );

  const stats3BooksByMonth = useMemo(() => {
    const map = new Map<number, Book[]>();
    stats3FinishedForYear.forEach((b) => {
      const m = new Date(b.finished_at as string).getMonth() + 1;
      const arr = map.get(m) ?? [];
      arr.push(b);
      map.set(m, arr);
    });
    const months = Array.from(map.keys()).sort((a, b) => a - b);
    return months.map((month) => {
      const books = (map.get(month) ?? []).slice().sort((a, b) => {
        const ta = new Date(a.finished_at as string).getTime();
        const tb = new Date(b.finished_at as string).getTime();
        return ta - tb;
      });
      return { month, books };
    });
  }, [stats3FinishedForYear]);

  useEffect(() => {
    if (activeTab !== 'stats3' || !isAuthenticated) {
      if (activeTab === 'stats3' && !isAuthenticated) {
        setStats3Comment(null);
      }
      return;
    }
    let cancelled = false;
    setStats3CommentLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/book-stats-comment?year=${stats3Year}`);
        const data = (await res.json()) as { comment?: unknown; error?: unknown };
        if (cancelled) return;
        if (!res.ok) {
          setStats3Comment(null);
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
        if (!cancelled) setStats3Comment(c);
      } catch {
        if (!cancelled) setStats3Comment(null);
      } finally {
        if (!cancelled) setStats3CommentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, stats3Year, isAuthenticated, stats3FinishedForYear]);

  const tabClass = (tab: 'overview' | 'stats' | 'stats2' | 'stats3') =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'border border-hairline bg-surface-elevated text-ink'
        : 'text-mute hover:text-body'
    }`;

  const selectClass =
    'h-auto rounded-md border border-hairline bg-surface-elevated px-2 py-1 text-xs text-ink outline-none focus:border-[var(--hairline-strong)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex h-[85vh] w-full max-w-lg flex-col rounded-sm border border-hairline bg-surface p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-4 text-2xl font-medium text-mute hover:text-ink"
        >
          &times;
        </button>

        <h2 className="mb-5 text-xl font-medium text-ink">독서 기록</h2>

        <div className="flex gap-2 mb-6 shrink-0">
          <button
            type="button"
            className={tabClass('overview')}
            onClick={() => setActiveTab('overview')}
          >
            현황 & 목표
          </button>
          <button
            type="button"
            className={tabClass('stats')}
            onClick={() => setActiveTab('stats')}
          >
            통계
          </button>
          <button
            type="button"
            className={tabClass('stats2')}
            onClick={() => setActiveTab('stats2')}
          >
            통계2
          </button>
          <button
            type="button"
            className={tabClass('stats3')}
            onClick={() => setActiveTab('stats3')}
          >
            통계3
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide pr-1">
            <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: '전체',
                    value: library.length,
                    color: 'var(--ink)',
                  },
                  { label: '읽는 중', value: readingBooks.length, color: 'var(--accent-yellow)' },
                  {
                    label: '완독',
                    value: library.filter((b) => b.status === '완독').length,
                    color: 'var(--accent-blue)',
                  },
                ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl text-center"
                  style={{ background: 'var(--surface-elevated)' }}
                >
                  <p className="text-2xl font-bold" style={{ color }}>
                    {value}
                  </p>
                  <p className="text-xs opacity-60 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div
              className="pt-4 border-t"
              style={{ borderColor: 'var(--hairline)' }}
            >
              <p className="text-sm font-semibold mb-4">목표 달성률</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: '이번 달',
                    current: thisMonthFinished.length,
                    goal: READING_GOALS.monthly,
                    color: 'var(--accent-yellow)',
                  },
                  {
                    label: '올해',
                    current: thisYearFinished.length,
                    goal: READING_GOALS.yearly,
                    color: 'var(--accent-blue)',
                  },
                ].map(({ label, current, goal, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl"
                    style={{ background: 'var(--surface-elevated)' }}
                  >
                    <div className="relative">
                      <ProgressRing
                        value={current}
                        max={goal}
                        color={color}
                        size={88}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold" style={{ color }}>
                          {current}
                        </span>
                        <span className="text-[10px] opacity-50">/ {goal}</span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold opacity-70">{label}</p>
                    <p className="text-xs opacity-50">
                      {goal > 0 ? Math.round((current / goal) * 100) : 0}% 달성
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {readingBooks.length > 0 && (
              <div
                className="pt-4 border-t"
                style={{ borderColor: 'var(--hairline)' }}
              >
                <p className="text-sm font-semibold mb-3">
                  읽는 중 ({readingBooks.length}권)
                </p>
                <div className="space-y-3">
                  {readingBooks.map((book) => {
                    const total = book.total_pages || 0;
                    const current = book.current_page || 0;
                    const ratio = total > 0 ? Math.min((current / total) * 100, 100) : 0;
                    return (
                      <button
                        key={book.id}
                        type="button"
                        className="w-full text-left rounded-lg transition-opacity hover:opacity-85 focus:outline-none"
                        onClick={() => onReadingBookClick?.(book)}
                      >
                        <div className="flex items-center gap-3 mb-1.5">
                          {book.cover_image_url && (
                            <img
                              src={book.cover_image_url}
                              alt=""
                              className="w-8 h-10 object-cover rounded-md flex-shrink-0"
                              style={{ border: '1px solid var(--hairline)' }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {book.title}
                            </p>
                            <p className="text-xs opacity-50 truncate">
                              {book.author}
                            </p>
                          </div>
                          <span className="text-xs font-semibold opacity-70 shrink-0">
                            {total > 0 ? `${current}/${total}p` : `${current}p`}
                          </span>
                        </div>
                        {total > 0 && (
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'var(--surface-elevated)' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${ratio}%`,
                                background: 'var(--accent-yellow)',
                              }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide pr-1">
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{selectedYear}년 월별 완독</p>
                {availableYears.length > 0 && (
                  <select
                    className={selectClass}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ width: '100%', height: 120 }}>
                <MonthlyCompletionBarChartSVG
                  data={monthlyData.map((d) => d.count)}
                  selectedYear={selectedYear}
                  thisYear={thisYear}
                  thisMonth={thisMonth}
                />
              </div>
            </div>

            {yearlyData.length > 0 && (
              <div
                className="pt-4 border-t"
                style={{ borderColor: 'var(--hairline)' }}
              >
                <p className="text-sm font-semibold mb-3">연도별 완독</p>
                <div style={{ width: '100%', height: 110 }}>
                  <YearlyCompletionBarChartSVG data={yearlyData} thisYear={thisYear} yearlyGoal={READING_GOALS.yearly} />
                </div>
              </div>
            )}

            {yearlyPurchaseData.length > 0 && (
              <div
                className="pt-4 border-t"
                style={{ borderColor: 'var(--hairline)' }}
              >
                <p className="text-sm font-semibold mb-3">연도별 구입</p>
                <div style={{ width: '100%', height: 120 }}>
                  <YearlyCompletionBarChartSVG
                    data={yearlyPurchaseData}
                    thisYear={thisYear}
                    yearlyGoal={READING_GOALS.yearly}
                    showGoalRate={false}
                    barFill="var(--accent-yellow)"
                    barStroke="var(--accent-yellow)"
                    priceData={Object.fromEntries(yearlyPurchaseData.map((d) => [d.year, d.totalPrice]))}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats2' && (
          <div className="space-y-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide pr-1">
            <div>
              <p className="text-sm font-semibold mb-3">카테고리별 구입</p>
              <div className="space-y-2">
                {categoryStatsData.map(({ category, purchased }) => {
                  const totalBooks = library.length || 0;
                  const maxPurchased = Math.max(...categoryStatsData.map((d) => d.purchased), 1);
                  const ratio = maxPurchased > 0 ? (purchased / maxPurchased) * 100 : 0;
                  const percent = totalBooks > 0 ? Math.round((purchased / totalBooks) * 100) : 0;
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-xs opacity-60 w-28 shrink-0 truncate">{category}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-elevated)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ratio}%`, background: 'var(--accent-blue)' }} />
                      </div>
                      <span className="text-xs opacity-60 shrink-0 w-20 text-right">{purchased}건 ({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <p className="text-sm font-semibold mb-3">카테고리별 완독</p>
              <div className="space-y-2">
                {categoryStatsData.map(({ category, finished, rate }) => {
                  const maxRate = Math.max(...categoryStatsData.map((d) => d.rate), 1);
                  const ratio = maxRate > 0 ? (rate / maxRate) * 100 : 0;
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-xs opacity-60 w-28 shrink-0 truncate">{category}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-elevated)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ratio}%`, background: 'var(--accent-green)' }} />
                      </div>
                      <span className="text-xs opacity-60 shrink-0 w-20 text-right">{finished}권 ({rate}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats3' && (
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide pr-1">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <p className="text-sm font-semibold">
                {stats3Year}년 ({stats3FinishedForYear.length}권)
              </p>
              <select
                className={`${selectClass} shrink-0`}
                value={stats3Year}
                onChange={(e) => setStats3Year(Number(e.target.value))}
              >
                {stats3YearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>

            <div
              className="flex gap-2 items-start rounded-xl p-3 shrink-0"
              style={{ background: 'var(--surface-elevated)' }}
            >
              <div
                className={`flex-1 min-w-0 text-sm leading-snug ${stats3Comment ? 'whitespace-pre-line' : ''}`}
                style={{ color: 'var(--ink)' }}
              >
                {stats3FinishedForYear.length === 0 ? (
                  <span className="opacity-60">해당 연도에 완독한 도서가 없습니다.</span>
                ) : stats3CommentLoading ? (
                  <span className="opacity-50">불러오는 중…</span>
                ) : stats3Comment ? (
                  stats3Comment
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
                    stats3CommentLoading ||
                    stats3Refreshing
                  }
                  aria-label="코멘트 새로고침"
                  onClick={async () => {
                    if (stats3FinishedForYear.length === 0) return;
                    setStats3Refreshing(true);
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
                        setStats3Comment(c.trim());
                      } else {
                        setStats3Comment(null);
                      }
                    } catch {
                      toast.error('요청에 실패했습니다.');
                    } finally {
                      setStats3Refreshing(false);
                    }
                  }}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${stats3Refreshing ? 'animate-spin' : ''}`}
                    aria-hidden
                  />
                </button>
              )}
            </div>

            {stats3BooksByMonth.length > 0 && (
              <div className="space-y-5 pt-1">
                {stats3BooksByMonth.map(({ month, books }) => (
                  <div key={month}>
                    <p className="text-xs font-semibold opacity-70 mb-2">{month}월</p>
                    <div className="space-y-2">
                      {books.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          className="w-full text-left rounded-lg p-2 flex items-center gap-3 transition-opacity hover:opacity-85"
                          style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline)' }}
                          onClick={() => onReadingBookClick?.(book)}
                        >
                          {book.cover_image_url ? (
                            <img
                              src={book.cover_image_url}
                              alt=""
                              className="w-10 h-[52px] object-cover rounded-md shrink-0"
                              style={{ border: '1px solid var(--hairline)' }}
                            />
                          ) : (
                            <div
                              className="w-10 h-[52px] rounded-md shrink-0"
                              style={{ background: 'var(--surface-elevated)', border: '1px solid var(--hairline)' }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{book.title}</p>
                            <p className="text-xs opacity-50 truncate">{book.author ?? ''}</p>
                            <p className="text-xs opacity-60 truncate mt-0.5">{book.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

