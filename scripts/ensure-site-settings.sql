-- Create site_settings table if it doesn't exist (e.g. for existing DBs created before hero image setting).
-- Run: psql $DATABASE_URL -f scripts/ensure-site-settings.sql

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
