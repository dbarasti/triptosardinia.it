import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AdminNav } from '@/components/admin/AdminNav';

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101822]">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Admin</h1>
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {t('backToSite')}
          </Link>
        </div>
        <AdminNav />
      </header>
      <main className="max-w-4xl mx-auto p-4 pb-24">{children}</main>
    </div>
  );
}
