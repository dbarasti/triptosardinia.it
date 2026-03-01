/**
 * Google Place reviews for experiences.
 * Uses Google Places API (New) v1: GET places/{placeId} with fields rating, userRatingCount, reviews.
 * Requires GOOGLE_PLACES_API_KEY. Cache TTL 24h (see db layer).
 */
import { db } from './db';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface GoogleReview {
  author_name: string;
  rating: number;
  relative_time_description?: string;
  time?: number;
  text?: string;
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

function mapReviewV1ToOurs(r: NonNullable<PlaceDetailsV1['reviews']>[number]): GoogleReview {
  const authorName = r.authorAttribution?.displayName ?? 'Anonymous';
  const text = r.text && typeof r.text === 'object' && 'text' in r.text ? (r.text as { text?: string }).text : undefined;
  return {
    author_name: authorName,
    rating: typeof r.rating === 'number' ? r.rating : 0,
    relative_time_description: r.relativePublishTimeDescription,
    text,
  };
}

/**
 * Fetch place details from Google Places API (New) v1.
 * Endpoint: GET https://places.googleapis.com/v1/places/{placeId}
 * Headers: X-Goog-Api-Key, X-Goog-FieldMask: rating,userRatingCount,reviews
 * Times out after 8s and returns null on network errors so the page still loads.
 */
const PLACES_FETCH_TIMEOUT_MS = 8000;

async function fetchPlaceDetails(placeId: string): Promise<{
  rating?: number;
  user_ratings_total?: number;
  reviews?: GoogleReview[];
} | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
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
      ? data.reviews.slice(0, 5).map(mapReviewV1ToOurs)
      : [];

    return {
      rating: data.rating,
      user_ratings_total: data.userRatingCount,
      reviews,
    };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Get reviews for an experience. Returns null if the experience has no Google URL/Place ID,
 * or if the API key is missing / request fails. Uses cache when valid.
 */
export async function getReviewsForExperience(experienceId: string): Promise<GoogleReviewsResult | null> {
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

  const cached = await db.getGoogleReviewsCache(experienceId);
  const now = Date.now();
  if (cached && now - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return {
      rating: cached.rating || null,
      user_ratings_total: cached.user_ratings_total || null,
      reviews: cached.reviews as GoogleReview[],
      google_maps_url: googleMapsUrl,
    };
  }

  const details = await fetchPlaceDetails(placeId);
  if (details) {
    const reviews = (details.reviews ?? []).slice(0, 5);
    await db.setGoogleReviewsCache(
      experienceId,
      placeId,
      details.rating ?? null,
      details.user_ratings_total ?? null,
      reviews
    );
    return {
      rating: details.rating ?? null,
      user_ratings_total: details.user_ratings_total ?? null,
      reviews,
      google_maps_url: googleMapsUrl,
    };
  }

  if (cached) {
    return {
      rating: cached.rating || null,
      user_ratings_total: cached.user_ratings_total || null,
      reviews: cached.reviews as GoogleReview[],
      google_maps_url: googleMapsUrl,
    };
  }

  return { rating: null, user_ratings_total: null, reviews: [], google_maps_url: googleMapsUrl };
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
