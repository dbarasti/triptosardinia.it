/**
 * Database layer: uses PostgreSQL when DATABASE_URL is set, otherwise in-memory.
 * Set DATABASE_URL for local Postgres or Supabase direct connection (e.g. postgresql://user:pass@host:5432/dbname).
 */
import { dbPg } from './db-pg';
import { dbMemory } from './db-memory';

const usePg = Boolean(process.env.DATABASE_URL);

export const db = usePg ? dbPg : dbMemory;
