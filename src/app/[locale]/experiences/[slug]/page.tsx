import { notFound } from 'next/navigation';
import { getImageUrl } from '@/lib/image-utils';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { getReviewsForExperience } from '@/lib/google-reviews';
import { ExperienceDetailCarousel } from '@/components/ExperienceDetailCarousel';
import { ExperienceDetailClient } from '@/components/ExperienceDetailClient';
import { GoogleReviewsSection } from '@/components/GoogleReviewsSection';
import type { Locale } from '@/lib/types';
import type { Metadata } from 'next';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const exp = await db.getExperienceBySlug(slug);
  if (!exp) return {};
  const title = locale === 'it' ? exp.title_it : exp.title_en;
  const description = locale === 'it' ? exp.description_it : exp.description_en;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const path = `/${locale}/experiences/${slug}`;
  const ogImageUrl = exp.image_urls[0] ? `${baseUrl}${getImageUrl(exp.image_urls[0])}` : undefined;
  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      url: `${baseUrl}${path}`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 800, height: 600 }] : undefined,
      locale: locale === 'it' ? 'it_IT' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: path,
      languages: { en: `/en/experiences/${slug}`, it: `/it/experiences/${slug}` },
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.slice(0, 160),
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const exp = await db.getExperienceBySlug(slug);
  if (!exp) notFound();

  await db.recordView(exp.id);
  const t = await getTranslations('experience');
  const title = locale === 'it' ? exp.title_it : exp.title_en;
  const description = locale === 'it' ? exp.description_it : exp.description_en;
  const locationName = locale === 'it' ? exp.location_name_it : exp.location_name_en;

  const reviewsData = await getReviewsForExperience(exp.id, locale);

  const hasProviderContact =
    !!exp.provider_booking_url || !!exp.provider_email || !!exp.provider_phone;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description,
    image: exp.image_urls.map((url) => (url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${getImageUrl(url)}`)),
    ...(exp.provider_booking_url && { url: exp.provider_booking_url }),
  };

  return (
    <div className="max-w-2xl mx-auto pb-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Carousel (images and videos; videos autoplay when in view) */}
      <ExperienceDetailCarousel imageUrls={exp.image_urls} experienceName={title} />

      <div className="px-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
        {exp.difficulty && (
          <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {t('difficulty')}: {exp.difficulty === 'easy' ? t('difficultyEasy') : exp.difficulty === 'medium' ? t('difficultyMedium') : exp.difficulty === 'hard' ? t('difficultyHard') : exp.difficulty}
          </span>
        )}
        <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm whitespace-pre-line">{description}</p>
      </div>

      {/* Key features */}
      <section className="px-4 mt-8" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {t('keyFeatures')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary mb-2">schedule</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('duration')}</span>
            <span className="text-sm font-bold">
              {exp.duration_minutes >= 60
                ? exp.duration_minutes % 60 > 0
                  ? `${Math.floor(exp.duration_minutes / 60)}h ${exp.duration_minutes % 60}m`
                  : `${Math.floor(exp.duration_minutes / 60)}h`
                : `${exp.duration_minutes}m`}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary mb-2">groups</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('groupSize')}</span>
            <span className="text-sm font-bold">{t('upTo', { max: exp.group_size_max })}</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary mb-2">euro</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('basePrice')}</span>
            <span className="text-sm font-bold">
              {exp.price_cents != null
                ? exp.price_cents % 100 === 0
                  ? `€${exp.price_cents / 100}`
                  : `€${(exp.price_cents / 100).toFixed(2)}`
                : '—'}
            </span>
          </div>
        </div>
      </section>

      {/* Location */}
      {locationName && (
        <section className="px-4 mt-8" aria-labelledby="location-heading">
          <h2 id="location-heading" className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {t('location')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">{locationName}</p>
        </section>
      )}

      {/* Reviews placeholder */}
      <GoogleReviewsSection data={reviewsData} locale={locale} />

      {/* CTA: Interest form or contact coming soon */}
      <ExperienceDetailClient
        experienceId={exp.id}
        experienceSlug={exp.slug}
        hasProviderContact={hasProviderContact}
        providerBookingUrl={exp.provider_booking_url ?? undefined}
        providerEmail={exp.provider_email ?? undefined}
        providerPhone={exp.provider_phone ?? undefined}
        locale={locale as Locale}
      />
    </div>
  );
}
