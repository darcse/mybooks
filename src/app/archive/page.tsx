import Link from 'next/link';
import { Archive } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/server';
import { ArchiveGrid } from '@/app/archive/_components/ArchiveGrid';
import { ArchiveLoginPrompt } from '@/app/archive/_components/ArchiveLoginPrompt';
import { loadArchiveYearStats } from '@/app/archive/yearStats';

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function ArchivePage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) return <ArchiveLoginPrompt />;
  const sp = await searchParams;
  const maxY = new Date().getFullYear();
  const raw = parseInt(sp.year ?? '', 10);
  const year = Number.isFinite(raw) ? Math.min(Math.max(raw, 2026), maxY) : maxY;
  const months = await loadArchiveYearStats(year);
  const yearList: number[] = [];
  for (let y = 2026; y <= maxY; y++) yearList.push(y);
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-xl font-medium text-ink">
          <Archive className="size-7 shrink-0 text-mute" strokeWidth={1.5} aria-hidden />
          Archive
        </h1>
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        {yearList.map((yy) => {
          const active = yy === year;
          return (
            <Link
              key={yy}
              href={`/archive?year=${yy}`}
              className={`nav-menu-link rounded-sm border px-3 py-1.5 text-sm font-medium ${
                active ? 'nav-menu-link-selected' : 'border-transparent'
              }`}
            >
              {yy}년
            </Link>
          );
        })}
      </div>
      <ArchiveGrid year={year} months={months} />
    </div>
  );
}
