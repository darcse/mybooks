'use client';

import { Suspense } from 'react';
import { ComicsLibraryContent } from './_components/ComicsLibraryContent';

export default function ComicsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-mute">로딩 중...</div>}>
      <ComicsLibraryContent />
    </Suspense>
  );
}
