'use client';

import { useMemo, useEffect } from 'react';
import type { Book } from '../types';
import { categoryOptions } from '../constants';

export function useReadingStatsData(
  library: Book[],
  selectedYear: number,
  setSelectedYear: (year: number) => void,
  stats3Year: number,
  thisYear: number,
  thisMonth: number,
) {
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
  }, [availableYears, selectedYear, thisYear, setSelectedYear]);

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

  return {
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
  };
}
