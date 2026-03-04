'use client';

import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { getCroppedImg, type PixelCrop } from '@/lib/crop-image';
import { useTranslations } from 'next-intl';

const ASPECT = 4 / 3;

type Props = {
  imageSrc: string;
  onSave: (blob: Blob) => void | Promise<void>;
  onCancel: () => void;
};

export function ImageCropModal({ imageSrc, onSave, onCancel }: Props) {
  const t = useTranslations('admin');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels as PixelCrop);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      await onSave(blob);
      onCancel();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900" aria-modal="true" role="dialog">
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={ASPECT}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          objectFit="contain"
          style={{ containerStyle: { backgroundColor: '#0f172a' } }}
        />
      </div>
      <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 bg-slate-800 border-t border-slate-700">
        <label className="flex items-center gap-2 text-sm text-white">
          <span>{t('zoom')}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 accent-primary"
          />
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-500 bg-slate-700/50 text-white font-semibold hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !croppedAreaPixels}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {saving ? '...' : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
