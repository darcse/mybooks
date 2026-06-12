'use client';

type CategoryStat = {
  category: string;
  purchased: number;
  finished: number;
  rate: number;
};

type ReadingCategoryChartProps = {
  categoryStatsData: CategoryStat[];
  totalBooks: number;
};

export function ReadingCategoryChart({
  categoryStatsData,
  totalBooks,
}: ReadingCategoryChartProps) {
  return (
    <div className="space-y-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide pr-1">
      <div>
        <p className="text-sm font-semibold mb-3">카테고리별 구입</p>
        <div className="space-y-2">
          {categoryStatsData.map(({ category, purchased }) => {
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
  );
}
