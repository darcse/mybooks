import Link from 'next/link';
import { Archive } from 'lucide-react';

export function ArchiveLoginPrompt() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="mb-3 flex items-center justify-center gap-2 text-xl font-medium text-ink">
        <Archive className="size-6 shrink-0 text-mute" strokeWidth={1.5} />
        Archive
      </h1>
      <p className="mb-6 text-[15px] leading-relaxed text-body">
        아카이브 목록과 상세 내용을 보려면 로그인이 필요합니다.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface-elevated px-5 py-2.5 text-sm font-medium text-body hover:text-ink"
      >
        로그인하기
      </Link>
    </div>
  );
}
