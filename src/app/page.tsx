import { Suspense } from 'react';
import { BarChart3 } from 'lucide-react';
import { BookStats, BookStatsSkeleton } from './_components/BookStats';
import { CategoryStats, CategoryStatsSkeleton } from './_components/CategoryStats';
import { RecentPicks, RecentPicksSkeleton } from './_components/RecentPicks';
import { DashboardTimelessSection } from './_components/DashboardTimelessSection';
import layout from './_components/DashboardLayout.module.css';

export const dynamic = 'force-dynamic';

export default function Page() {
  const year = new Date().getFullYear();
  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
      <h1 className="mb-4 flex items-center gap-2 border-b border-hairline pb-2 text-xl font-medium text-ink">
        <BarChart3 className="size-5 shrink-0 text-mute" strokeWidth={1.5} /> Summary
      </h1>

      <div className={layout.summaryRow}>
        <div className={layout.summaryBook}>
          <Suspense fallback={<BookStatsSkeleton />}>
            <BookStats />
          </Suspense>
        </div>
        <div className={layout.summaryCategory}>
          <Suspense fallback={<CategoryStatsSkeleton />}>
            <CategoryStats />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<RecentPicksSkeleton />}>
        <RecentPicks />
      </Suspense>

      <DashboardTimelessSection />

      <footer className="mt-12 border-t border-hairline py-10 text-center text-mute">
        <p className="text-sm font-medium">© {year} SSH Love. All rights reserved.</p>
        <p className="mt-1 text-xs opacity-80">Built with Claude, Cursor, and Stitch.</p>
      </footer>
    </div>
  );
}
