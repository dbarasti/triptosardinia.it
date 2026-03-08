-- Allow cache lookups by place_id so multiple experiences sharing the same
-- Google Place reuse a single cached result without an extra API call.
CREATE INDEX IF NOT EXISTS idx_experience_google_reviews_place_id ON experience_google_reviews(place_id);
