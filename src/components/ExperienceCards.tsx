'use client';

import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { Experience } from '@/lib/types';
import type { Locale } from '@/lib/types';
import { useFavorites } from '@/lib/favorites';
import { getImageUrl } from '@/lib/image-utils';

function formatPrice(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  const euros = cents / 100;
  return euros % 1 === 0 ? `€${euros}` : `€${euros.toFixed(2)}`;
}

function formatDuration(minutes: number, locale: string): string {
  if (minutes >= 24 * 60) return `${Math.round(minutes / (24 * 60))} days`;
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

export function ExperienceCards({
  experiences,
  locale,
  ratings,
  layout = 'scroll',
}: {
  experiences: Experience[];
  locale: Locale;
  ratings?: Record<string, { rating: number; user_ratings_total: number }>;
  layout?: 'scroll' | 'grid';
}) {
  const { isFavorite, toggle } = useFavorites();
  const t = useTranslations('experience');

  const containerClass =
    layout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
      : 'flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory px-4 -mx-4';

  const articleClass =
    layout === 'grid'
      ? 'overflow-hidden rounded-xl bg-white shadow-md dark:bg-slate-800 flex flex-col'
      : 'flex-none w-[72vw] max-w-[280px] snap-start overflow-hidden rounded-xl bg-white shadow-md dark:bg-slate-800 flex flex-col';

  return (
    <div className={containerClass}>
      {experiences.map((exp) => {
        const title = locale === 'it' ? exp.title_it : exp.title_en;
        const location = locale === 'it' ? exp.location_name_it : exp.location_name_en;
        const fav = isFavorite(exp.id);
        return (
          <article
            key={exp.id}
            className={articleClass}
          >
            <div className="relative h-44 w-full flex-shrink-0">
              <Link href={{ pathname: '/experiences/[slug]', params: { slug: exp.slug } }} className="block h-full w-full">
                <Image
                  src={getImageUrl(exp.image_urls[0]) || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'}
                  alt=""
                  width={280}
                  height={176}
                  className="object-cover w-full h-full"
                  sizes="280px"
                />
              </Link>
              <button
                type="button"
                onClick={() => toggle(exp.id)}
                className="absolute top-3 right-3 z-10 rounded-full bg-white/80 p-1.5 backdrop-blur-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer hover:bg-white/90"
                aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <span
                  className={`material-symbols-outlined text-lg transition-colors duration-200 ${fav ? 'fill-1 text-red-500' : ''}`}
                  style={fav ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">star</span>
                <span>
                  {ratings?.[exp.id] && ratings[exp.id].rating > 0
                    ? t('ratingShort', {
                        rating: ratings[exp.id].rating.toFixed(1),
                        count: ratings[exp.id].user_ratings_total,
                      })
                    : '—'}
                </span>
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                <Link href={{ pathname: '/experiences/[slug]', params: { slug: exp.slug } }} className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                  {title}
                </Link>
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {location || 'Northern Sardinia'} • {formatDuration(exp.duration_minutes, locale)}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Link
                  href={{ pathname: '/experiences/[slug]', params: { slug: exp.slug } }}
                  className="inline-flex items-center gap-1 text-primary font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  {t('view')}
                  <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                </Link>
                {formatPrice(exp.price_cents) && (
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatPrice(exp.price_cents)}
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
