'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { InlineSpinner } from '@/components/AsyncMutationUi';

type InlineDeleteConfirmProps = {
  message: string;
  onConfirm: () => void | Promise<void>;
  isBusy?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
  variant?: 'icon' | 'footer';
};

export function InlineDeleteConfirm({
  message,
  onConfirm,
  isBusy = false,
  disabled = false,
  ariaLabel = '삭제',
  title = '삭제',
  variant = 'icon',
}: InlineDeleteConfirmProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div
        className={
          variant === 'footer'
            ? 'flex min-w-0 flex-[1] flex-col justify-center gap-1.5 rounded-full border border-hairline bg-surface-elevated px-3 py-2'
            : 'flex max-w-[min(100%,20rem)] flex-wrap items-center gap-2'
        }
      >
        <p className="whitespace-pre-line text-xs text-mute">{message}</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              void onConfirm();
            }}
            disabled={isBusy || disabled}
            className="rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-body hover:text-ink disabled:opacity-60"
            aria-busy={isBusy}
          >
            {isBusy ? <InlineSpinner /> : '삭제'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isBusy}
            className="rounded-md border border-hairline px-3 py-1.5 text-xs font-medium text-body hover:text-ink disabled:opacity-60"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <button
        type="button"
        className="flex flex-[1] items-center justify-center rounded-full border border-hairline bg-surface-elevated text-body hover:text-ink disabled:opacity-60"
        onClick={() => setConfirming(true)}
        disabled={disabled || isBusy}
        aria-label={ariaLabel}
        title={title}
        aria-busy={isBusy}
      >
        {isBusy ? <InlineSpinner /> : <Trash2 className="size-4" strokeWidth={1.8} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={disabled || isBusy}
      className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink disabled:opacity-60"
      aria-label={ariaLabel}
      title={title}
      aria-busy={isBusy}
    >
      {isBusy ? <InlineSpinner /> : <Trash2 className="size-4" strokeWidth={1.8} />}
    </button>
  );
}
