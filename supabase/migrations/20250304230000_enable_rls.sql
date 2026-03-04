-- Enable Row Level Security (RLS) on all tables so the Supabase Data API
-- (anon key) cannot access data. The app uses DATABASE_URL (direct Postgres)
-- and service role for Storage, so it is not affected.

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_google_reviews ENABLE ROW LEVEL SECURITY;

-- No policies are created: anon and authenticated roles get no access.
-- Direct connections (DATABASE_URL) and service_role bypass RLS.
