'use client';

import { Plus, X } from 'lucide-react';

type RegisterPanelToggleProps = {
  open: boolean;
  onToggle: () => void;
  openLabel: string;
  closeLabel?: string;
};

export function RegisterPanelToggle({
  open,
  onToggle,
  openLabel,
  closeLabel = '등록 닫기',
}: RegisterPanelToggleProps) {
  const label = open ? closeLabel : openLabel;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-elevated text-body hover:text-ink"
      aria-label={label}
      title={label}
      aria-expanded={open}
    >
      {open ? <X className="size-4" strokeWidth={1.8} /> : <Plus className="size-4" strokeWidth={1.8} />}
    </button>
  );
}
