import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { HeroImageSettings } from '@/components/admin/HeroImageSettings';

type Props = { params: Promise<{ locale: string }> };

export default async function AdminSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const heroPath = await db.getSiteSetting('hero_image_path');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('settings')}</h2>
      <HeroImageSettings initialHeroPath={heroPath} />
    </div>
  );
}
