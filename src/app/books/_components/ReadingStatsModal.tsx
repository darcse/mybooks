'use client';

import { useState, useEffect } from 'react';
import type { Book } from '../types';
import { ReadingYearlyChart } from './ReadingYearlyChart';
import { ReadingCategoryChart } from './ReadingCategoryChart';
import { ReadingYearAnalysisChart, ReadingYearAnalysisHeader } from './ReadingYearAnalysisChart';
import { ReadingStatsComment } from './ReadingStatsComment';
import { ReadingStatsOverview } from './ReadingStatsOverview';
import { useReadingStatsData } from './useReadingStatsData';

const YEARLY_READING_GOAL = 36;

type ReadingStatsModalProps = {
  library: Book[];
  onClose: () => void;
  onReadingBookClick?: (book: Book) => void;
  isAuthenticated?: boolean;
};

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

  const {
    readingBooks,
    thisMonthFinished,
    thisYearFinished,
    yearlyData,
    monthlyData,
    yearlyPurchaseData,
    availableYears,
    categoryStatsData,
    stats3YearOptions,
    stats3FinishedForYear,
    stats3BooksByMonth,
  } = useReadingStatsData(library, selectedYear, setSelectedYear, stats3Year, thisYear, thisMonth);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

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
          <ReadingStatsOverview
            library={library}
            readingBooks={readingBooks}
            thisMonthFinishedCount={thisMonthFinished.length}
            thisYearFinishedCount={thisYearFinished.length}
            onReadingBookClick={onReadingBookClick}
          />
        )}

        {activeTab === 'stats' && (
          <ReadingYearlyChart
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            availableYears={availableYears}
            thisYear={thisYear}
            thisMonth={thisMonth}
            monthlyCounts={monthlyData.map((d) => d.count)}
            yearlyData={yearlyData}
            yearlyPurchaseData={yearlyPurchaseData}
            yearlyGoal={YEARLY_READING_GOAL}
            selectClass={selectClass}
          />
        )}

        {activeTab === 'stats2' && (
          <ReadingCategoryChart
            categoryStatsData={categoryStatsData}
            totalBooks={library.length}
          />
        )}

        {activeTab === 'stats3' && (
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide pr-1">
            <ReadingYearAnalysisHeader
              stats3Year={stats3Year}
              setStats3Year={setStats3Year}
              stats3YearOptions={stats3YearOptions}
              finishedCount={stats3FinishedForYear.length}
              selectClass={selectClass}
            />
            <ReadingStatsComment
              stats3Year={stats3Year}
              stats3FinishedForYear={stats3FinishedForYear}
              isAuthenticated={isAuthenticated}
              activeTab={activeTab}
            />
            <ReadingYearAnalysisChart
              booksByMonth={stats3BooksByMonth}
              onReadingBookClick={onReadingBookClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
