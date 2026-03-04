'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

export function AdminNav() {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isDashboard = pathname === '/admin';
  const isExperiences = pathname?.startsWith('/admin/experiences') && pathname !== '/admin/experiences/new';
  const isLeads = pathname === '/admin/leads';
  const isAnalytics = pathname === '/admin/analytics';
  const isSettings = pathname === '/admin/settings';
  const isLogin = pathname === '/admin/login';

  const linkClass = (active: boolean) =>
    `flex flex-col items-center gap-1 py-2 px-3 rounded-lg text-[10px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active ? 'text-primary bg-primary/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
    }`;

  return (
    <nav className="flex items-center gap-1 px-4 py-2 border-t border-slate-200 dark:border-slate-800" aria-label="Admin navigation">
      {!isLogin && (
        <>
          <Link href="/admin" className={linkClass(isDashboard)}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isDashboard ? "'FILL' 1" : undefined }}>
              dashboard
            </span>
            {t('dashboard')}
          </Link>
          <Link href="/admin/experiences" className={linkClass(isExperiences)}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isExperiences ? "'FILL' 1" : undefined }}>
              list_alt
            </span>
            {t('manageExperiences')}
          </Link>
          <Link href="/admin/leads" className={linkClass(isLeads)}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isLeads ? "'FILL' 1" : undefined }}>
              group
            </span>
            {t('leads')}
          </Link>
          <Link href="/admin/analytics" className={linkClass(isAnalytics)}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isAnalytics ? "'FILL' 1" : undefined }}>
              bar_chart
            </span>
            {t('analytics')}
          </Link>
          <Link href="/admin/settings" className={linkClass(isSettings)}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isSettings ? "'FILL' 1" : undefined }}>
              settings
            </span>
            {t('settings')}
          </Link>
          {session && status === 'authenticated' && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className={linkClass(false)}
              title={t('signOut')}
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              {t('signOut')}
            </button>
          )}
        </>
      )}
    </nav>
  );
}
