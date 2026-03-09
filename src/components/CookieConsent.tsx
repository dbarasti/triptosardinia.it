'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

const CONSENT_KEY = 'ce_consent';

export function CookieConsent() {
  const t = useTranslations('consent');
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<'all' | 'essential' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(CONSENT_KEY) as 'all' | 'essential' | null;
    if (stored === 'all' || stored === 'essential') {
      setConsent(stored);
    } else {
      setConsent(null);
    }
    setMounted(true);
  }, []);

  const acceptAll = () => {
    localStorage.setItem(CONSENT_KEY, 'all');
    setConsent('all');
  };

  const essentialOnly = () => {
    localStorage.setItem(CONSENT_KEY, 'essential');
    setConsent('essential');
  };

  if (!mounted || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-24 left-4 right-4 z-[70] max-w-md mx-auto p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl"
    >
      <h2 id="cookie-consent-title" className="text-lg font-bold text-slate-900 dark:text-white">
        {t('title')}
      </h2>
      <p id="cookie-consent-desc" className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {t('description')}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={essentialOnly}
          className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('essentialOnly')}
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('acceptAll')}
        </button>
      </div>
    </div>
  );
}
