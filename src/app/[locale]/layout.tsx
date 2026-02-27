import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';
import { CookieConsent } from '@/components/CookieConsent';
import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import { SetLang } from '@/components/SetLang';
import { FavoritesProvider } from '@/lib/favorites';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: { default: 'CoastExperience — Experiences Northern Sardinia', template: '%s — CoastExperience' },
  description: 'Discover and track your interest in experiences and adventures on the northern coast of Sardinia. Kayaking, diving, hiking and more.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    siteName: 'CoastExperience',
    locale: 'en',
    alternateLocale: ['it'],
  },
  robots: { index: true, follow: true },
};

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'en' | 'it')) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <>
      <SetLang />
      <NextIntlClientProvider messages={messages}>
        <AuthProvider>
          <FavoritesProvider>
          <Header />
          <main className="pb-24 min-h-screen">{children}</main>
          <FooterNav />
          <CookieConsent />
          </FavoritesProvider>
        </AuthProvider>
      </NextIntlClientProvider>
    </>
  );
}
