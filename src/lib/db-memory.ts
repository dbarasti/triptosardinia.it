// In-memory data store when DATABASE_URL is not set.
import type { Area, Category, Experience, InterestEvent, ExperienceViewEvent } from './types';

const areas: Area[] = [
  {
    id: 'area-northern-sardinia',
    slug: 'northern-sardinia',
    name_en: 'Northern Sardinia',
    name_it: 'Sardegna settentrionale',
    description_en: 'Discover experiences along the northern coast of Sardinia.',
    description_it: 'Scopri le esperienze lungo la costa settentrionale della Sardegna.',
  },
];

const categories: Category[] = [
  { id: 'cat-hiking', slug: 'hiking', name_en: 'Hiking', name_it: 'Escursionismo', icon: 'landscape' },
  { id: 'cat-diving', slug: 'diving', name_en: 'Diving', name_it: 'Immersioni', icon: 'scuba_diving' },
  { id: 'cat-kayaking', slug: 'kayaking', name_en: 'Kayaking', name_it: 'Kayak', icon: 'kayaking' },
  { id: 'cat-surfing', slug: 'surfing', name_en: 'Surfing', name_it: 'Surf', icon: 'surfing' },
  { id: 'cat-camping', slug: 'camping', name_en: 'Camping', name_it: 'Campeggio', icon: 'camping' },
  { id: 'cat-rentals', slug: 'rentals', name_en: 'Rentals', name_it: 'Noleggi', icon: 'car_rental' },
];

const experiences: Experience[] = [
  {
    id: 'exp-1',
    slug: 'blue-lagoon-kayaking',
    area_id: 'area-northern-sardinia',
    category_id: 'cat-kayaking',
    title_en: 'Blue Lagoon Kayaking',
    title_it: 'Kayak nella Laguna Blu',
    description_en: 'Kayak in crystal-clear waters along the northern coast. Half-day adventure with local guide.',
    description_it: 'Kayak nelle acque cristalline lungo la costa settentrionale. Avventura di mezza giornata con guida locale.',
    image_urls: [
      'media/experiences/exp-1/images/bouldering_outdoor1.jpeg',
      'media/experiences/exp-1/images/kids_sailing1.jpeg',
      'media/experiences/exp-1/images/sailing1.mp4',
    ],
    duration_minutes: 240,
    group_size_max: 10,
    difficulty: 'medium',
    location_name_en: 'Costa Smeralda',
    location_name_it: 'Costa Smeralda',
    provider_booking_url: 'https://example-provider.com/kayak',
    provider_email: 'book@example-provider.com',
    provider_phone: '+39 123 456 7890',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published: true,
  },
  {
    id: 'exp-2',
    slug: 'stintino-diving',
    area_id: 'area-northern-sardinia',
    category_id: 'cat-diving',
    title_en: 'Stintino Diving Experience',
    title_it: 'Esperienza subacquea a Stintino',
    description_en: 'Dive in the marine protected area. Suitable for certified divers.',
    description_it: 'Immersione nell\'area marina protetta. Adatto a subacquei certificati.',
    image_urls: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'],
    duration_minutes: 360,
    group_size_max: 8,
    difficulty: 'medium',
    location_name_en: 'Stintino',
    location_name_it: 'Stintino',
    provider_booking_url: 'https://example-diving.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published: true,
  },
  {
    id: 'exp-3',
    slug: 'contact-coming-soon',
    area_id: 'area-northern-sardinia',
    category_id: 'cat-hiking',
    title_en: 'Mountain Hike (Contact coming soon)',
    title_it: 'Escursione in montagna (Contatti in arrivo)',
    description_en: 'Scenic hike. Provider contact details coming soon.',
    description_it: 'Escursione panoramica. Dettagli contatto fornitore in arrivo.',
    image_urls: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'],
    duration_minutes: 480,
    group_size_max: 12,
    provider_booking_url: null,
    provider_email: null,
    provider_phone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published: true,
  },
];

const interestEvents: InterestEvent[] = [];
const viewEvents: ExperienceViewEvent[] = [];
const siteSettings = new Map<string, string>();

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const googleReviewsCache = new Map<string, { place_id: string; rating: number; user_ratings_total: number; reviews: unknown[]; fetched_at: string }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(identifier: string): boolean {
  const key = `interest:${identifier}`;
  const now = Date.now();
  let timestamps = rateLimitMap.get(key) ?? [];
  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

export const dbMemory = {
  async getAreas(): Promise<Area[]> {
    return [...areas];
  },

  async getAreaBySlug(slug: string): Promise<Area | undefined> {
    return areas.find((a) => a.slug === slug);
  },

  async getCategories(): Promise<Category[]> {
    return [...categories];
  },

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return categories.find((c) => c.slug === slug);
  },

  async getExperiences(opts?: { areaSlug?: string; categorySlug?: string; search?: string }): Promise<Experience[]> {
    let list = experiences.filter((e) => e.published);
    if (opts?.areaSlug) {
      const area = areas.find((a) => a.slug === opts.areaSlug);
      if (area) list = list.filter((e) => e.area_id === area.id);
    }
    if (opts?.categorySlug) {
      const cat = categories.find((c) => c.slug === opts.categorySlug);
      if (cat) list = list.filter((e) => e.category_id === cat.id);
    }
    if (opts?.search?.trim()) {
      const q = opts.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title_en.toLowerCase().includes(q) ||
          e.title_it.toLowerCase().includes(q) ||
          (e.location_name_en?.toLowerCase().includes(q)) ||
          (e.location_name_it?.toLowerCase().includes(q))
      );
      const catMatch = categories.find(
        (c) => c.name_en.toLowerCase().includes(q) || c.name_it.toLowerCase().includes(q)
      );
      if (catMatch) {
        const fromCat = experiences.filter((e) => e.category_id === catMatch.id && e.published);
        list = Array.from(new Map([...list, ...fromCat].map((e) => [e.id, e])).values());
      }
    }
    return list;
  },

  async getExperienceBySlug(slug: string): Promise<Experience | undefined> {
    return experiences.find((e) => e.slug === slug && e.published);
  },

  async getExperienceById(id: string): Promise<Experience | undefined> {
    return experiences.find((e) => e.id === id);
  },

  async addInterest(event: Omit<InterestEvent, 'id' | 'created_at'>, ipOrSessionId: string): Promise<{ success: boolean; error?: string }> {
    if (!checkRateLimit(ipOrSessionId)) {
      return { success: false, error: 'rate_limit' };
    }
    const newEvent: InterestEvent = {
      ...event,
      id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      created_at: new Date().toISOString(),
    };
    interestEvents.push(newEvent);
    return { success: true };
  },

  async getInterestsByExperience(experienceId: string): Promise<InterestEvent[]> {
    return interestEvents.filter((e) => e.experience_id === experienceId);
  },

  async getAllInterests(): Promise<InterestEvent[]> {
    return [...interestEvents];
  },

  async recordView(experienceId: string, sessionId?: string): Promise<void> {
    viewEvents.push({
      id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      experience_id: experienceId,
      session_id: sessionId ?? null,
      created_at: new Date().toISOString(),
    });
  },

  async getViewCountByExperience(experienceId: string): Promise<number> {
    return viewEvents.filter((e) => e.experience_id === experienceId).length;
  },

  async getInterestsOverTime(days: number): Promise<{ date: string; count: number }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const byDate = new Map<string, number>();
    interestEvents.forEach((e) => {
      if (new Date(e.created_at) >= cutoff) {
        const d = e.created_at.slice(0, 10);
        byDate.set(d, (byDate.get(d) ?? 0) + 1);
      }
    });
    return Array.from(byDate.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  },

  async getTopExperiencesByInterest(limit: number): Promise<{ experience_id: string; count: number }[]> {
    const counts = new Map<string, number>();
    interestEvents.forEach((e) => counts.set(e.experience_id, (counts.get(e.experience_id) ?? 0) + 1));
    return Array.from(counts.entries())
      .map(([experience_id, count]) => ({ experience_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  async getAllExperiencesForAdmin(): Promise<Experience[]> {
    return [...experiences];
  },

  async updateExperience(id: string, data: Partial<Experience>): Promise<Experience | null> {
    const idx = experiences.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    experiences[idx] = { ...experiences[idx], ...data, updated_at: new Date().toISOString() };
    return experiences[idx];
  },

  async createExperience(data: Omit<Experience, 'id' | 'created_at' | 'updated_at'>): Promise<Experience> {
    const id = `exp-${Date.now()}`;
    const now = new Date().toISOString();
    const exp: Experience = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    experiences.push(exp);
    return exp;
  },

  async deleteExperience(id: string): Promise<boolean> {
    const idx = experiences.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    googleReviewsCache.delete(id);
    experiences.splice(idx, 1);
    while (interestEvents.some((e) => e.experience_id === id)) {
      const i = interestEvents.findIndex((e) => e.experience_id === id);
      if (i !== -1) interestEvents.splice(i, 1);
    }
    while (viewEvents.some((e) => e.experience_id === id)) {
      const i = viewEvents.findIndex((e) => e.experience_id === id);
      if (i !== -1) viewEvents.splice(i, 1);
    }
    return true;
  },

  async getAdminUserByUsername(_username: string): Promise<{ id: string; username: string; password_hash: string } | null> {
    return null;
  },

  async getGoogleReviewsCache(experienceId: string): Promise<{ place_id: string; rating: number; user_ratings_total: number; reviews: unknown[]; fetched_at: string } | null> {
    const entry = googleReviewsCache.get(experienceId);
    if (!entry) return null;
    if (Date.now() - new Date(entry.fetched_at).getTime() > CACHE_TTL_MS) {
      googleReviewsCache.delete(experienceId);
      return null;
    }
    return entry;
  },

  async getGoogleReviewsCacheBatch(
    experienceIds: string[]
  ): Promise<Record<string, { rating: number; user_ratings_total: number; fetched_at: string }>> {
    const result: Record<string, { rating: number; user_ratings_total: number; fetched_at: string }> = {};
    for (const id of experienceIds) {
      const entry = await this.getGoogleReviewsCache(id);
      if (entry && entry.rating > 0) {
        result[id] = {
          rating: entry.rating,
          user_ratings_total: entry.user_ratings_total,
          fetched_at: entry.fetched_at,
        };
      }
    }
    return result;
  },

  async setGoogleReviewsCache(
    experienceId: string,
    placeId: string,
    rating: number | null,
    userRatingsTotal: number | null,
    reviews: unknown[]
  ): Promise<void> {
    googleReviewsCache.set(experienceId, {
      place_id: placeId,
      rating: rating ?? 0,
      user_ratings_total: userRatingsTotal ?? 0,
      reviews,
      fetched_at: new Date().toISOString(),
    });
  },

  async getSiteSetting(key: string): Promise<string | null> {
    return siteSettings.get(key) ?? null;
  },

  async setSiteSetting(key: string, value: string): Promise<void> {
    siteSettings.set(key, value);
  },
};
