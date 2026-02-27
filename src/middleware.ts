import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Protect API: leads export requires auth
  if (pathname === '/api/leads/export') {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect admin pages (except login)
  const adminMatch = pathname.match(/^\/(en|it)\/admin(\/|$)/);
  const isLoginPage = /^\/(en|it)\/admin\/login(\/|$)/.test(pathname);
  if (adminMatch && !isLoginPage) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    });
    if (!token) {
      const locale = adminMatch[1];
      const loginUrl = new URL(`/${locale}/admin/login`, req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/', '/(it|en)/:path*', '/api/leads/export'],
};
