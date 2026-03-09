'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useState, useTransition, useRef } from 'react';
import { createExperienceAction, cleanupDraftMediaAction } from '@/app/actions/admin-experiences';
import { ExperienceFormFields } from './ExperienceFormFields';

export function CreateExperienceForm({
  areas,
  categories,
  locale,
}: {
  areas: { id: string; name_en: string; name_it: string }[];
  categories: { id: string; name_en: string; name_it: string }[];
  locale: string;
}) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [result, setResult] = useState<{ ok: boolean; id?: string; errors?: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();
  const draftPathsRef = useRef<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const r = await createExperienceAction(formData);
      setResult(r);
      if (r.ok && r.id) {
        router.push('/admin/experiences');
      }
    });
  };

  const handleCancel = async () => {
    if (draftPathsRef.current.length) {
      await cleanupDraftMediaAction(draftPathsRef.current);
    }
    router.push('/admin/experiences');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ExperienceFormFields
        areas={areas}
        categories={categories}
        locale={locale}
        onDraftPathsChange={(paths) => { draftPathsRef.current = paths; }}
      />
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
          onClick={handleCancel}
          disabled={isPending}
          className="px-6 py-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
