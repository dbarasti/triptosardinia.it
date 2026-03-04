import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// New dashboard: "Secret key". Legacy: "Service role" key. Both work for server-side Storage.
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only Supabase client (full access). Use in Server Actions and API routes.
 * Only for Storage (and optionally Auth); DB continues to use pg.
 */
export function getSupabaseServer() {
  if (!supabaseUrl || !supabaseSecretKey) return null;
  return createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false } });
}
