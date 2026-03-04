# Running migrations against production (Supabase)

This project uses the Supabase CLI to run database migrations against your production Supabase project.

## 1. Seed data and admin password

- **Schema migration** creates tables and seeds **areas** and **categories** only. No admin user is inserted.
- **Admin user**: Create it after the migration with the `create-admin` script. **Use a strong password in production** (e.g. generate one: `openssl rand -base64 24`).

  ```bash
  # Example: create admin with a generated password (save it somewhere safe)
  PASSWORD=$(openssl rand -base64 24) npm run create-admin
  # Or with .env: DATABASE_URL=... PASSWORD=your_strong_password npm run create-admin
  ```

## 2. Link the CLI to your production project

1. Get your **Project ref** from the Supabase dashboard: Project Settings → General → Reference ID.
2. Log in (if needed) and link:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

   When prompted for the database password, use the **database password** for your project (the one you set when creating the project, or from Project Settings → Database → Database password).

## 3. Push migrations to production

Run all pending migrations against the linked (production) database:

```bash
npx supabase db push
```

This applies `supabase/migrations/*.sql` in order. The initial migration creates tables and inserts areas/categories.

## 4. Create the admin user

Point `DATABASE_URL` at your **production** connection string (Session pooler recommended), then:

```bash
# With .env.production or env vars set to prod:
USERNAME=admin PASSWORD="your_strong_password" npm run create-admin
```

Or with a generated password (store it after running):

```bash
export PASSWORD=$(openssl rand -base64 24)
echo "Admin password: $PASSWORD"   # save this
npm run create-admin
```

## Optional: Run a one-off SQL file (e.g. mock experiences)

To run other scripts (e.g. `scripts/seed-mock-experiences-from-images.sql`) against prod, use the Supabase connection string with `psql`:

```bash
psql "$DATABASE_URL" -f scripts/seed-mock-experiences-from-images.sql
```

Or from Supabase dashboard: SQL Editor → paste and run.

## Adding new migrations later

1. Create a new file under `supabase/migrations/` with a timestamp prefix, e.g.:
   `supabase/migrations/20250305120000_add_some_feature.sql`
2. Run `npx supabase db push` again; only new migrations will be applied.
