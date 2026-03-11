/**
 * Google Place reviews for experiences.
 * Uses Google Places API (New) v1: GET places/{placeId} with fields rating, userRatingCount, reviews.
 * Requires GOOGLE_PLACES_API_KEY. Cache TTL 24h (see db layer).
 *
 * Reviews are fetched in both 'it' and 'en' and stored together in the cache, each tagged with
 * a `language` field. Callers pass their locale to receive only the matching reviews.
 */
import { db } from './db';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface GoogleReview {
  author_name: string;
  rating: number;
  relative_time_description?: string;
  time?: number;
  text?: string;
  language?: 'it' | 'en';
}

export interface GoogleReviewsResult {
  rating: number | null;
  user_ratings_total: number | null;
  reviews: GoogleReview[];
  google_maps_url: string | null;
}

/**
 * Try to extract a Google Place ID from a Maps or Business URL.
 * Supports place_id= / place_id: in query, and common ID prefixes (ChIJ, GhIJ) in path/query.
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Explicit place_id param (any value)
  const fromParam = trimmed.match(/[?&]place_id[:=]([^&\s#]+)/i);
  if (fromParam?.[1]) return decodeURIComponent(fromParam[1]).trim();

  // Standalone place ID: ChIJ or GhIJ prefix (common for businesses) + alphanumeric/underscore/hyphen
  const standalone = trimmed.match(/(ChIJ|GhIJ)[A-Za-z0-9_.-]{15,}/);
  if (standalone?.[0]) return standalone[0];
  return null;
}

/** New Places API (v1) Review and Place response shape. */
interface PlaceDetailsV1 {
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    name?: string;
    authorAttribution?: { displayName?: string };
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
  }>;
}

function mapReviewV1ToOurs(
  r: NonNullable<PlaceDetailsV1['reviews']>[number],
  language: 'it' | 'en'
): GoogleReview {
  const authorName = r.authorAttribution?.displayName ?? 'Anonymous';
  const text = r.text && typeof r.text === 'object' && 'text' in r.text ? (r.text as { text?: string }).text : undefined;
  return {
    author_name: authorName,
    rating: typeof r.rating === 'number' ? r.rating : 0,
    relative_time_description: r.relativePublishTimeDescription,
    text,
    language,
  };
}

const PLACES_FETCH_TIMEOUT_MS = 8000;

async function fetchPlaceDetailsForLang(
  placeId: string,
  language: 'it' | 'en',
  key: string
): Promise<{ rating?: number; user_ratings_total?: number; reviews: GoogleReview[] } | null> {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${language}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PLACES_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = (await res.json()) as PlaceDetailsV1;
    const reviews = Array.isArray(data.reviews)
      ? data.reviews.slice(0, 5).map((r) => mapReviewV1ToOurs(r, language))
      : [];
    return { rating: data.rating, user_ratings_total: data.userRatingCount, reviews };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Fetch place details in both 'it' and 'en' in parallel.
 * Returns merged reviews tagged with their language, plus the locale-independent rating.
 */
async function fetchPlaceDetails(placeId: string): Promise<{
  rating?: number;
  user_ratings_total?: number;
  reviews?: GoogleReview[];
} | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  const [itData, enData] = await Promise.all([
    fetchPlaceDetailsForLang(placeId, 'it', key),
    fetchPlaceDetailsForLang(placeId, 'en', key),
  ]);

  if (!itData && !enData) return null;

  const reviews = [
    ...(itData?.reviews ?? []),
    ...(enData?.reviews ?? []),
  ];

  return {
    rating: itData?.rating ?? enData?.rating,
    user_ratings_total: itData?.user_ratings_total ?? enData?.user_ratings_total,
    reviews,
  };
}

/** Filter cached reviews to only those matching the given locale, falling back to all if none match. */
function filterReviewsByLocale(reviews: GoogleReview[], locale?: string): GoogleReview[] {
  if (!locale) return reviews;
  const matched = reviews.filter((r) => !r.language || r.language === locale);
  // Fall back to all reviews if there are no tagged matches (e.g. old cache entries without language field)
  return matched.length > 0 ? matched : reviews;
}

/**
 * Get reviews for an experience, filtered to the given locale.
 * Returns null if the experience has no Google URL/Place ID,
 * or if the API key is missing / request fails. Uses cache when valid.
 */
export async function getReviewsForExperience(
  experienceId: string,
  locale?: string
): Promise<GoogleReviewsResult | null> {
  const exp = await db.getExperienceById(experienceId);
  if (!exp) return null;

  const googleMapsUrl = exp.google_maps_url?.trim() || null;
  let placeId = exp.google_place_id?.trim() || null;
  if (!placeId && googleMapsUrl) {
    placeId = extractPlaceIdFromUrl(googleMapsUrl);
  }

  if (!placeId && !googleMapsUrl) return null;

  if (!placeId) {
    return { rating: null, user_ratings_total: null, reviews: [], google_maps_url: googleMapsUrl };
  }

  const now = Date.now();

  // 1. Check by experience_id (fastest path — direct PK lookup)
  const cachedByExp = await db.getGoogleReviewsCache(experienceId);
  if (cachedByExp && now - new Date(cachedByExp.fetched_at).getTime() < CACHE_TTL_MS) {
    return {
      rating: cachedByExp.rating || null,
      user_ratings_total: cachedByExp.user_ratings_total || null,
      reviews: filterReviewsByLocale(cachedByExp.reviews as GoogleReview[], locale),
      google_maps_url: googleMapsUrl,
    };
  }

  // 2. Check by place_id — reuses cached data from another experience sharing the same place
  const cachedByPlace = await db.getGoogleReviewsCacheByPlaceId(placeId);
  if (cachedByPlace && now - new Date(cachedByPlace.fetched_at).getTime() < CACHE_TTL_MS) {
    await db.setGoogleReviewsCache(experienceId, placeId, cachedByPlace.rating, cachedByPlace.user_ratings_total, cachedByPlace.reviews);
    return {
      rating: cachedByPlace.rating || null,
      user_ratings_total: cachedByPlace.user_ratings_total || null,
      reviews: filterReviewsByLocale(cachedByPlace.reviews as GoogleReview[], locale),
      google_maps_url: googleMapsUrl,
    };
  }

  // 3. Fetch from API (both languages)
  const details = await fetchPlaceDetails(placeId);
  if (details) {
    const reviews = details.reviews ?? [];
    const rating = details.rating ?? null;
    const total = details.user_ratings_total ?? null;
    await db.setGoogleReviewsCache(experienceId, placeId, rating, total, reviews);
    return { rating, user_ratings_total: total, reviews: filterReviewsByLocale(reviews, locale), google_maps_url: googleMapsUrl };
  }

  // 4. Stale fallback if API failed
  const stale = cachedByExp ?? cachedByPlace;
  if (stale) {
    return {
      rating: stale.rating || null,
      user_ratings_total: stale.user_ratings_total || null,
      reviews: filterReviewsByLocale(stale.reviews as GoogleReview[], locale),
      google_maps_url: googleMapsUrl,
    };
  }

  return { rating: null, user_ratings_total: null, reviews: [], google_maps_url: googleMapsUrl };
}

/**
 * Get top-rated reviews from cache for homepage display, filtered to the given locale.
 */
export async function getHomepageReviews(
  locale?: string,
  limit = 6
): Promise<Array<{ author_name: string; rating: number; text: string; relative_time_description?: string }>> {
  try {
    const rows = await db.getTopReviewsFromCache(20);
    const allReviews: Array<{ author_name: string; rating: number; text: string; relative_time_description?: string }> = [];
    for (const row of rows) {
      const reviews = filterReviewsByLocale(row.reviews as GoogleReview[], locale);
      for (const r of reviews) {
        if (r.text && r.text.trim()) {
          allReviews.push({
            author_name: r.author_name,
            rating: r.rating,
            text: r.text.trim(),
            relative_time_description: r.relative_time_description,
          });
        }
      }
    }
    return allReviews.sort((a, b) => b.rating - a.rating).slice(0, limit);
  } catch {
    return [];
  }
}

/** Cache TTL for filtering batch results (same as getReviewsForExperience). */
const CACHE_TTL_MS_BATCH = 30 * 24 * 60 * 60 * 1000;

/**
 * Get review summary (rating + count) for multiple experiences from cache only (no API calls).
 * Use for list/card views. Only returns entries that are in cache and within TTL.
 */
export async function getReviewsSummaryForExperiences(
  experienceIds: string[]
): Promise<Record<string, { rating: number; user_ratings_total: number }>> {
  if (experienceIds.length === 0) return {};
  const batch = await db.getGoogleReviewsCacheBatch(experienceIds);
  const now = Date.now();
  const result: Record<string, { rating: number; user_ratings_total: number }> = {};
  for (const [id, entry] of Object.entries(batch)) {
    if (now - new Date(entry.fetched_at).getTime() < CACHE_TTL_MS_BATCH) {
      result[id] = { rating: entry.rating, user_ratings_total: entry.user_ratings_total };
    }
  }
  return result;
}
