// Data model: aligned with PRODUCT_AND_TECHNICAL_BRIEF §3
// Designed for Supabase Postgres; can use in-memory store for dev without env.

export type AreaSlug = string;
export type CategorySlug = string;

export interface Area {
  id: string;
  slug: AreaSlug;
  name_en: string;
  name_it: string;
  description_en?: string;
  description_it?: string;
}

export interface Category {
  id: string;
  slug: CategorySlug;
  name_en: string;
  name_it: string;
  icon?: string;
}

export interface Experience {
  id: string;
  slug: string;
  area_id: string;
  category_id: string;
  title_en: string;
  title_it: string;
  description_en: string;
  description_it: string;
  image_urls: string[];
  duration_minutes: number;
  group_size_max: number;
  difficulty?: string; // e.g. "easy" | "medium" | "hard"
  location_name_en?: string;
  location_name_it?: string;
  location_lat?: number;
  location_lng?: number;
  provider_booking_url?: string | null;
  provider_email?: string | null;
  provider_phone?: string | null;
  /** Google Maps or Business profile URL for reviews. Optional. */
  google_maps_url?: string | null;
  /** Resolved Google Place ID (optional; can be set after first fetch to avoid re-resolving URL). */
  google_place_id?: string | null;
  created_at: string;
  updated_at: string;
  published: boolean;
}

// dates_of_interest: list of dates (ISO date strings). Structure per brief §3.1 "TBD" — we use string[].
export interface InterestEvent {
  id: string;
  experience_id: string;
  party_size: number;
  dates_of_interest: string[]; // ISO date strings
  created_at: string;
  session_id?: string | null;
  email?: string | null;
  name?: string | null;
}

export interface ExperienceViewEvent {
  id: string;
  experience_id: string;
  session_id?: string | null;
  created_at: string;
}

export type Locale = 'en' | 'it';

/** Admin user for dashboard login; password_hash is bcrypt. */
export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
}

export const MAX_PARTY_SIZE = 20;
export const MAX_DATES_OF_INTEREST = 14;
