import { categoryOptions } from '@/app/books/constants';

type BookCategoryRow = {
  category: string | null;
  status: string | null;
  ownership_status: string | null;
  format: string | null;
};

export type BookCategoryCounts = {
  completed: number;
  owned: number;
};

function isReleased(row: BookCategoryRow): boolean {
  return (
    row.ownership_status === '방출' ||
    row.format === '방출' ||
    row.status === '방출'
  );
}

export function buildSortedBookCategories(
  rows: BookCategoryRow[],
): [string, BookCategoryCounts][] {
  const counts = rows.reduce(
    (acc, row) => {
      const cat = row.category || '기타';
      if (!acc[cat]) acc[cat] = { completed: 0, owned: 0 };
      if (!isReleased(row)) {
        acc[cat].owned += 1;
        if (row.status === '완독') acc[cat].completed += 1;
      }
      return acc;
    },
    {} as Record<string, BookCategoryCounts>,
  );

  const ordered = categoryOptions
    .filter((cat) => counts[cat] && counts[cat].owned > 0)
    .map((cat) => [cat, counts[cat]] as [string, BookCategoryCounts]);

  const extras = Object.entries(counts).filter(
    ([cat, data]) =>
      !(categoryOptions as readonly string[]).includes(cat) && data.owned > 0,
  ) as [string, BookCategoryCounts][];

  return [...ordered, ...extras];
}
