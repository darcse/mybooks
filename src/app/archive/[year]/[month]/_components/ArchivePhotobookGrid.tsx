'use client';

import { formatAuthorName } from '@/lib/format';
import styles from './ArchivePhotobookGrid.module.css';

const overlayDefault =
  'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)';
const overlayHover =
  'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)';

export type ArchivePhotobookItem = {
  id: number;
  title: string;
  author: string | null;
  created_at: string;
  cover_image_url: string | null;
  category: string | null;
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

type Props = {
  items: ArchivePhotobookItem[];
  onSelect: (id: number) => void;
};

export function ArchivePhotobookGrid({ items, onSelect }: Props) {
  return (
    <div className={styles.grid}>
      {items.map((pb) => (
        <div
          key={pb.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(pb.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(pb.id);
            }
          }}
          className={styles.item}
        >
          <div className={styles.coverWrap}>
            {pb.cover_image_url ? (
              <img src={pb.cover_image_url} alt="표지" className={styles.cover} />
            ) : (
              <div className={styles.coverFallback}>No Image</div>
            )}
          </div>
          <div
            className={`${styles.overlay} ${styles.overlayDefault}`}
            style={{ background: overlayDefault }}
          />
          <div
            className={`${styles.overlay} ${styles.overlayHover}`}
            style={{ background: overlayHover }}
          />
          <div className={styles.meta}>
            {pb.category ? <span className={styles.badge}>{pb.category}</span> : null}
            <h3 className={styles.title}>{stripHtml(pb.title)}</h3>
            <p className={styles.author}>{pb.author ? formatAuthorName(pb.author) : '—'}</p>
            <p className={styles.date}>
              등록 {new Date(pb.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
