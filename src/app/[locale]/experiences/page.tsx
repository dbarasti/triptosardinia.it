import { db } from '@/lib/db';
import { setRequestLocale } from 'next-intl/server';
import { ExperienceCards } from '@/components/ExperienceCards';
import { HomeSearch } from '@/components/HomeSearch';
import { Link } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export default async function ExperiencesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  const experiences = await db.getExperiences({ search: q || undefined });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        {locale === 'it' ? 'Esperienze' : 'Experiences'}
      </h1>
      <div className="mb-6">
        <HomeSearch initialQuery={q} />
      </div>
      {experiences.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">
          {locale === 'it' ? 'Nessuna esperienza trovata.' : 'No experiences found.'}
        </p>
      ) : (
        <ExperienceCards experiences={experiences} locale={locale as 'en' | 'it'} />
      )}
    </div>
  );
}
