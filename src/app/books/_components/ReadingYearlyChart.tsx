'use client';

import { useState } from 'react';

type YearlyEntry = { year: number; yearLabel?: string; count: number };

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
  data: YearlyEntry[];
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

type ReadingYearlyChartProps = {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  thisYear: number;
  thisMonth: number;
  monthlyCounts: number[];
  yearlyData: YearlyEntry[];
  yearlyPurchaseData: Array<YearlyEntry & { totalPrice: number }>;
  yearlyGoal: number;
  selectClass: string;
};

export function ReadingYearlyChart({
  selectedYear,
  setSelectedYear,
  availableYears,
  thisYear,
  thisMonth,
  monthlyCounts,
  yearlyData,
  yearlyPurchaseData,
  yearlyGoal,
  selectClass,
}: ReadingYearlyChartProps) {
  return (
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
            data={monthlyCounts}
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
            <YearlyCompletionBarChartSVG data={yearlyData} thisYear={thisYear} yearlyGoal={yearlyGoal} />
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
              yearlyGoal={yearlyGoal}
              showGoalRate={false}
              barFill="var(--accent-yellow)"
              barStroke="var(--accent-yellow)"
              priceData={Object.fromEntries(yearlyPurchaseData.map((d) => [d.year, d.totalPrice]))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
