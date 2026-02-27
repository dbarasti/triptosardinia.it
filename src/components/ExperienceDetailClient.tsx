'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import type { Locale } from '@/lib/types';
import { submitInterest } from '@/app/actions/interest';
import { MAX_PARTY_SIZE, MAX_DATES_OF_INTEREST } from '@/lib/types';
import { InterestDatePicker } from '@/components/InterestDatePicker';

type FormData = {
  party_size: number;
  dates_raw: string;
  email?: string;
  name?: string;
  consent_email?: boolean;
  honeypot?: string;
};

type Props = {
  experienceId: string;
  experienceSlug: string;
  hasProviderContact: boolean;
  providerBookingUrl?: string;
  providerEmail?: string | null;
  providerPhone?: string | null;
  locale: Locale;
};

export function ExperienceDetailClient({
  experienceId,
  hasProviderContact,
  providerBookingUrl,
  providerEmail,
  providerPhone,
  locale,
}: Props) {
  const t = useTranslations('experience');
  const tForm = useTranslations('interestForm');
  const tVal = useTranslations('validation');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerRevealed, setProviderRevealed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { party_size: 2, dates_raw: '', honeypot: '' },
  });

  const datesRaw = watch('dates_raw');

  const onSubmit = async (data: FormData) => {
    if (data.honeypot) return;
    setError(null);
    const dates = data.dates_raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_DATES_OF_INTEREST);
    const result = await submitInterest({
      experience_id: experienceId,
      party_size: Number(data.party_size),
      dates_of_interest: dates,
      session_id: typeof window !== 'undefined' ? `session-${Date.now()}` : undefined,
      email: data.consent_email && data.email ? data.email : undefined,
      name: data.name || undefined,
    });
    if (result.success) {
      setSubmitted(true);
      setFormOpen(false);
      if (hasProviderContact) setProviderRevealed(true);
    } else {
      setError(result.error === 'rate_limit' ? 'Too many requests. Please try again later.' : 'Something went wrong.');
    }
  };

  if (!hasProviderContact) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-[60] bg-[var(--background-light)] dark:bg-[var(--background-dark)] border-t border-slate-200 dark:border-slate-800 px-4 py-3 pb-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-slate-600 dark:text-slate-400 text-center text-sm py-2">
            Contact details coming soon. Check back later.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-[60] bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 px-4 py-4 pb-8 shadow-lg max-h-[85vh] overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tForm('successTitle')}</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">{tForm('successMessage')}</p>
          {(providerBookingUrl || providerEmail || providerPhone) && (
            <div className="flex flex-col gap-2">
              {providerBookingUrl && (
                <a
                  href={providerBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-4 font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {tForm('providerLink')}
                  <span className="material-symbols-outlined">open_in_new</span>
                </a>
              )}
              {(providerEmail || providerPhone) && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">{tForm('providerContact')}</span>
                  {providerEmail && <p>Email: <a href={`mailto:${providerEmail}`} className="text-primary underline">{providerEmail}</a></p>}
                  {providerPhone && <p>Phone: <a href={`tel:${providerPhone}`} className="text-primary underline">{providerPhone}</a></p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[60] bg-[var(--background-light)] dark:bg-[var(--background-dark)] border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="max-w-2xl mx-auto">
        {!formOpen ? (
          <div className="px-4 py-3 pb-6">
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="w-full rounded-xl bg-primary text-white py-4 font-bold text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">favorite</span>
              {t('imInterested')}
            </button>
          </div>
        ) : (
          <div className="max-h-[85vh] overflow-y-auto overscroll-contain">
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 pb-8 space-y-4">
              <div className="flex items-center justify-between sticky top-0 z-10 -mt-4 pt-4 pb-2 bg-[var(--background-light)] dark:bg-[var(--background-dark)]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{tForm('title')}</h2>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <input type="text" {...register('honeypot')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
              <input
                type="hidden"
                {...register('dates_raw', {
                  required: true,
                  validate: (v) => {
                    const parts = (v ?? '').split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
                    if (parts.length === 0) return false;
                    const iso = /^\d{4}-\d{2}-\d{2}$/;
                    return parts.every((d) => iso.test(d));
                  },
                })}
              />
              <div>
                <label htmlFor="party_size" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {tForm('partySize')}
                </label>
                <input
                  id="party_size"
                  type="number"
                  min={1}
                  max={MAX_PARTY_SIZE}
                  {...register('party_size', {
                    required: true,
                    min: 1,
                    max: MAX_PARTY_SIZE,
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
                {errors.party_size && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.party_size.type === 'required'
                      ? tVal('partySizeRequired')
                      : errors.party_size.type === 'min'
                        ? tVal('partySizeMin')
                        : tVal('partySizeMax', { max: MAX_PARTY_SIZE })}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="dates_picker" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {tForm('datesOfInterest')}
                </label>
                <InterestDatePicker
                  value={datesRaw ?? ''}
                  onChange={(next) => setValue('dates_raw', next, { shouldValidate: true })}
                  error={errors.dates_raw?.type === 'required' ? tVal('datesRequired') : errors.dates_raw?.type === 'validate' ? tVal('dateInvalid') : undefined}
                  locale={locale}
                  max={MAX_DATES_OF_INTEREST}
                  aria-describedby={errors.dates_raw ? 'dates_error' : undefined}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {tForm('email')}
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('consent_email')} className="rounded border-slate-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{tForm('consentEmail')}</span>
                </label>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary text-white py-4 font-bold text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">send</span>
                    {tForm('submit')}
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
