import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Link } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const [experiences, interests, interestsOverTime] = await Promise.all([
    db.getAllExperiencesForAdmin(),
    db.getAllInterests(),
    db.getInterestsOverTime(30),
  ]);

  const totalLeads = interests.length;
  const viewCounts = await Promise.all(experiences.map((exp) => db.getViewCountByExperience(exp.id)));
  const totalViews = viewCounts.reduce((a, b) => a + b, 0);
  const topByInterest = await db.getTopExperiencesByInterest(5);
  const expMap = new Map(experiences.map((e) => [e.id, e]));

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const interestsThisMonth = interests.filter((i) => new Date(i.created_at) >= thisMonth).length;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('dashboard')}</h2>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          href="/admin/leads"
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('totalLeads')}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{totalLeads}</p>
        </Link>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('totalViews')}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalViews}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('interestsThisMonth')}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{interestsThisMonth}</p>
        </div>
        <Link
          href="/admin/experiences"
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('manageExperiences')}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{experiences.length}</p>
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('topExperiences')}</h3>
          <Link href="/admin/analytics" className="text-sm font-medium text-primary hover:underline">
            {locale === 'it' ? 'Vedi tutti' : 'View all'}
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          {topByInterest.length === 0 ? (
            <p className="p-4 text-slate-500 dark:text-slate-400 text-sm">
              {locale === 'it' ? 'Nessun interesse ancora.' : 'No interests yet.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {topByInterest.map(({ experience_id, count }) => {
                const exp = expMap.get(experience_id);
                return (
                  <li key={experience_id}>
                    <Link
                      href={{ pathname: '/admin/experiences/[id]', params: { id: experience_id } }}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <span className="font-medium text-slate-900 dark:text-white">
                        {exp ? (locale === 'it' ? exp.title_it : exp.title_en) : experience_id}
                      </span>
                      <span className="text-primary font-semibold">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('interestsOverTime')}</h3>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          {interestsOverTime.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {locale === 'it' ? 'Nessun dato negli ultimi 30 giorni.' : 'No data in the last 30 days.'}
            </p>
          ) : (
            <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
              {interestsOverTime.slice(-14).reverse().map(({ date, count }) => (
                <li key={date} className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{date}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
