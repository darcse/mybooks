import Link from 'next/link';
import type { ArchiveMonthCard } from '@/app/archive/yearStats';

type Props = {
  year: number;
  months: ArchiveMonthCard[];
};

function MonthCollage({ urls }: { urls: string[] }) {
  const slots = Array.from({ length: 6 }, (_, i) => urls[i] ?? null);
  return (
    <div className="mb-3 grid aspect-[3/2] w-full grid-cols-3 gap-1">
      {slots.map((url, i) => (
        <div
          key={i}
          className="relative aspect-square min-h-0 w-full overflow-hidden rounded-sm border border-hairline bg-surface-elevated"
        >
          {url ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat"
              style={{ backgroundImage: `url(${JSON.stringify(url)})` }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-mute">—</div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatMonthStats(row: ArchiveMonthCard) {
  return `완독 ${row.booksFinished} · 코믹스 ${row.comics} · 포토북 ${row.photobooks}`;
}

export function ArchiveGrid({ year, months }: Props) {
  if (months.length === 0) {
    return (
      <p className="text-sm text-body">이 연도에 표시할 활동이 있는 달이 없습니다.</p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {months.map((row) => {
        const total = row.booksFinished + row.comics + row.photobooks;
        return (
          <Link
            key={row.month}
            href={`/archive/${year}/${row.month}`}
            className="rounded-sm border border-hairline bg-surface p-4 text-left transition-colors hover:bg-surface-elevated"
          >
            <MonthCollage urls={row.thumbnails} />
            <h2 className="truncate text-sm font-medium leading-tight text-ink">
              {year}년 {row.month}월
            </h2>
            <p className="mt-1 text-xs tabular-nums text-mute">{formatMonthStats(row)}</p>
            <p className="mt-0.5 text-xs tabular-nums text-mute">총 {total}건</p>
          </Link>
        );
      })}
    </div>
  );
}
