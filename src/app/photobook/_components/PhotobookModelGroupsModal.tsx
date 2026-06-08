'use client';

import { useEffect } from 'react';
import { User } from 'lucide-react';
import type { PhotobookModelGroup } from '../types';

interface PhotobookModelGroupsModalProps {
  groups: PhotobookModelGroup[];
  onClose: () => void;
  onSelectModel: (modelName: string) => void;
}

export function PhotobookModelGroupsModal({
  groups,
  onClose,
  onSelectModel,
}: PhotobookModelGroupsModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-sm border border-hairline bg-surface p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-4 text-2xl font-medium text-mute hover:text-ink"
        >
          &times;
        </button>
        <h2 className="mb-6 pr-8 text-xl font-medium text-ink">
          모델 ({groups.length}명)
        </h2>
        {groups.length === 0 ? (
          <p className="py-12 text-center text-body">등록된 모델이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {groups.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => onSelectModel(group.modelName)}
                className="group text-left"
              >
                <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-sm border border-hairline bg-surface-elevated transition-transform duration-300 group-hover:scale-[1.02]">
                  {group.coverImageUrl ? (
                    <img
                      src={group.coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-card">
                      <User className="size-10 text-mute/40" strokeWidth={1.5} aria-hidden />
                    </div>
                  )}
                </div>
                <p className="truncate text-sm font-medium text-ink">{group.modelName}</p>
                <p className="text-xs text-mute">{group.count}권</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
