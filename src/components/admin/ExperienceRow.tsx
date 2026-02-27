'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { setExperiencePublished, deleteExperienceAction } from '@/app/actions/admin-experiences';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

type Props = {
  experienceId: string;
  published: boolean;
  title: string;
  updatedAt: string;
  leadsCount: number;
  imageUrl: string;
  locale: string;
};

function timeAgo(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return locale === 'it' ? `${diffMins} min fa` : `${diffMins}m ago`;
  if (diffHours < 24) return locale === 'it' ? `${diffHours} ore fa` : `${diffHours}h ago`;
  if (diffDays === 1) return locale === 'it' ? 'Ieri' : 'Yesterday';
  if (diffDays < 7) return locale === 'it' ? `${diffDays} giorni fa` : `${diffDays} days ago`;
  return d.toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short' });
}

export function ExperienceRow({ experienceId, published, title, updatedAt, leadsCount, imageUrl, locale }: Props) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPublished, setIsPublished] = useState(published);

  const handleToggle = async () => {
    setIsPublished(!isPublished);
    await setExperiencePublished(experienceId, !isPublished);
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeleting(true);
    await deleteExperienceAction(experienceId);
    setOpen(false);
    setDeleting(false);
    router.push('/admin/experiences');
  };

  return (
    <div className="relative group flex gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <Link
        href={{ pathname: '/admin/experiences/[id]', params: { id: experienceId } }}
        className="flex flex-1 gap-4 min-w-0"
      >
        <div className="relative bg-slate-200 dark:bg-slate-700 rounded-xl size-20 shrink-0 overflow-hidden">
          <Image
            src={imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200'}
            alt=""
            width={80}
            height={80}
            className={`object-cover w-full h-full ${!isPublished ? 'grayscale' : ''}`}
          />
        </div>
        <div className="flex flex-1 flex-col justify-center min-w-0">
          <p className="text-slate-900 dark:text-white text-base font-bold leading-tight truncate">{title}</p>
          {!isPublished && (
            <p className="text-amber-600 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
              {t('draft')}
            </p>
          )}
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
            {t('editedAgo', { time: timeAgo(updatedAt, locale) })}
          </p>
          <p className="text-primary font-bold text-sm mt-1">{t('leadsCount', { count: leadsCount })}</p>
        </div>
      </Link>
      <div className="flex flex-col items-end justify-between py-1">
        <label className="relative flex h-6 w-10 cursor-pointer items-center rounded-full border-none bg-slate-200 dark:bg-slate-700 p-0.5 has-[:checked]:bg-primary transition-colors shrink-0">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={handleToggle}
            className="sr-only peer"
            aria-label={isPublished ? 'Published' : 'Draft'}
          />
          <span className={`h-5 w-5 rounded-full bg-white shadow-sm block transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-expanded={open}
            aria-haspopup="true"
          >
            <span className="material-symbols-outlined text-xl">more_vert</span>
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg min-w-[120px]">
                <Link
                  href={{ pathname: '/admin/experiences/[id]', params: { id: experienceId } }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() => setOpen(false)}
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  {t('editExperience')}
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  {t('delete')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
