'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

type Props = { callbackUrl: string };

export default function AdminLoginForm({ callbackUrl }: Props) {
  const t = useTranslations('admin');
  const router = useRouter();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">{t('signIn')}…</p>
      </div>
    );
  }

  if (session) {
    router.replace(callbackUrl);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        username: username.trim(),
        password,
        callbackUrl,
        redirect: false,
      });
      if (res?.error) {
        setError(t('loginError'));
        setLoading(false);
        return;
      }
      if (res?.ok && res.url) {
        router.push(res.url);
        return;
      }
      setError(t('loginError'));
    } catch {
      setError(t('loginError'));
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-sm space-y-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('signIn')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('username')}
          </span>
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t('usernamePlaceholder')}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('password')}
          </span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t('passwordPlaceholder')}
          />
        </label>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-2.5 font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-slate-800"
        >
          {loading ? '…' : t('signIn')}
        </button>
      </form>
    </div>
  );
}
