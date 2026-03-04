import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'it'],
  defaultLocale: 'en',
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/experiences': '/experiences',
    '/experiences/[slug]': '/experiences/[slug]',
    '/areas/[areaSlug]': '/areas/[areaSlug]',
    '/categories/[categorySlug]': '/categories/[categorySlug]',
    '/favorites': '/favorites',
    '/admin': '/admin',
    '/admin/experiences': '/admin/experiences',
    '/admin/experiences/new': '/admin/experiences/new',
    '/admin/experiences/[id]': '/admin/experiences/[id]',
    '/admin/analytics': '/admin/analytics',
    '/admin/leads': '/admin/leads',
    '/admin/login': '/admin/login',
    '/admin/settings': '/admin/settings',
  },
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
