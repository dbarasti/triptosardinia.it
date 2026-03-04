'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { setHeroImage } from '@/app/actions/admin-settings';
import { replaceExperienceMedia } from '@/app/actions/admin-experiences';
import { getImageUrl } from '@/lib/image-utils';
import { ImageCropModal } from './ImageCropModal';

type Props = { initialHeroPath: string | null };

type CropModalState =
  | { imageSrc: string; mode: 'new'; objectUrl?: string }
  | { imageSrc: string; mode: 'replace'; path: string }
  | null;

export function HeroImageSettings({ initialHeroPath }: Props) {
  const t = useTranslations('admin');
  const [pathInput, setPathInput] = useState(initialHeroPath ?? '');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; error?: string } | null>(null);
  const [cropModal, setCropModal] = useState<CropModalState>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrl = initialHeroPath ? getImageUrl(initialHeroPath) : '';
  const canEditHero = initialHeroPath?.startsWith('media/') ?? false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setCropModal({ imageSrc: objectUrl, mode: 'new', objectUrl });
    e.target.value = '';
  };

  const handleCropSave = async (blob: Blob) => {
    if (!cropModal) return;
    setMessage(null);
    setPending(true);
    try {
      if (cropModal.mode === 'new') {
        const formData = new FormData();
        formData.set('hero_file', blob, 'hero.jpg');
        const result = await setHeroImage(formData);
        setMessage(result);
        if (result.ok) {
          if (cropModal.objectUrl) URL.revokeObjectURL(cropModal.objectUrl);
          setCropModal(null);
          window.location.reload();
        }
      } else {
        const formData = new FormData();
        formData.set('file', blob, 'hero.jpg');
        const result = await replaceExperienceMedia(cropModal.path, formData);
        setMessage(result.ok ? { ok: true } : { ok: false, error: result.error });
        if (result.ok) {
          setCropModal(null);
          window.location.reload();
        }
      }
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await setHeroImage(formData);
    setPending(false);
    setMessage(result);
    if (result.ok) {
      setPathInput('');
      form.reset();
      window.location.reload();
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {t('heroImage')}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {t('heroImageHint')}
      </p>
      {currentUrl && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('currentHero')}
            </p>
            {canEditHero && (
              <button
                type="button"
                onClick={() => setCropModal({ imageSrc: currentUrl, mode: 'replace', path: initialHeroPath! })}
                className="text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">crop</span>
                {t('editImage')}
              </button>
            )}
          </div>
          <div
            className="w-full h-32 rounded-xl bg-slate-200 dark:bg-slate-700 bg-cover bg-center"
            style={{ backgroundImage: `url('${currentUrl}')` }}
          />
        </div>
      )}
      {cropModal && (
        <ImageCropModal
          imageSrc={cropModal.imageSrc}
          onSave={handleCropSave}
          onCancel={() => {
            if (cropModal.mode === 'new' && cropModal.objectUrl) URL.revokeObjectURL(cropModal.objectUrl);
            setCropModal(null);
          }}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="hero_file" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t('uploadNewHero')}
          </label>
          <input
            ref={fileInputRef}
            id="hero_file"
            name="hero_file"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-primary file:font-semibold file:cursor-pointer hover:file:bg-primary/20"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('heroCropHint')}
          </p>
        </div>
        <div>
          <label htmlFor="hero_path" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t('orPathOrUrl')}
          </label>
          <input
            id="hero_path"
            name="hero_path"
            type="text"
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            placeholder="media/site/hero.jpg or https://..."
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {message.ok ? t('saved') : message.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary hover:bg-primary/90 text-white px-4 py-2 font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {pending ? '...' : t('save')}
        </button>
      </form>
    </section>
  );
}
