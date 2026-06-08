'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Camera } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';
import { PhotobookLibraryContent } from './_components/PhotobookLibraryContent';

function PhotobookLoginPrompt() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="mb-3 flex items-center justify-center gap-2 text-xl font-medium text-ink">
        <Camera className="size-6 shrink-0 text-mute" strokeWidth={1.5} />
        Photobook
      </h1>
      <p className="mb-6 text-[15px] leading-relaxed text-body">
        포토북 목록과 상세 내용을 보려면 로그인이 필요합니다.
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

export default function PhotobookPage() {
  const isAuthenticated = useAuthState();

  if (isAuthenticated === null) {
    return <div className="p-8 text-center text-mute">로딩 중...</div>;
  }

  if (!isAuthenticated) {
    return <PhotobookLoginPrompt />;
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-mute">로딩 중...</div>}>
      <PhotobookLibraryContent />
    </Suspense>
  );
}
