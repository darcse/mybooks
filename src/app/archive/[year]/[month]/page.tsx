import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { ArchiveLoginPrompt } from '@/app/archive/_components/ArchiveLoginPrompt';
import { MonthlyTimeline } from '@/app/archive/[year]/[month]/_components/MonthlyTimeline';

type Props = {
  params: Promise<{ year: string; month: string }>;
};

export default async function ArchiveMonthPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return <ArchiveLoginPrompt />;
  const { year: ys, month: ms } = await params;
  const y = parseInt(ys, 10);
  const m = parseInt(ms, 10);
  const maxY = new Date().getFullYear();
  const maxM = new Date().getMonth() + 1;
  if (!Number.isInteger(y) || !Number.isInteger(m) || y < 2026 || y > maxY || m < 1 || m > 12) {
    notFound();
  }
  if (y === maxY && m > maxM) notFound();

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={`/archive?year=${y}`}
          className="inline-flex shrink-0 items-center justify-center rounded-sm p-1 text-body hover:bg-surface-elevated hover:text-ink"
          aria-label="Archive 목록으로 돌아가기"
        >
          <ChevronLeft className="size-5 shrink-0" strokeWidth={1.8} />
        </Link>
        <h1 className="text-xl font-medium text-ink">
          {y}년 {m}월
        </h1>
      </div>
      <MonthlyTimeline key={`${y}-${m}`} year={y} month={m} />
    </div>
  );
}
