'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useState } from 'react';

const SEARCH_PARAM = 'q';

export function HomeSearch({ initialQuery = '' }: { initialQuery?: string }) {
  const t = useTranslations('common');
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  const goSearch = () => {
    router.push({
      pathname: '/experiences',
      query: q.trim() ? { q: q.trim() } : undefined,
    });
  };

  return (
    <div className="flex w-full items-center rounded-xl bg-white p-2 shadow-xl dark:bg-slate-800">
      <div className="flex flex-1 items-center gap-3 px-3">
        <span className="text-primary" aria-hidden>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          type="search"
          className="w-full border-none bg-transparent p-0 text-sm font-medium focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400"
          placeholder={t('searchPlaceholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && goSearch()}
          aria-label={t('search')}
        />
      </div>
      <button
        type="button"
        onClick={goSearch}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {t('search')}
      </button>
    </div>
  );
}
