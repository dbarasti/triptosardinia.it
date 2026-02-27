import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { ExperienceDetailClient } from '@/components/ExperienceDetailClient';
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
  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      url: `${baseUrl}${path}`,
      images: exp.image_urls[0] ? [{ url: exp.image_urls[0], width: 800, height: 600 }] : undefined,
      locale: locale === 'it' ? 'it_IT' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: path,
      languages: { en: `/en/experiences/${slug}`, it: `/it/experiences/${slug}` },
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

  const hasProviderContact =
    !!exp.provider_booking_url || !!exp.provider_email || !!exp.provider_phone;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description,
    image: exp.image_urls,
    ...(exp.provider_booking_url && { url: exp.provider_booking_url }),
  };

  return (
    <div className="max-w-2xl mx-auto pb-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Carousel */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 py-4 no-scrollbar">
        {exp.image_urls.map((url, i) => (
          <div key={i} className="flex-none w-[85%] snap-center">
            <Image
              src={url}
              alt=""
              width={600}
              height={450}
              className="w-full aspect-[4/3] object-cover rounded-xl shadow-sm"
              sizes="85vw"
              priority={i === 0}
              loading={i === 0 ? undefined : 'lazy'}
            />
          </div>
        ))}
      </div>

      <div className="px-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">{description}</p>
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
                ? `${Math.floor(exp.duration_minutes / 60)}h`
                : `${exp.duration_minutes}m`}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary mb-2">groups</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('groupSize')}</span>
            <span className="text-sm font-bold">{t('upTo', { max: exp.group_size_max })}</span>
          </div>
          {exp.difficulty && (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-primary mb-2">trending_up</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('difficulty')}</span>
              <span className="text-sm font-bold capitalize">{exp.difficulty}</span>
            </div>
          )}
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
      <section className="px-4 mt-8" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {t('reviews')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {locale === 'it' ? 'Recensioni (in arrivo)' : 'Reviews (coming soon)'}
        </p>
      </section>

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
