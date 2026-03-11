import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getReviewsSummaryForExperiences } from '@/lib/google-reviews';
import { CategoryExperienceFilter } from '@/components/CategoryExperienceFilter';

type Props = { params: Promise<{ locale: string; categorySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, categorySlug } = await params;
  const category = await db.getCategoryBySlug(categorySlug);
  if (!category) return {};
  const name = locale === 'it' ? category.name_it : category.name_en;
  const title = locale === 'it'
    ? `${name} in Sardegna — Esperienze outdoor`
    : `${name} in Sardinia — Outdoor experiences`;
  const description = locale === 'it'
    ? `Scopri le migliori esperienze di ${name.toLowerCase()} sulla costa nord della Sardegna. Prenota la tua avventura.`
    : `Discover the best ${name.toLowerCase()} experiences on the northern coast of Sardinia. Find and book your adventure.`;
  const path = `/${locale}/categories/${categorySlug}`;
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
        en: `/en/categories/${categorySlug}`,
        it: `/it/categories/${categorySlug}`,
      },
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, categorySlug } = await params;
  setRequestLocale(locale);
  const category = await db.getCategoryBySlug(categorySlug);
  if (!category) notFound();
  const experiences = await db.getExperiences({ categorySlug });
  const ratings = await getReviewsSummaryForExperiences(experiences.map((e) => e.id));

  const name = locale === 'it' ? category.name_it : category.name_en;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{name}</h1>
      {experiences.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">
          {locale === 'it' ? 'Nessuna esperienza in questa categoria.' : 'No experiences in this category.'}
        </p>
      ) : (
        <CategoryExperienceFilter experiences={experiences} locale={locale as 'en' | 'it'} ratings={ratings} />
      )}
    </div>
  );
}
