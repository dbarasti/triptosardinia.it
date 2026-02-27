'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';

type Filter = 'all' | 'active' | 'drafts';

export function AdminExperienceSearch({
  initialQuery,
  initialFilter,
}: {
  initialQuery: string;
  initialFilter: Filter;
}) {
  const t = useTranslations('admin');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const setFilter = (filter: Filter) => {
    const params = new URLSearchParams();
    if (initialQuery) params.set('q', initialQuery);
    if (filter !== 'all') params.set('status', filter);
    startTransition(() => {
      router.replace((pathname + (params.toString() ? `?${params.toString()}` : '')) as '/admin/experiences');
    });
  };

  const setQuery = (q: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (initialFilter !== 'all') params.set('status', initialFilter);
    startTransition(() => {
      router.replace((pathname + (params.toString() ? `?${params.toString()}` : '')) as '/admin/experiences');
    });
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">{t('searchExperiences')}</span>
        <div className="flex w-full items-center rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden h-11">
          <span className="text-slate-500 dark:text-slate-400 flex items-center justify-center pl-4">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            type="search"
            defaultValue={initialQuery}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') setQuery('');
              else setTimeout(() => setQuery(v), 300);
            }}
            onKeyDown={(e) => e.key === 'Enter' && setQuery((e.target as HTMLInputElement).value)}
            placeholder={t('searchExperiences')}
            className="flex flex-1 min-w-0 border-none bg-transparent focus:ring-0 h-full placeholder:text-slate-500 dark:placeholder:text-slate-400 px-3 text-sm font-medium text-slate-900 dark:text-white"
          />
        </div>
      </label>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors ${
            initialFilter === 'all'
              ? 'bg-primary text-white'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {t('all')}
        </button>
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors ${
            initialFilter === 'active'
              ? 'bg-primary text-white'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {t('active')}
        </button>
        <button
          type="button"
          onClick={() => setFilter('drafts')}
          className={`flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors ${
            initialFilter === 'drafts'
              ? 'bg-primary text-white'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          {t('drafts')}
        </button>
      </div>
      {isPending && (
        <div className="text-slate-500 dark:text-slate-400 text-xs" aria-live="polite">
          Updating…
        </div>
      )}
    </div>
  );
}
