import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { CreateExperienceForm } from '@/components/admin/CreateExperienceForm';

type Props = { params: Promise<{ locale: string }> };

export default async function AdminNewExperiencePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const [areas, categories] = await Promise.all([db.getAreas(), db.getCategories()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/experiences"
          className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Back"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex-1 text-center">
          {t('createExperience')}
        </h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6">
        <CreateExperienceForm
          areas={areas}
          categories={categories}
          locale={locale}
        />
      </div>
    </div>
  );
}
