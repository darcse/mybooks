'use client';

import { toast } from 'sonner';

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3 px-8">
      <button
        type="button"
        onClick={() => toast.success('작업이 완료되었습니다.')}
        className="rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-body transition-colors hover:text-ink"
      >
        성공 toast
      </button>
      <button
        type="button"
        onClick={() => toast.error('오류가 발생했습니다.')}
        className="rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-body transition-colors hover:text-ink"
      >
        에러 toast
      </button>
    </div>
  );
}
