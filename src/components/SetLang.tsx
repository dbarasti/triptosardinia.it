'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export function SetLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
