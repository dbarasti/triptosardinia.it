/**
 * PostgreSQL data layer for CoastExperience.
 * Used when DATABASE_URL is set (local Postgres or Supabase direct connection).
 */
import { Pool } from 'pg';
import type { Area, Category, Experience, InterestEvent, ExperienceViewEvent } from './types';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(identifier: string): boolean {
  const key = `interest:${identifier}`;
  const now = Date.now();
  let timestamps = rateLimitMap.get(key) ?? [];
  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const globalForPool = globalThis as unknown as { _coastPgPool?: Pool };
  if (!globalForPool._coastPgPool) {
    globalForPool._coastPgPool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return globalForPool._coastPgPool;
}

function rowToArea(row: Record<string, unknown>): Area {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name_en: row.name_en as string,
    name_it: row.name_it as string,
    description_en: row.description_en as string | undefined,
    description_it: row.description_it as string | undefined,
  };
}

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name_en: row.name_en as string,
    name_it: row.name_it as string,
    icon: row.icon as string | undefined,
  };
}

function rowToExperience(row: Record<string, unknown>): Experience {
  const imageUrls = row.image_urls as unknown;
  return {
    id: row.id as string,
    slug: row.slug as string,
    area_id: row.area_id as string,
    category_id: row.category_id as string,
    title_en: row.title_en as string,
    title_it: row.title_it as string,
    description_en: row.description_en as string,
    description_it: row.description_it as string,
    image_urls: Array.isArray(imageUrls) ? imageUrls as string[] : (imageUrls ? JSON.parse(String(imageUrls)) : []),
    duration_minutes: Number(row.duration_minutes),
    group_size_max: Number(row.group_size_max),
    difficulty: row.difficulty as string | undefined,
    location_name_en: row.location_name_en as string | undefined,
    location_name_it: row.location_name_it as string | undefined,
    location_lat: row.location_lat != null ? Number(row.location_lat) : undefined,
    location_lng: row.location_lng != null ? Number(row.location_lng) : undefined,
    provider_booking_url: row.provider_booking_url as string | null | undefined,
    provider_email: row.provider_email as string | null | undefined,
    provider_phone: row.provider_phone as string | null | undefined,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    published: Boolean(row.published),
  };
}

function rowToInterestEvent(row: Record<string, unknown>): InterestEvent {
  const dates = row.dates_of_interest as unknown;
  return {
    id: row.id as string,
    experience_id: row.experience_id as string,
    party_size: Number(row.party_size),
    dates_of_interest: Array.isArray(dates) ? dates as string[] : (dates ? JSON.parse(String(dates)) : []),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    session_id: row.session_id as string | null | undefined,
    email: row.email as string | null | undefined,
    name: row.name as string | null | undefined,
  };
}

export const dbPg = {
  async getAreas(): Promise<Area[]> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM areas ORDER BY slug');
    return res.rows.map(rowToArea);
  },

  async getAreaBySlug(slug: string): Promise<Area | undefined> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM areas WHERE slug = $1', [slug]);
    return res.rows[0] ? rowToArea(res.rows[0]) : undefined;
  },

  async getCategories(): Promise<Category[]> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM categories ORDER BY slug');
    return res.rows.map(rowToCategory);
  },

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM categories WHERE slug = $1', [slug]);
    return res.rows[0] ? rowToCategory(res.rows[0]) : undefined;
  },

  async getExperiences(opts?: { areaSlug?: string; categorySlug?: string; search?: string }): Promise<Experience[]> {
    const pool = getPool();
    let query = `
      SELECT e.* FROM experiences e
      JOIN areas a ON e.area_id = a.id
      JOIN categories c ON e.category_id = c.id
      WHERE e.published = true
    `;
    const params: unknown[] = [];
    let n = 0;
    if (opts?.areaSlug) {
      n++;
      query += ` AND a.slug = $${n}`;
      params.push(opts.areaSlug);
    }
    if (opts?.categorySlug) {
      n++;
      query += ` AND c.slug = $${n}`;
      params.push(opts.categorySlug);
    }
    if (opts?.search?.trim()) {
      const q = `%${opts.search.trim().toLowerCase()}%`;
      n++;
      query += ` AND (
        LOWER(e.title_en) LIKE $${n} OR LOWER(e.title_it) LIKE $${n}
        OR LOWER(e.location_name_en) LIKE $${n} OR LOWER(e.location_name_it) LIKE $${n}
        OR LOWER(c.name_en) LIKE $${n} OR LOWER(c.name_it) LIKE $${n}
      )`;
      params.push(q);
    }
    query += ' ORDER BY e.updated_at DESC';
    const res = await pool.query(query, params);
    let list = res.rows.map(rowToExperience);
    if (opts?.search?.trim()) {
      const seen = new Set<string>();
      list = list.filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    }
    return list;
  },

  async getExperienceBySlug(slug: string): Promise<Experience | undefined> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM experiences WHERE slug = $1 AND published = true',
      [slug]
    );
    return res.rows[0] ? rowToExperience(res.rows[0]) : undefined;
  },

  async getExperienceById(id: string): Promise<Experience | undefined> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM experiences WHERE id = $1', [id]);
    return res.rows[0] ? rowToExperience(res.rows[0]) : undefined;
  },

  async addInterest(
    event: Omit<InterestEvent, 'id' | 'created_at'>,
    ipOrSessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!checkRateLimit(ipOrSessionId)) {
      return { success: false, error: 'rate_limit' };
    }
    const id = `int-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const pool = getPool();
    await pool.query(
      `INSERT INTO interest_events (id, experience_id, party_size, dates_of_interest, session_id, email, name)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
      [
        id,
        event.experience_id,
        event.party_size,
        JSON.stringify(event.dates_of_interest),
        event.session_id ?? null,
        event.email ?? null,
        event.name ?? null,
      ]
    );
    return { success: true };
  },

  async getInterestsByExperience(experienceId: string): Promise<InterestEvent[]> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT * FROM interest_events WHERE experience_id = $1 ORDER BY created_at DESC',
      [experienceId]
    );
    return res.rows.map(rowToInterestEvent);
  },

  async getAllInterests(): Promise<InterestEvent[]> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM interest_events ORDER BY created_at DESC');
    return res.rows.map(rowToInterestEvent);
  },

  async recordView(experienceId: string, sessionId?: string): Promise<void> {
    const id = `view-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const pool = getPool();
    await pool.query(
      'INSERT INTO experience_view_events (id, experience_id, session_id) VALUES ($1, $2, $3)',
      [id, experienceId, sessionId ?? null]
    );
  },

  async getViewCountByExperience(experienceId: string): Promise<number> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT COUNT(*)::int AS count FROM experience_view_events WHERE experience_id = $1',
      [experienceId]
    );
    return res.rows[0]?.count ?? 0;
  },

  async getInterestsOverTime(days: number): Promise<{ date: string; count: number }[]> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT DATE(created_at) AS date, COUNT(*)::int AS count
       FROM interest_events
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [days]
    );
    return res.rows.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
      count: r.count,
    }));
  },

  async getTopExperiencesByInterest(limit: number): Promise<{ experience_id: string; count: number }[]> {
    const pool = getPool();
    const res = await pool.query(
      `SELECT experience_id, COUNT(*)::int AS count
       FROM interest_events
       GROUP BY experience_id
       ORDER BY count DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows.map((r) => ({ experience_id: r.experience_id, count: r.count }));
  },

  async getAllExperiencesForAdmin(): Promise<Experience[]> {
    const pool = getPool();
    const res = await pool.query('SELECT * FROM experiences ORDER BY updated_at DESC');
    return res.rows.map(rowToExperience);
  },

  async updateExperience(id: string, data: Partial<Experience>): Promise<Experience | null> {
    const pool = getPool();
    const existing = await this.getExperienceById(id);
    if (!existing) return null;
    const updates: string[] = [];
    const values: unknown[] = [];
    let n = 0;
    const allowed = [
      'slug', 'area_id', 'category_id', 'title_en', 'title_it', 'description_en', 'description_it',
      'image_urls', 'duration_minutes', 'group_size_max', 'difficulty',
      'location_name_en', 'location_name_it', 'location_lat', 'location_lng',
      'provider_booking_url', 'provider_email', 'provider_phone', 'published',
    ] as const;
    for (const key of allowed) {
      const v = data[key];
      if (v === undefined) continue;
      n++;
      if (key === 'image_urls') {
        updates.push(`image_urls = $${n}::jsonb`);
        values.push(JSON.stringify(v));
      } else {
        updates.push(`${key} = $${n}`);
        values.push(v);
      }
    }
    if (updates.length === 0) return existing;
    n++;
    updates.push(`updated_at = NOW()`);
    values.push(id);
    await pool.query(
      `UPDATE experiences SET ${updates.join(', ')} WHERE id = $${n}`,
      values
    );
    const updated = await this.getExperienceById(id);
    return updated ?? null;
  },

  async createExperience(data: Omit<Experience, 'id' | 'created_at' | 'updated_at'>): Promise<Experience> {
    const id = `exp-${Date.now()}`;
    const pool = getPool();
    await pool.query(
      `INSERT INTO experiences (
        id, slug, area_id, category_id, title_en, title_it, description_en, description_it,
        image_urls, duration_minutes, group_size_max, difficulty,
        location_name_en, location_name_it, location_lat, location_lng,
        provider_booking_url, provider_email, provider_phone, published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        id,
        data.slug,
        data.area_id,
        data.category_id,
        data.title_en,
        data.title_it,
        data.description_en,
        data.description_it,
        JSON.stringify(data.image_urls),
        data.duration_minutes,
        data.group_size_max,
        data.difficulty ?? null,
        data.location_name_en ?? null,
        data.location_name_it ?? null,
        data.location_lat ?? null,
        data.location_lng ?? null,
        data.provider_booking_url ?? null,
        data.provider_email ?? null,
        data.provider_phone ?? null,
        data.published,
      ]
    );
    const exp = await this.getExperienceById(id);
    if (!exp) throw new Error('Failed to read created experience');
    return exp;
  },

  async deleteExperience(id: string): Promise<boolean> {
    const pool = getPool();
    await pool.query('DELETE FROM interest_events WHERE experience_id = $1', [id]);
    await pool.query('DELETE FROM experience_view_events WHERE experience_id = $1', [id]);
    const res = await pool.query('DELETE FROM experiences WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async getAdminUserByUsername(username: string): Promise<{ id: string; username: string; password_hash: string } | null> {
    const pool = getPool();
    const res = await pool.query(
      'SELECT id, username, password_hash FROM admin_users WHERE username = $1',
      [username]
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id as string,
      username: row.username as string,
      password_hash: row.password_hash as string,
    };
  },
};
