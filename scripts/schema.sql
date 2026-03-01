-- CoastExperience PostgreSQL schema
-- Run this against your local (or Supabase) Postgres to create tables and seed data.
-- Usage: psql $DATABASE_URL -f scripts/schema.sql

-- Extensions (optional; enable if you need gen_random_uuid())
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Areas (geography: northern Sardinia, etc.)
CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_it TEXT NOT NULL,
  description_en TEXT,
  description_it TEXT
);

-- Categories (hiking, diving, kayaking, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_it TEXT NOT NULL,
  icon TEXT
);

-- Experiences
CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  area_id TEXT NOT NULL REFERENCES areas(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  title_en TEXT NOT NULL,
  title_it TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_it TEXT NOT NULL,
  image_urls JSONB NOT NULL DEFAULT '[]',
  duration_minutes INTEGER NOT NULL,
  group_size_max INTEGER NOT NULL,
  difficulty TEXT,
  location_name_en TEXT,
  location_name_it TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  provider_booking_url TEXT,
  provider_email TEXT,
  provider_phone TEXT,
  google_maps_url TEXT,
  google_place_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(slug)
);

-- Optional: for existing DBs that were created before google_maps_url was added
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS google_place_id TEXT;

CREATE INDEX IF NOT EXISTS idx_experiences_slug ON experiences(slug);
CREATE INDEX IF NOT EXISTS idx_experiences_area ON experiences(area_id);
CREATE INDEX IF NOT EXISTS idx_experiences_category ON experiences(category_id);
CREATE INDEX IF NOT EXISTS idx_experiences_published ON experiences(published);

-- Interest events ("I'm interested" submissions)
CREATE TABLE IF NOT EXISTS interest_events (
  id TEXT PRIMARY KEY,
  experience_id TEXT NOT NULL REFERENCES experiences(id),
  party_size INTEGER NOT NULL,
  dates_of_interest JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  email TEXT,
  name TEXT
);

CREATE INDEX IF NOT EXISTS idx_interest_events_experience ON interest_events(experience_id);
CREATE INDEX IF NOT EXISTS idx_interest_events_created ON interest_events(created_at);

-- View events (for analytics)
CREATE TABLE IF NOT EXISTS experience_view_events (
  id TEXT PRIMARY KEY,
  experience_id TEXT NOT NULL REFERENCES experiences(id),
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_view_events_experience ON experience_view_events(experience_id);

-- Admin users (for dashboard login; passwords hashed with bcrypt)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Cache for Google Place reviews (TTL ~24–72h per Google ToS)
CREATE TABLE IF NOT EXISTS experience_google_reviews (
  experience_id TEXT PRIMARY KEY REFERENCES experiences(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  rating DOUBLE PRECISION,
  user_ratings_total INTEGER,
  reviews JSONB NOT NULL DEFAULT '[]',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data (idempotent: insert only if tables are empty)
INSERT INTO areas (id, slug, name_en, name_it, description_en, description_it)
VALUES (
  'area-northern-sardinia',
  'northern-sardinia',
  'Northern Sardinia',
  'Sardegna settentrionale',
  'Discover experiences along the northern coast of Sardinia.',
  'Scopri le esperienze lungo la costa settentrionale della Sardegna.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, slug, name_en, name_it, icon) VALUES
  ('cat-hiking', 'hiking', 'Hiking', 'Escursionismo', 'landscape'),
  ('cat-diving', 'diving', 'Diving', 'Immersioni', 'scuba_diving'),
  ('cat-kayaking', 'kayaking', 'Kayaking', 'Kayak', 'kayaking'),
  ('cat-surfing', 'surfing', 'Surfing', 'Surf', 'surfing'),
  ('cat-camping', 'camping', 'Camping', 'Campeggio', 'camping')
ON CONFLICT (id) DO NOTHING;

INSERT INTO experiences (
  id, slug, area_id, category_id, title_en, title_it,
  description_en, description_it, image_urls, duration_minutes, group_size_max,
  difficulty, location_name_en, location_name_it,
  provider_booking_url, provider_email, provider_phone, published
) VALUES
  (
    'exp-1',
    'blue-lagoon-kayaking',
    'area-northern-sardinia',
    'cat-kayaking',
    'Blue Lagoon Kayaking',
    'Kayak nella Laguna Blu',
    'Kayak in crystal-clear waters along the northern coast. Half-day adventure with local guide.',
    'Kayak nelle acque cristalline lungo la costa settentrionale. Avventura di mezza giornata con guida locale.',
    '["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800","https://images.unsplash.com/photo-1573790387438-4da905039392?w=800"]'::jsonb,
    240, 10, 'medium', 'Costa Smeralda', 'Costa Smeralda',
    'https://example-provider.com/kayak', 'book@example-provider.com', '+39 123 456 7890',
    true
  ),
  (
    'exp-2',
    'stintino-diving',
    'area-northern-sardinia',
    'cat-diving',
    'Stintino Diving Experience',
    'Esperienza subacquea a Stintino',
    'Dive in the marine protected area. Suitable for certified divers.',
    'Immersione nell''area marina protetta. Adatto a subacquei certificati.',
    '["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"]'::jsonb,
    360, 8, 'medium', 'Stintino', 'Stintino',
    'https://example-diving.com', NULL, NULL,
    true
  ),
  (
    'exp-3',
    'contact-coming-soon',
    'area-northern-sardinia',
    'cat-hiking',
    'Mountain Hike (Contact coming soon)',
    'Escursione in montagna (Contatti in arrivo)',
    'Scenic hike. Provider contact details coming soon.',
    'Escursione panoramica. Dettagli contatto fornitore in arrivo.',
    '["https://images.unsplash.com/photo-1551632811-561732d1e306?w=800"]'::jsonb,
    480, 12, NULL, NULL, NULL,
    NULL, NULL, NULL,
    true
  )
ON CONFLICT (id) DO NOTHING;
