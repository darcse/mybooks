'use client';

import type { Book } from '../types';

const READING_GOALS = {
  monthly: 3,
  yearly: 36,
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

type ReadingStatsOverviewProps = {
  library: Book[];
  readingBooks: Book[];
  thisMonthFinishedCount: number;
  thisYearFinishedCount: number;
  onReadingBookClick?: (book: Book) => void;
};

export function ReadingStatsOverview({
  library,
  readingBooks,
  thisMonthFinishedCount,
  thisYearFinishedCount,
  onReadingBookClick,
}: ReadingStatsOverviewProps) {
  return (
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
              current: thisMonthFinishedCount,
              goal: READING_GOALS.monthly,
              color: 'var(--accent-yellow)',
            },
            {
              label: '올해',
              current: thisYearFinishedCount,
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
  );
}
