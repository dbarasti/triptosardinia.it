'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Experience, Locale } from '@/lib/types';
import { ExperienceCards } from './ExperienceCards';

type Props = {
  experiences: Experience[];
  locale: Locale;
  ratings?: Record<string, { rating: number; user_ratings_total: number }>;
};

export function CategoryExperienceFilter({ experiences, locale, ratings }: Props) {
  const t = useTranslations('common');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return experiences;
    return experiences.filter((exp) => {
      const title = locale === 'it' ? exp.title_it : exp.title_en;
      const description = locale === 'it' ? exp.description_it : exp.description_en;
      const location = locale === 'it' ? exp.location_name_it : exp.location_name_en;
      return (
        title.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        (location ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, experiences, locale]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 px-4 py-2.5 shadow-sm border border-slate-200 dark:border-slate-700">
        <span aria-hidden>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('search')}
          className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none border-none focus:ring-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400 text-sm py-4">
          {locale === 'it' ? 'Nessun risultato trovato.' : 'No results found.'}
        </p>
      ) : (
        <ExperienceCards experiences={filtered} locale={locale} ratings={ratings} layout="grid" />
      )}
    </div>
  );
}
