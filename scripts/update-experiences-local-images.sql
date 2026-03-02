-- Update existing experiences to use local media paths instead of internet URLs.
-- Run once against your local DB: psql $DATABASE_URL -f scripts/update-experiences-local-images.sql

UPDATE experiences SET image_urls = '["media/experiences/exp-1/images/kids_sailing1.jpeg","media/experiences/exp-1/images/sailing1.mp4","media/experiences/exp-1/images/bouldering_outdoor1.jpeg"]'::jsonb
WHERE id = 'exp-1';

UPDATE experiences SET image_urls = '["media/experiences/exp-1/images/kids_sailing1.jpeg"]'::jsonb
WHERE id = 'exp-2';

UPDATE experiences SET image_urls = '["media/experiences/exp-1/images/trekking1.jpeg","media/experiences/exp-1/images/yoga_outdoor.jpeg"]'::jsonb
WHERE id = 'exp-3';
