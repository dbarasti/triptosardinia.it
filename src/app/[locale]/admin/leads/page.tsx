import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { ExportLeadsButton } from '@/components/ExportLeadsButton';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ exp?: string }> };

export default async function AdminLeadsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { exp: experienceId } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const [experiences, interests] = await Promise.all([
    db.getAllExperiencesForAdmin(),
    db.getAllInterests(),
  ]);

  const leadsPerExp = experiences.map((e) => ({
    ...e,
    count: interests.filter((i) => i.experience_id === e.id).length,
  }));

  const experienceLeads = experienceId
    ? interests.filter((i) => i.experience_id === experienceId)
    : [];
  const selectedExp = experienceId ? experiences.find((e) => e.id === experienceId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('leadsPerExperience')}
        </h2>
        <ExportLeadsButton />
      </div>

      {selectedExp && experienceId && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {locale === 'it' ? selectedExp.title_it : selectedExp.title_en}
            </h3>
            <Link
              href="/admin/leads"
              className="text-sm text-primary hover:underline"
            >
              {locale === 'it' ? 'Chiudi' : 'Close'}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Party size</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Dates of interest</th>
                  <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Email</th>
                </tr>
              </thead>
              <tbody>
                {experienceLeads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {locale === 'it' ? 'Nessun lead.' : 'No leads.'}
                    </td>
                  </tr>
                ) : (
                  experienceLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {new Date(lead.created_at).toLocaleString(locale === 'it' ? 'it-IT' : 'en-GB')}
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">{lead.party_size}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {(lead.dates_of_interest || []).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{lead.email ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                {locale === 'it' ? 'Esperienza' : 'Experience'}
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                {locale === 'it' ? 'Lead' : 'Leads'}
              </th>
              <th className="px-4 py-3 font-semibold text-slate-900 dark:text-white" aria-label="View" />
            </tr>
          </thead>
          <tbody>
            {leadsPerExp.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-700">
                <td className="px-4 py-3 text-slate-900 dark:text-white">
                  {locale === 'it' ? row.title_it : row.title_en}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.count}</td>
                <td className="px-4 py-3">
                  {row.count > 0 && (
                    <Link
                      href={`/admin/leads?exp=${encodeURIComponent(row.id)}` as '/admin/leads'}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t('viewLeads')}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
