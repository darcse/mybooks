/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { Infinity, User } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import { formatAuthorName } from '@/lib/format';
import type { Photobook } from '@/app/photobook/types';
import styles from './DashboardTimelessSection.module.css';

export function DashboardTimelessSection() {
  const [loadingTimeless, setLoadingTimeless] = useState(true);
  const isAuthenticated = useAuthState();
  const [timelessPhotobooks, setTimelessPhotobooks] = useState<Photobook[]>([]);

  useEffect(() => {
    if (isAuthenticated === null) return;

    if (!isAuthenticated) {
      setTimelessPhotobooks([]);
      setLoadingTimeless(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingTimeless(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('photobook')
        .select('id,title,author,category,status,rank,cover_image_url,publish_date,created_at,is_adult')
        .order('created_at', { ascending: false })
        .limit(30);
      if (cancelled) return;
      const timelessList = (data ?? []) as Photobook[];
      if (timelessList.length > 0) {
        const shuffled = [...timelessList].sort(() => Math.random() - 0.5);
        setTimelessPhotobooks(shuffled.slice(0, 4));
      } else {
        setTimelessPhotobooks([]);
      }
      setLoadingTimeless(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (isAuthenticated !== true || (!loadingTimeless && timelessPhotobooks.length === 0)) {
    return null;
  }

  const overlayDefault =
    'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)';
  const overlayHover =
    'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)';

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-hairline pb-2">
        <h2 className="flex items-center gap-2 text-xl font-medium text-ink">
          <Infinity className="size-5 shrink-0 text-mute" strokeWidth={1.5} /> Timeless
        </h2>
        <Link href="/photobook" className="text-sm text-[var(--accent-blue)] transition-opacity hover:opacity-80">
          더보기 &rarr;
        </Link>
      </div>
      {loadingTimeless ? (
        <div className={styles.grid}>
          <div className={styles.skeleton} aria-hidden />
          <div className={styles.skeleton} aria-hidden />
          <div className={styles.skeleton} aria-hidden />
          <div className={styles.skeleton} aria-hidden />
        </div>
      ) : (
        <div className={styles.grid}>
          {timelessPhotobooks.map((book) => {
            const rank = typeof book.rank === 'number' ? book.rank : 0;
            return (
              <Link key={book.id} href={`/photobook?view=${book.id}`} className={styles.item}>
                <div className={styles.coverWrap}>
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt="표지" className={styles.cover} />
                  ) : (
                    <div className={styles.coverFallback}>
                      <User className="size-12 text-white/30" strokeWidth={1.5} aria-hidden />
                    </div>
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
                {rank > 0 && (
                  <div className={styles.rank}>★ {rank}</div>
                )}
                <div className={styles.meta}>
                  <div className={styles.badgeRow}>
                    {book.category ? <span className={styles.badge}>{book.category}</span> : null}
                    {book.status ? <span className={styles.badge}>{book.status}</span> : null}
                  </div>
                  <h3 className={styles.title} dangerouslySetInnerHTML={{ __html: book.title }} />
                  <p className={styles.author}>{formatAuthorName(book.author)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
