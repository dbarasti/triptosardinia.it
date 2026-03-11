-- Add base price (in euro cents) to experiences.
-- Nullable: existing experiences have no price until set in the admin.
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS price_cents INTEGER;
