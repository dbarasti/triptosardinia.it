-- Add Rentals category
INSERT INTO categories (id, slug, name_en, name_it, icon) VALUES
  ('cat-rentals', 'rentals', 'Rentals', 'Noleggi', 'car_rental')
ON CONFLICT (id) DO NOTHING;
