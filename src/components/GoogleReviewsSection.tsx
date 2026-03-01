'use client';

import { useTranslations } from 'next-intl';
import type { GoogleReviewsResult } from '@/lib/google-reviews';

type Props = {
  data: GoogleReviewsResult | null;
  locale: string;
};

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f-${i}`} className="text-amber-500 text-lg leading-none" aria-hidden>★</span>
      ))}
      {half ? <span className="text-amber-500 text-lg leading-none" aria-hidden>★</span> : null}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e-${i}`} className="text-slate-300 dark:text-slate-600 text-lg leading-none" aria-hidden>★</span>
      ))}
    </span>
  );
}

export function GoogleReviewsSection({ data, locale }: Props) {
  const t = useTranslations('experience');

  if (!data) {
    return (
      <section className="px-4 mt-8" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {t('reviews')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {locale === 'it' ? 'Recensioni (in arrivo)' : 'Reviews (coming soon)'}
        </p>
      </section>
    );
  }

  const { rating, user_ratings_total, reviews, google_maps_url } = data;
  const hasSummary = rating != null && rating > 0 && user_ratings_total != null && user_ratings_total > 0;
  const hasReviews = reviews.length > 0;

  return (
    <section className="px-4 mt-8" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {t('reviews')}
      </h2>

      {hasSummary && (
        <div className="flex items-center gap-2 mb-3">
          <Stars rating={rating!} />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {t('ratingCount', { rating: rating!.toFixed(1), count: user_ratings_total! })}
          </span>
        </div>
      )}

      {hasReviews && (
        <ul className="space-y-3 mb-3">
          {reviews.map((r, i) => (
            <li
              key={i}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-slate-900 dark:text-white text-sm">{r.author_name}</span>
                <Stars rating={r.rating} />
              </div>
              {r.relative_time_description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{r.relative_time_description}</p>
              )}
              {r.text && (
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{r.text}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
        <span>{t('reviewsFromGoogle')}</span>
        {google_maps_url && (
          <a
            href={google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            {t('seeReviewsOnGoogle')}
            <span className="material-symbols-outlined text-base">open_in_new</span>
          </a>
        )}
      </p>

      {!hasReviews && !hasSummary && google_maps_url && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          <a
            href={google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            {t('seeReviewsOnGoogle')}
          </a>
        </p>
      )}
    </section>
  );
}
