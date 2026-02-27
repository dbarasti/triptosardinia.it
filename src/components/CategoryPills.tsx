import { db } from '@/lib/db';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/lib/types';

export async function CategoryPills({ locale = 'en' }: { locale?: Locale }) {
  const categories = await db.getCategories();

  return (
    <div className="flex justify-between gap-4 overflow-x-auto pb-4 no-scrollbar">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={{ pathname: '/categories/[categorySlug]', params: { categorySlug: cat.slug } }}
          className="flex flex-col items-center gap-2 min-w-[72px] flex-shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-hidden
          >
            <span className="material-symbols-outlined text-3xl">{cat.icon || 'explore'}</span>
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {locale === 'it' ? cat.name_it : cat.name_en}
          </span>
        </Link>
      ))}
    </div>
  );
}
