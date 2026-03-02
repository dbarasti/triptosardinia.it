-- Add mock experiences based on local image names in public/media/experiences/exp-1/images/.
-- Run: psql $DATABASE_URL -f scripts/seed-mock-experiences-from-images.sql
-- Idempotent: uses ON CONFLICT (id) DO NOTHING so safe to run multiple times.

INSERT INTO experiences (
  id, slug, area_id, category_id, title_en, title_it,
  description_en, description_it, image_urls, duration_minutes, group_size_max,
  difficulty, location_name_en, location_name_it,
  provider_booking_url, provider_email, provider_phone, published
) VALUES
  (
    'exp-bouldering-outdoor',
    'bouldering-outdoor',
    'area-northern-sardinia',
    'cat-hiking',
    'Outdoor Bouldering',
    'Bouldering outdoor',
    'Climb sea-side boulders with spotters. Suitable for beginners and intermediate climbers.',
    'Arrampicata su massi in riva al mare con assicuratori. Adatto a principianti e intermedi.',
    '["media/experiences/exp-1/images/bouldering_outdoor1.jpeg","media/experiences/exp-1/images/bouldering_outdoor2.jpeg"]'::jsonb,
    180, 6, 'medium', 'Northern Sardinia', 'Sardegna settentrionale',
    NULL, NULL, NULL,
    true
  ),
  (
    'exp-coastal-trekking',
    'coastal-trekking',
    'area-northern-sardinia',
    'cat-hiking',
    'Coastal Trekking',
    'Trekking costiero',
    'Scenic coastal trails with sea views. Half-day or full-day hikes for all levels.',
    'Sentieri costieri con vista mare. Escursioni di mezza o intera giornata per tutti i livelli.',
    '["media/experiences/exp-1/images/trekking1.jpeg","media/experiences/exp-1/images/trekking2.jpeg","media/experiences/exp-1/images/trekking3.jpeg"]'::jsonb,
    300, 12, 'easy', 'Northern Sardinia', 'Sardegna settentrionale',
    NULL, NULL, NULL,
    true
  ),
  (
    'exp-kids-sailing',
    'kids-sailing',
    'area-northern-sardinia',
    'cat-kayaking',
    'Kids Sailing',
    'Vela per bambini',
    'Sailing introduction for families and kids. Calm waters and experienced guides.',
    'Introduzione alla vela per famiglie e bambini. Acque calme e guide esperte.',
    '["media/experiences/exp-1/images/kids_sailing1.jpeg","media/experiences/exp-1/images/sailing1.mp4"]'::jsonb,
    120, 8, 'easy', 'Northern Sardinia', 'Sardegna settentrionale',
    NULL, NULL, NULL,
    true
  ),
  (
    'exp-yoga-outdoor',
    'yoga-outdoor',
    'area-northern-sardinia',
    'cat-camping',
    'Outdoor Yoga',
    'Yoga outdoor',
    'Yoga sessions in nature by the coast. Morning or sunset classes for relaxation and flexibility.',
    'Sessioni di yoga in natura sulla costa. Lezioni al mattino o al tramonto per relax e flessibilità.',
    '["media/experiences/exp-1/images/yoga_outdoor.jpeg"]'::jsonb,
    90, 15, 'easy', 'Northern Sardinia', 'Sardegna settentrionale',
    NULL, NULL, NULL,
    true
  )
ON CONFLICT (id) DO NOTHING;
