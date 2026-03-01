import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { getReviewsSummaryForExperiences } from '@/lib/google-reviews';
import { FavoritesListClient } from '@/components/FavoritesListClient';

type Props = { params: Promise<{ locale: string }> };

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const experiences = await db.getExperiences();
  const ratings = await getReviewsSummaryForExperiences(experiences.map((e) => e.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        {locale === 'it' ? 'Salvati' : 'Saved'}
      </h1>
      <FavoritesListClient experiences={experiences} locale={locale as 'en' | 'it'} ratings={ratings} />
    </div>
  );
}
