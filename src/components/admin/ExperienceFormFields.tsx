'use client';

import { useTranslations } from 'next-intl';

type Area = { id: string; name_en: string; name_it: string };
type Category = { id: string; name_en: string; name_it: string };

type Props = {
  areas: Area[];
  categories: Category[];
  locale: string;
  initial?: {
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
  };
};

const inputClass =
  'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white';

export function ExperienceFormFields({ areas, categories, locale, initial }: Props) {
  const t = useTranslations('admin');
  const name = (a: Area) => (locale === 'it' ? a.name_it : a.name_en);
  const catName = (c: Category) => (locale === 'it' ? c.name_it : c.name_en);

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title_en" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('titleEn')}
        </label>
        <input
          id="title_en"
          name="title_en"
          type="text"
          required
          defaultValue={initial?.title_en}
          placeholder={t('experienceTitlePlaceholder')}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="title_it" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('titleIt')}
        </label>
        <input
          id="title_it"
          name="title_it"
          type="text"
          required
          defaultValue={initial?.title_it}
          placeholder={t('experienceTitlePlaceholder')}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="slug" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('slug')}
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          defaultValue={initial?.slug}
          placeholder={t('slugPlaceholder')}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="area_id" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('area')}
        </label>
        <select id="area_id" name="area_id" required className={inputClass} defaultValue={initial?.area_id}>
          <option value="">—</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {name(a)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="category_id" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('category')}
        </label>
        <select id="category_id" name="category_id" required className={inputClass} defaultValue={initial?.category_id}>
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {catName(c)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="description_en" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('descriptionEn')}
        </label>
        <textarea
          id="description_en"
          name="description_en"
          rows={4}
          required
          defaultValue={initial?.description_en}
          placeholder={t('descriptionPlaceholder')}
          className={inputClass + ' resize-none'}
        />
      </div>
      <div>
        <label htmlFor="description_it" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('descriptionIt')}
        </label>
        <textarea
          id="description_it"
          name="description_it"
          rows={4}
          required
          defaultValue={initial?.description_it}
          placeholder={t('descriptionPlaceholder')}
          className={inputClass + ' resize-none'}
        />
      </div>
      <div>
        <label htmlFor="image_urls" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('imageUrls')}
        </label>
        <textarea
          id="image_urls"
          name="image_urls"
          rows={3}
          required
          defaultValue={initial?.image_urls?.join('\n')}
          placeholder="https://..."
          className={inputClass + ' font-mono text-sm resize-none'}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration_minutes" className="block text-slate-900 dark:text-white font-semibold mb-2">
            {t('durationMinutes')}
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={1}
            required
            defaultValue={initial?.duration_minutes ?? 60}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="group_size_max" className="block text-slate-900 dark:text-white font-semibold mb-2">
            {t('groupSizeMax')}
          </label>
          <input
            id="group_size_max"
            name="group_size_max"
            type="number"
            min={1}
            required
            defaultValue={initial?.group_size_max ?? 10}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="difficulty" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('difficulty')}
        </label>
        <select id="difficulty" name="difficulty" className={inputClass} defaultValue={initial?.difficulty ?? ''}>
          <option value="">—</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div>
        <label htmlFor="location_name_en" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('locationEn')}
        </label>
        <input
          id="location_name_en"
          name="location_name_en"
          type="text"
          defaultValue={initial?.location_name_en}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="location_name_it" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('locationIt')}
        </label>
        <input
          id="location_name_it"
          name="location_name_it"
          type="text"
          defaultValue={initial?.location_name_it}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="provider_booking_url" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('providerBookingUrl')}
        </label>
        <input
          id="provider_booking_url"
          name="provider_booking_url"
          type="url"
          defaultValue={initial?.provider_booking_url ?? ''}
          placeholder="https://..."
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="provider_email" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('providerEmail')}
        </label>
        <input
          id="provider_email"
          name="provider_email"
          type="email"
          defaultValue={initial?.provider_email ?? ''}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="provider_phone" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('providerPhone')}
        </label>
        <input
          id="provider_phone"
          name="provider_phone"
          type="tel"
          defaultValue={initial?.provider_phone ?? ''}
          className={inputClass}
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="published"
          defaultChecked={initial?.published ?? true}
          className="rounded border-slate-300 text-primary focus:ring-primary"
        />
        <span className="text-slate-900 dark:text-white font-medium">{t('published')}</span>
      </label>
    </div>
  );
}
