#!/usr/bin/env bash
# Test Google Places API (New) v1 with curl.
# Usage:
#   ./scripts/test-google-places-curl.sh [PLACE_ID]
#   GOOGLE_PLACES_API_KEY=your_key ./scripts/test-google-places-curl.sh [PLACE_ID]
#
# Place ID defaults to Google HQ (ChIJj61dQgK6j4AR4GeTYWZsKWw) if not set.
# Loads GOOGLE_PLACES_API_KEY from .env.local if not in the environment.

set -e

PLACE_ID="${1:-ChIJj61dQgK6j4AR4GeTYWZsKWw}"

if [ -z "$GOOGLE_PLACES_API_KEY" ] && [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [ -z "$GOOGLE_PLACES_API_KEY" ]; then
  echo "Error: GOOGLE_PLACES_API_KEY not set. Set it in .env.local or pass it:"
  echo "  GOOGLE_PLACES_API_KEY=your_key $0 $PLACE_ID"
  exit 1
fi

echo "Testing Places API for place_id=$PLACE_ID"
echo "---"
curl -s -S -w "\n\nHTTP %{http_code}\n" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
  -H "X-Goog-FieldMask: id,displayName,rating,userRatingCount,reviews" \
  "https://places.googleapis.com/v1/places/${PLACE_ID}" | head -100
