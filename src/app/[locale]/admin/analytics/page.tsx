import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';

type Props = { params: Promise<{ locale: string }> };

export default async function AdminAnalyticsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const experiences = await db.getAllExperiencesForAdmin();
  const interestsOverTime = await db.getInterestsOverTime(30);
  const topByInterest = await db.getTopExperiencesByInterest(10);
  const expMap = new Map(experiences.map((e) => [e.id, e]));

  const viewsPerExp = await Promise.all(
    experiences.map(async (exp) => ({
      ...exp,
      views: await db.getViewCountByExperience(exp.id),
    }))
  );

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
        {locale === 'it' ? 'Analytics' : 'Analytics'}
      </h2>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          {locale === 'it' ? 'Visualizzazioni per esperienza' : 'Views per experience'}
        </h3>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {locale === 'it' ? 'Esperienza' : 'Experience'}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Views</th>
              </tr>
            </thead>
            <tbody>
              {viewsPerExp.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-3 text-slate-900 dark:text-white">
                    {locale === 'it' ? row.title_it : row.title_en}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          {locale === 'it' ? 'Interessi negli ultimi 30 giorni' : 'Interests over last 30 days'}
        </h3>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          {interestsOverTime.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {locale === 'it' ? 'Nessun dato.' : 'No data.'}
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {interestsOverTime.map(({ date, count }) => (
                <li key={date} className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{date}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          {locale === 'it' ? 'Esperienze più richieste' : 'Top experiences by interest'}
        </h3>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {locale === 'it' ? 'Esperienza' : 'Experience'}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {locale === 'it' ? 'Interessi' : 'Interests'}
                </th>
              </tr>
            </thead>
            <tbody>
              {topByInterest.map(({ experience_id, count }) => {
                const exp = expMap.get(experience_id);
                return (
                  <tr key={experience_id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="px-4 py-3 text-slate-900 dark:text-white">
                      {exp ? (locale === 'it' ? exp.title_it : exp.title_en) : experience_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
