import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { getReviewsSummaryForExperiences } from '@/lib/google-reviews';
import { CategoryExperienceFilter } from '@/components/CategoryExperienceFilter';

type Props = { params: Promise<{ locale: string; categorySlug: string }> };

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
