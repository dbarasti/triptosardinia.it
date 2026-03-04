'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname, Link } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import Image from 'next/image';

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
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
          <Image
            src="/logo-triptosardinia.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-contain flex-shrink-0"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Trip to Sardinia</span>
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
