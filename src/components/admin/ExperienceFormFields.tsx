'use client';

import { useTranslations } from 'next-intl';
import { useState, useRef } from 'react';
import { uploadExperienceMedia, replaceExperienceMedia } from '@/app/actions/admin-experiences';
import { getImageUrl, getOriginalPath } from '@/lib/image-utils';
import { ImageCropModal } from './ImageCropModal';

type Area = { id: string; name_en: string; name_it: string };
type Category = { id: string; name_en: string; name_it: string };

type Props = {
  areas: Area[];
  categories: Category[];
  locale: string;
  /** When provided (edit flow), show file upload. Omit for create flow. */
  experienceId?: string;
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
    google_maps_url?: string;
    google_place_id?: string;
  };
};

const inputClass =
  'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white';

export function ExperienceFormFields({ areas, categories, locale, experienceId, initial }: Props) {
  const t = useTranslations('admin');
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.image_urls ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cropModal, setCropModal] = useState<{ imageUrl: string; path: string } | null>(null);
  const [thumbVersions, setThumbVersions] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const name = (a: Area) => (locale === 'it' ? a.name_it : a.name_en);
  const catName = (c: Category) => (locale === 'it' ? c.name_it : c.name_en);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
    const result = await uploadExperienceMedia(experienceId ?? null, formData);
    setUploading(false);
    if (result.ok && result.paths?.length) {
      setImageUrls((prev) => [...prev, ...result.paths!]);
    } else if (result.error) {
      setUploadError(result.error);
    }
    e.target.value = '';
    fileInputRef.current?.focus({ preventScroll: true });
  };

  const handleCropSave = async (blob: Blob, index: number) => {
    if (!cropModal) return;
    const formData = new FormData();
    const ext = cropModal.path.match(/\.(jpe?g|png|gif|webp)$/i)?.[0] ?? '.jpg';
    formData.set('file', blob, `image${ext}`);
    const result = await replaceExperienceMedia(cropModal.path, formData);
    if (result.ok) {
      setThumbVersions((v) => ({ ...v, [index]: Date.now() }));
      setCropModal(null);
    } else {
      setUploadError(result.error ?? 'Replace failed');
    }
  };

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
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            disabled={uploading}
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-primary file:font-semibold file:cursor-pointer hover:file:bg-primary/20"
          />
          {uploading && <span className="text-sm text-slate-500">{t('uploading') || 'Uploading…'}</span>}
          {uploadError && <span className="text-sm text-red-600 dark:text-red-400">{uploadError}</span>}
        </div>
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {imageUrls.map((url, i) => {
              const isVideo = /\.(mp4|webm|mov)$/i.test(url);
              const thumbSrc = getImageUrl(url) + (thumbVersions[i] ? `?v=${thumbVersions[i]}` : '');
              return (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 group">
                  {isVideo ? (
                    <video src={getImageUrl(url)} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    {!isVideo && (
                      <button
                        type="button"
                        onClick={() => setCropModal({ imageUrl: getImageUrl(getOriginalPath(url)), path: url })}
                        className="rounded-full p-1.5 bg-white/90 text-slate-800 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        aria-label={t('editImage')}
                        title={t('editImage')}
                      >
                        <span className="material-symbols-outlined text-sm">crop</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="rounded-full p-1.5 bg-white/90 text-slate-800 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label="Remove"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {cropModal && (
          <ImageCropModal
            imageSrc={cropModal.imageUrl}
            fallbackSrc={getImageUrl(cropModal.path)}
            onSave={(blob) => handleCropSave(blob, imageUrls.indexOf(cropModal.path))}
            onCancel={() => setCropModal(null)}
          />
        )}
        <textarea
          id="image_urls"
          name="image_urls"
          rows={3}
          required
          value={imageUrls.join('\n')}
          onChange={(e) => setImageUrls(e.target.value.split(/\r?\n/).map((u) => u.trim()).filter(Boolean))}
          placeholder="https://... or upload above"
          className={inputClass + ' font-mono text-sm resize-none'}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('imageUrlsHintUpload') || 'Add URLs (one per line) or upload files above.'}
        </p>
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
      <div>
        <label htmlFor="google_maps_url" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('googleMapsUrl')}
        </label>
        <input
          id="google_maps_url"
          name="google_maps_url"
          type="url"
          defaultValue={initial?.google_maps_url ?? ''}
          placeholder="https://www.google.com/maps/place/..."
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('googleMapsUrlHint')}</p>
      </div>
      <div>
        <label htmlFor="google_place_id" className="block text-slate-900 dark:text-white font-semibold mb-2">
          {t('googlePlaceId')}
        </label>
        <input
          id="google_place_id"
          name="google_place_id"
          type="text"
          defaultValue={initial?.google_place_id ?? ''}
          placeholder="ChIJ..."
          className={inputClass + ' font-mono text-sm'}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('googlePlaceIdHint')}</p>
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
