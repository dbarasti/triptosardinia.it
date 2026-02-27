import { routing } from '@/i18n/routing';
import { db } from '@/lib/db';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap() {
  const locales = routing.locales;
  const [experiences, categories, areas] = await Promise.all([
    db.getExperiences(),
    db.getCategories(),
    db.getAreas(),
  ]);

  const staticPaths = [
    '',
    '/experiences',
    '/favorites',
    '/admin',
    '/admin/experiences',
    '/admin/leads',
    '/admin/analytics',
  ];

  const entries: { url: string; lastModified?: Date; changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'; priority?: number }[] = [];

  for (const locale of locales) {
    const prefix = `/${locale}`;
    for (const path of staticPaths) {
      entries.push({
        url: `${baseUrl}${prefix}${path}`,
        lastModified: new Date(),
        changeFrequency: path.startsWith('/admin') ? 'daily' : 'weekly',
        priority: path === '' ? 1 : path === '/experiences' ? 0.9 : 0.7,
      });
    }
    for (const exp of experiences) {
      entries.push({
        url: `${baseUrl}${prefix}/experiences/${exp.slug}`,
        lastModified: new Date(exp.updated_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
    for (const cat of categories) {
      entries.push({
        url: `${baseUrl}${prefix}/categories/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
    for (const area of areas) {
      entries.push({
        url: `${baseUrl}${prefix}/areas/${area.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return entries;
}
