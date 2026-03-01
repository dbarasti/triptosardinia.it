'use client';

import { useFavorites } from '@/lib/favorites';
import { ExperienceCards } from '@/components/ExperienceCards';
import type { Experience } from '@/lib/types';
import type { Locale } from '@/lib/types';

export function FavoritesListClient({
  experiences,
  locale,
  ratings,
}: {
  experiences: Experience[];
  locale: Locale;
  ratings?: Record<string, { rating: number; user_ratings_total: number }>;
}) {
  const { ids } = useFavorites();
  const filtered = experiences.filter((e) => ids.has(e.id));

  if (filtered.length === 0) {
    return (
      <p className="text-slate-600 dark:text-slate-400 text-sm">
        {locale === 'it'
          ? 'Nessuna esperienza salvata. Salva le esperienze dalla home o dalla pagina Esperienze.'
          : 'No saved experiences. Save experiences from the home or Experiences page.'}
      </p>
    );
  }

  return <ExperienceCards experiences={filtered} locale={locale} ratings={ratings} />;
}
