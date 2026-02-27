import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { ExperienceCards } from '@/components/ExperienceCards';

type Props = { params: Promise<{ locale: string; areaSlug: string }> };

export default async function AreaPage({ params }: Props) {
  const { locale, areaSlug } = await params;
  setRequestLocale(locale);
  const area = await db.getAreaBySlug(areaSlug);
  if (!area) notFound();
  const experiences = await db.getExperiences({ areaSlug });

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
        <ExperienceCards experiences={experiences} locale={locale as 'en' | 'it'} />
      )}
    </div>
  );
}
