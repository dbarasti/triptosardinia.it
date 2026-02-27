'use client';

import { useTranslations } from 'next-intl';

export function ExportLeadsButton() {
  const t = useTranslations('admin');

  return (
    <a
      href="/api/leads/export"
      download="coast-experience-leads.csv"
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {t('exportLeads')}
    </a>
  );
}
