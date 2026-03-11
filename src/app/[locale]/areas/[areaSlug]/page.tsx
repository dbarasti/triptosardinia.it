import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getReviewsSummaryForExperiences } from '@/lib/google-reviews';
import { ExperienceCards } from '@/components/ExperienceCards';

type Props = { params: Promise<{ locale: string; areaSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, areaSlug } = await params;
  const area = await db.getAreaBySlug(areaSlug);
  if (!area) return {};
  const name = locale === 'it' ? area.name_it : area.name_en;
  const areaDescription = locale === 'it' ? area.description_it : area.description_en;
  const title = locale === 'it'
    ? `Esperienze a ${name} — Trip to Sardinia`
    : `Experiences in ${name} — Trip to Sardinia`;
  const description = areaDescription
    ? areaDescription.slice(0, 160)
    : locale === 'it'
      ? `Esplora le migliori attività outdoor e avventure a ${name}, sulla costa nord della Sardegna.`
      : `Explore the best outdoor activities and adventures in ${name}, on the northern coast of Sardinia.`;
  const path = `/${locale}/areas/${areaSlug}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${path}`,
      locale: locale === 'it' ? 'it_IT' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: path,
      languages: {
        en: `/en/areas/${areaSlug}`,
        it: `/it/areas/${areaSlug}`,
      },
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function AreaPage({ params }: Props) {
  const { locale, areaSlug } = await params;
  setRequestLocale(locale);
  const area = await db.getAreaBySlug(areaSlug);
  if (!area) notFound();
  const experiences = await db.getExperiences({ areaSlug });
  const ratings = await getReviewsSummaryForExperiences(experiences.map((e) => e.id));

  const name = locale === 'it' ? area.name_it : area.name_en;
  const description = locale === 'it' ? area.description_it : area.description_en;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{name}</h1>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">{description}</p>
      )}
      {experiences.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">
          {locale === 'it' ? 'Nessuna esperienza in questa area.' : 'No experiences in this area.'}
        </p>
      ) : (
        <ExperienceCards experiences={experiences} locale={locale as 'en' | 'it'} ratings={ratings} />
      )}
    </div>
  );
}
