'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useState, useTransition } from 'react';
import { updateExperienceAction } from '@/app/actions/admin-experiences';
import { ExperienceFormFields } from './ExperienceFormFields';

type Props = {
  experienceId: string;
  areas: { id: string; name_en: string; name_it: string }[];
  categories: { id: string; name_en: string; name_it: string }[];
  locale: string;
  initial: {
    title_en: string;
    title_it: string;
    slug: string;
    area_id: string;
    category_id: string;
    description_en: string;
    description_it: string;
    image_urls: string[];
    duration_minutes: number;
    group_size_max: number;
    difficulty?: string;
    location_name_en?: string;
    location_name_it?: string;
    provider_booking_url?: string;
    provider_email?: string;
    provider_phone?: string;
    published: boolean;
    google_maps_url?: string;
    google_place_id?: string;
  };
};

export function EditExperienceForm({ experienceId, areas, categories, locale, initial }: Props) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [result, setResult] = useState<{ ok: boolean; errors?: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const r = await updateExperienceAction(experienceId, formData);
      setResult(r);
      if (r.ok) {
        router.push('/admin/experiences');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ExperienceFormFields areas={areas} categories={categories} locale={locale} experienceId={experienceId} initial={initial} />
      {result?.errors && result.errors.length > 0 && (
        <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
          {result.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          {isPending ? '...' : t('save')}
          <span className="material-symbols-outlined">check</span>
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/experiences')}
          className="px-6 py-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
