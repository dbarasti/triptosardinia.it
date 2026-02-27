/**
 * Tests for CoastExperience documented features:
 * - Interest event storage and validation
 * - Rate limiting on interest submissions
 * Uses in-memory db when DATABASE_URL is not set.
 */
import { db } from '@/lib/db';

describe('Interest submission', () => {
  it('stores interest with required fields', async () => {
    const before = (await db.getAllInterests()).length;
    const result = await db.addInterest(
      {
        experience_id: 'exp-1',
        party_size: 2,
        dates_of_interest: ['2025-06-15', '2025-06-16'],
        session_id: null,
        email: null,
        name: null,
      },
      'test-identifier-1'
    );
    expect(result.success).toBe(true);
    const after = (await db.getAllInterests()).length;
    expect(after).toBe(before + 1);
  });

  it('enforces rate limit after max submissions', async () => {
    const id = `rate-test-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const r = await db.addInterest(
        {
          experience_id: 'exp-1',
          party_size: 1,
          dates_of_interest: ['2025-06-15'],
          session_id: null,
          email: null,
          name: null,
        },
        id
      );
      expect(r.success).toBe(true);
    }
    const sixth = await db.addInterest(
      {
        experience_id: 'exp-1',
        party_size: 1,
        dates_of_interest: ['2025-06-16'],
        session_id: null,
        email: null,
        name: null,
      },
      id
    );
    expect(sixth.success).toBe(false);
    expect(sixth.error).toBe('rate_limit');
  });
});

describe('Experiences and search', () => {
  it('returns experiences for northern Sardinia area', async () => {
    const list = await db.getExperiences({ areaSlug: 'northern-sardinia' });
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.every((e) => e.area_id === 'area-northern-sardinia')).toBe(true);
  });

  it('filters by category slug', async () => {
    const list = await db.getExperiences({ categorySlug: 'kayaking' });
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.every((e) => e.category_id === 'cat-kayaking')).toBe(true);
  });

  it('filters by search query', async () => {
    const list = await db.getExperiences({ search: 'kayak' });
    expect(list.some((e) => e.title_en.toLowerCase().includes('kayak'))).toBe(true);
  });

  it('returns experience by slug', async () => {
    const exp = await db.getExperienceBySlug('blue-lagoon-kayaking');
    expect(exp).toBeDefined();
    expect(exp?.title_en).toBe('Blue Lagoon Kayaking');
  });

  it('returns undefined for unknown slug', async () => {
    const exp = await db.getExperienceBySlug('non-existent-slug');
    expect(exp).toBeUndefined();
  });
});
