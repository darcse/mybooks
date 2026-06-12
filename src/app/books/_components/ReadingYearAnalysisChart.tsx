'use client';

import type { Book } from '../types';

type MonthBooks = {
  month: number;
  books: Book[];
};

type ReadingYearAnalysisChartProps = {
  stats3Year: number;
  setStats3Year: (year: number) => void;
  stats3YearOptions: number[];
  finishedCount: number;
  booksByMonth: MonthBooks[];
  onReadingBookClick?: (book: Book) => void;
  selectClass: string;
};

export function ReadingYearAnalysisHeader({
  stats3Year,
  setStats3Year,
  stats3YearOptions,
  finishedCount,
  selectClass,
}: Pick<
  ReadingYearAnalysisChartProps,
  'stats3Year' | 'setStats3Year' | 'stats3YearOptions' | 'finishedCount' | 'selectClass'
>) {
  return (
    <div className="flex items-center justify-between gap-2 shrink-0">
      <p className="text-sm font-semibold">
        {stats3Year}년 ({finishedCount}권)
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
  );
}

export function ReadingYearAnalysisChart({
  booksByMonth,
  onReadingBookClick,
}: Pick<ReadingYearAnalysisChartProps, 'booksByMonth' | 'onReadingBookClick'>) {
  return (
    <>
      {booksByMonth.length > 0 && (
        <div className="space-y-5 pt-1">
          {booksByMonth.map(({ month, books }) => (
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
    </>
  );
}
