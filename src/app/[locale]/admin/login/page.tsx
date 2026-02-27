import { setRequestLocale } from 'next-intl/server';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ callbackUrl?: string }> };

export default async function AdminLoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { callbackUrl } = await searchParams;
  const fallback = `/${locale}/admin`;
  return <AdminLoginForm callbackUrl={callbackUrl ?? fallback} />;
}
