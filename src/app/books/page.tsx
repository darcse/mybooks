'use client';

import { Suspense } from 'react';
import { BooksLibraryContent } from './_components/BooksLibraryContent';

export default function BookLibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-mute">로딩 중...</div>}>
      <BooksLibraryContent />
    </Suspense>
  );
}
