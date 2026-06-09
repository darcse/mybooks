'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Headphones, Home, LogIn, Menu, Monitor, Moon, PenLine, Sun, TrendingUp, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getStoredThemeMode,
  nextThemeMode,
  persistThemeMode,
  type ThemeMode,
} from '@/lib/theme';
import { useAuthState } from '@/hooks/useAuthState';

const navItems = [
  { name: 'Books', path: '/books' },
  { name: 'Comics', path: '/comics' },
  { name: 'Photobook', path: '/photobook' },
  { name: 'Archive', path: '/archive' },
];

const externalAppLinks = [
  { label: 'SSH Love 홈', href: 'https://sshlove.com', Icon: Home },
  { label: 'Audio', href: 'https://audio.sshlove.com', Icon: Headphones },
  { label: 'SSH Write', href: 'https://sshwrite.com', Icon: PenLine },
  { label: 'My Stock', href: 'https://mystock-mu.vercel.app/stocks', Icon: TrendingUp },
] as const;

const externalLinkButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-body transition-colors hover:bg-surface-elevated hover:text-ink';

function navLinkClass(active: boolean, variant: 'desktop' | 'mobile') {
  const base =
    variant === 'desktop'
      ? 'nav-menu-link rounded-sm px-3 py-1.5 text-sm font-medium'
      : 'nav-menu-link rounded-sm px-3 py-3 text-[15px] font-medium';
  return active ? `${base} nav-menu-link-selected` : base;
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');

  useEffect(() => {
    const initial = getStoredThemeMode();
    setThemeMode(initial);
    persistThemeMode(initial);
  }, []);

  const handleThemeToggle = useCallback(() => {
    const next = nextThemeMode(themeMode);
    setThemeMode(next);
    persistThemeMode(next);
  }, [themeMode]);

  const themeToggle = (
    <button
      type="button"
      onClick={handleThemeToggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-body transition-colors hover:bg-surface-elevated hover:text-ink"
      aria-label={
        themeMode === 'light'
          ? '라이트 모드 (클릭 시 다크 모드)'
          : themeMode === 'dark'
            ? '다크 모드 (클릭 시 자동 모드)'
            : '자동 모드 (클릭 시 라이트 모드)'
      }
      title={
        themeMode === 'light' ? '라이트' : themeMode === 'dark' ? '다크' : '자동'
      }
    >
      {themeMode === 'light' ? (
        <Sun size={16} strokeWidth={2} />
      ) : themeMode === 'dark' ? (
        <Moon size={16} strokeWidth={2} />
      ) : (
        <Monitor size={16} strokeWidth={2} />
      )}
    </button>
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  }, [router]);

  const authAction = isAuthenticated !== null && (
    isAuthenticated ? (
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm font-medium text-body transition-colors hover:text-ink"
      >
        로그아웃
      </button>
    ) : (
      <Link
        href="/login"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-body transition-colors hover:bg-surface-elevated hover:text-ink"
        aria-label="로그인"
        title="로그인"
      >
        <LogIn size={18} strokeWidth={2} />
      </Link>
    )
  );

  const isActive = (path: string) =>
    pathname === path || (path !== '/' && pathname?.startsWith(path));

  const externalAppLinkIcons = (
    <div className="flex items-center gap-1">
      {externalAppLinks.map(({ label, href, Icon }) => (
        <a
          key={href}
          href={href}
          target="_self"
          rel="noopener noreferrer"
          className={externalLinkButtonClass}
          aria-label={label}
          title={label}
        >
          <Icon size={16} strokeWidth={2} />
        </a>
      ))}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-hairline bg-canvas">
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link
            href="/"
            className="shrink-0 text-xl font-medium tracking-tight text-ink transition-opacity hover:opacity-80"
          >
            mybooks
          </Link>

          <div className="ml-10 hidden min-w-0 flex-1 items-center justify-between lg:flex">
            <div className="flex flex-wrap items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`whitespace-nowrap ${navLinkClass(isActive(item.path), 'desktop')}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {externalAppLinkIcons}
              {themeToggle}
              {authAction}
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-hairline text-body transition-colors hover:bg-surface-elevated hover:text-ink lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {mobileMenuOpen ? (
              <X className="size-5" strokeWidth={2} />
            ) : (
              <Menu className="size-5" strokeWidth={2} />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-x-0 bottom-0 top-14 z-[45] bg-black/40 lg:hidden"
              aria-label="메뉴 닫기"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              id="mobile-nav-menu"
              className="absolute left-0 right-0 top-full z-[55] max-h-[min(70vh,calc(100dvh-3.5rem))] overflow-y-auto border-b border-hairline bg-canvas lg:hidden"
            >
              <div className="flex flex-col gap-0.5 px-4 py-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={navLinkClass(isActive(item.path), 'mobile')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="mt-2 border-t border-hairline pt-3">
                  <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-mute">
                    테마
                  </p>
                  <div className="flex items-center gap-3 px-3">
                    {themeToggle}
                    <span className="text-[15px] font-medium text-body">
                      {themeMode === 'light' ? '라이트' : themeMode === 'dark' ? '다크' : '자동'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 border-t border-hairline pt-3">
                  <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-mute">
                    계정
                  </p>
                  <div className="px-3">
                    {isAuthenticated !== null &&
                      (isAuthenticated ? (
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full rounded-sm px-3 py-3 text-left text-[15px] font-medium text-body transition-colors hover:bg-surface-elevated hover:text-ink"
                        >
                          로그아웃
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          className="flex items-center gap-3 rounded-sm px-3 py-3 text-[15px] font-medium text-body transition-colors hover:bg-surface-elevated hover:text-ink"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline">
                            <LogIn size={18} strokeWidth={2} />
                          </span>
                          로그인
                        </Link>
                      ))}
                  </div>
                </div>
                <div className="mt-2 border-t border-hairline pb-1 pt-3">
                  <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-mute">
                    외부 앱
                  </p>
                  <div className="flex flex-wrap items-center gap-2 px-3">
                    {externalAppLinks.map(({ label, href, Icon }) => (
                      <a
                        key={href}
                        href={href}
                        target="_self"
                        rel="noopener noreferrer"
                        className={externalLinkButtonClass}
                        aria-label={label}
                        title={label}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon size={16} strokeWidth={2} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
