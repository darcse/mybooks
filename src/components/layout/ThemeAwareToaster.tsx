'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { resolveEffectiveTheme } from '@/lib/theme';

export function ThemeAwareToaster() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const update = () => setTheme(resolveEffectiveTheme());
    update();
    window.addEventListener('theme-mode-change', update);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);
    return () => {
      window.removeEventListener('theme-mode-change', update);
      media.removeEventListener('change', update);
    };
  }, []);

  return <Toaster position="top-center" theme={theme} closeButton />;
}
