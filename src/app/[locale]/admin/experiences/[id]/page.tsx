import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { EditExperienceForm } from '@/components/admin/EditExperienceForm';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function AdminExperienceEditPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const [exp, areas, categories] = await Promise.all([
    db.getExperienceById(id),
    db.getAreas(),
    db.getCategories(),
  ]);

  if (!exp) notFound();

  const initial = {
    title_en: exp.title_en,
    title_it: exp.title_it,
    slug: exp.slug,
    area_id: exp.area_id,
    category_id: exp.category_id,
    description_en: exp.description_en,
    description_it: exp.description_it,
    image_urls: exp.image_urls,
    duration_minutes: exp.duration_minutes,
    group_size_max: exp.group_size_max,
    difficulty: exp.difficulty,
    location_name_en: exp.location_name_en ?? undefined,
    location_name_it: exp.location_name_it ?? undefined,
    provider_booking_url: exp.provider_booking_url ?? undefined,
    provider_email: exp.provider_email ?? undefined,
    provider_phone: exp.provider_phone ?? undefined,
    google_maps_url: exp.google_maps_url ?? undefined,
    google_place_id: exp.google_place_id ?? undefined,
    price_cents: exp.price_cents ?? undefined,
    published: exp.published,
  };

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
          {t('editExperience')}
        </h1>
        <div className="w-10" />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6">
        <EditExperienceForm
          experienceId={exp.id}
          areas={areas}
          categories={categories}
          locale={locale}
          initial={initial}
        />
      </div>
    </div>
  );
}
