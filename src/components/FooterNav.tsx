'use client';

import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/routing';

export function FooterNav() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isFavorites = pathname === '/favorites';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg px-4 pb-6 pt-3"
      aria-label="Main navigation"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isHome ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isHome ? "'FILL' 1" : undefined }}>
            home
          </span>
          <span className="text-[10px] font-bold">{t('home')}</span>
        </Link>
        <Link
          href="/favorites"
          className={`flex flex-col items-center gap-1 py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isFavorites ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: isFavorites ? "'FILL' 1" : undefined }}>favorite</span>
          <span className="text-[10px] font-bold">{t('favorites')}</span>
        </Link>
      </div>
    </nav>
  );
}
