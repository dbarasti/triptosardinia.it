'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname, Link } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

export function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();
  const isEn = locale === 'en';

  // For dynamic routes, next-intl needs pathname + params. usePathname() returns the template (e.g. /experiences/[slug]).
  const href = useMemo(() => {
    if (!pathname || typeof pathname !== 'string') return (pathname || '/') as '/';
    if (!pathname.includes('[')) return pathname as '/';
    const { locale: _locale, ...routeParams } = params || {};
    return { pathname, params: routeParams } as { pathname: '/'; params?: Record<string, string> };
  }, [pathname, params]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CoastExperience</span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Language selection">
          <button
            type="button"
            onClick={() => router.replace(href, { locale: 'en' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isEn ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            aria-pressed={isEn}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => router.replace(href, { locale: 'it' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!isEn ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            aria-pressed={!isEn}
          >
            IT
          </button>
        </nav>
      </div>
    </header>
  );
}
