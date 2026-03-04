/**
 * One-time script to create the first admin user.
 * Usage: node --env-file=.env.local scripts/create-admin.mjs
 * Or: USERNAME=admin PASSWORD=yourpassword node --env-file=.env.local scripts/create-admin.mjs
 *
 * Production: use a strong password (e.g. generate with: openssl rand -base64 24).
 * Example: PASSWORD=$(openssl rand -base64 24) npm run create-admin
 *
 * Requires: DATABASE_URL and NEXTAUTH_SECRET set. Creates/updates admin_users table and inserts one user.
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const username = process.env.USERNAME ?? 'admin';
const password = process.env.PASSWORD ?? process.env.ADMIN_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error('Set PASSWORD or ADMIN_PASSWORD (min 8 characters; use a strong random password in production)');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const id = `admin-${Date.now()}`;
  const password_hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO admin_users (id, username, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [id, username, password_hash]
  );
  console.log(`Admin user "${username}" created/updated. Sign in at /en/admin/login or /it/admin/login`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
