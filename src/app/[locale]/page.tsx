import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { getReviewsSummaryForExperiences } from '@/lib/google-reviews';
import { getImageUrl } from '@/lib/image-utils';
import { HomeSearch } from '@/components/HomeSearch';
import { CategoryPills } from '@/components/CategoryPills';
import { ExperienceCards } from '@/components/ExperienceCards';
import { Link } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const experiences = await db.getExperiences();
  const ratings = await getReviewsSummaryForExperiences(experiences.map((e) => e.id));

  return (
    <div className="relative flex flex-col overflow-x-hidden">
      {/* Hero */}
      <div className="relative h-[360px] md:h-[440px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${getImageUrl(process.env.NEXT_PUBLIC_HERO_IMAGE_URL) || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920'}')`,
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[var(--background-light)] dark:to-[var(--background-dark)]" />
        <div className="relative z-10 mt-24 md:mt-32 px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white drop-shadow-md">
            {t('title')}
          </h1>
          <div className="mt-6 md:mt-8">
            <HomeSearch />
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <section className="mt-4 px-4 md:px-6" aria-labelledby="categories-heading">
        <div className="flex items-center justify-between pb-4">
          <h2 id="categories-heading" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('popularCategories')}
          </h2>
          <Link href="/experiences" className="text-sm font-semibold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            {tCommon('seeAll')}
          </Link>
        </div>
        <CategoryPills locale={locale as 'en' | 'it'} />
      </section>

      {/* Trending / Featured experiences */}
      <section className="mt-8 px-4 md:px-6 pb-8" aria-labelledby="experiences-heading">
        <h2 id="experiences-heading" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white pb-4">
          {t('trendingExperiences')}
        </h2>
        <ExperienceCards experiences={experiences} locale={locale as 'en' | 'it'} ratings={ratings} />
      </section>
    </div>
  );
}
