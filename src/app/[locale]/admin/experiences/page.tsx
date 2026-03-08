import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { AdminExperienceSearch } from '@/components/admin/AdminExperienceSearch';
import { ExperienceRow } from '@/components/admin/ExperienceRow';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; status?: string }> };

export default async function AdminExperiencesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q, status } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  let experiences = await db.getAllExperiencesForAdmin();
  if (q?.trim()) {
    const lower = q.trim().toLowerCase();
    experiences = experiences.filter(
      (e) =>
        e.title_en.toLowerCase().includes(lower) ||
        e.title_it.toLowerCase().includes(lower) ||
        e.slug.toLowerCase().includes(lower)
    );
  }
  if (status === 'active') experiences = experiences.filter((e) => e.published);
  if (status === 'drafts') experiences = experiences.filter((e) => !e.published);

  const interests = await db.getAllInterests();
  const leadCountByExp = new Map<string, number>();
  interests.forEach((i) => leadCountByExp.set(i.experience_id, (leadCountByExp.get(i.experience_id) ?? 0) + 1));

  const filter = (status === 'active' || status === 'drafts' ? status : 'all') as 'all' | 'active' | 'drafts';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('manageExperiences')}</h2>
        <Link
          href="/admin/experiences/new"
          className="flex items-center justify-center rounded-full size-10 bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t('createExperience')}
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </Link>
      </div>

      <AdminExperienceSearch initialQuery={q ?? ''} initialFilter={filter} />

      <div className="space-y-3">
        {experiences.length === 0 ? (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            {locale === 'it' ? 'Nessuna esperienza trovata.' : 'No experiences found.'}
          </p>
        ) : (
          experiences.map((exp) => (
            <ExperienceRow
              key={exp.id}
              experienceId={exp.id}
              published={exp.published}
              title={locale === 'it' ? exp.title_it : exp.title_en}
              updatedAt={exp.updated_at}
              leadsCount={leadCountByExp.get(exp.id) ?? 0}
              imageUrl={exp.image_urls[0] ?? ''}
              locale={locale}
            />
          ))
        )}
      </div>

      <Link
        href="/admin/experiences/new"
        className="fixed bottom-24 right-6 flex items-center justify-center rounded-full size-14 bg-primary text-white shadow-xl shadow-primary/30 hover:bg-primary/90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={t('createExperience')}
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </Link>
    </div>
  );
}
