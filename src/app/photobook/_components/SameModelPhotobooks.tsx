'use client';

import Link from 'next/link';
import { Camera } from 'lucide-react';
import type { SameModelPhotobookItem } from '../types';

interface SameModelPhotobooksProps {
  modelName: string;
  items: SameModelPhotobookItem[];
  open: boolean;
  onToggle: () => void;
}

export function SameModelPhotobooks({ modelName, items, open, onToggle }: SameModelPhotobooksProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-2 text-left text-sm font-medium text-body hover:text-ink"
      >
        <span className="flex items-center gap-2">
          <Camera className="size-4 shrink-0 text-mute" strokeWidth={1.5} />
          {modelName}의 다른 사진집
        </span>
        <span className="text-mute">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="pt-2 pb-2">
          {items.length === 0 ? (
            <p className="py-2 text-sm text-mute">같은 모델의 다른 사진집이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {items.map((b) => (
                <Link
                  key={b.id}
                  href={`/photobook?view=${b.id}`}
                  className="flex min-w-0 items-center gap-2 rounded-sm border border-hairline bg-surface-elevated p-2 hover:bg-surface-card"
                >
                  {b.cover_image_url ? (
                    <img
                      src={b.cover_image_url}
                      alt=""
                      className="h-20 w-14 shrink-0 rounded-sm border border-hairline object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-sm border border-hairline bg-surface-card text-[10px] text-mute">
                      No cover
                    </div>
                  )}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p
                      className="truncate text-sm font-medium text-ink"
                      title={b.title}
                      dangerouslySetInnerHTML={{ __html: b.title || '-' }}
                    />
                    <p className="truncate text-xs text-mute" title={b.author || ''}>
                      {b.author || '-'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
