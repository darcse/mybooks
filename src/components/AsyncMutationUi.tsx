'use client';

export function InlineSpinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? ''}`}
      aria-hidden
    />
  );
}

export function SavingLabel({ text = '저장 중...' }: { text?: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <InlineSpinner />
      {text}
    </span>
  );
}

export function DeletingLabel({ text = '삭제 중...' }: { text?: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <InlineSpinner />
      {text}
    </span>
  );
}
