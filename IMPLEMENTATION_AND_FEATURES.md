# Trip to Sardinia — Implementation & Features (single reference)

This file documents what has been implemented from `PRODUCT_AND_TECHNICAL_BRIEF.md` and what was intentionally **not** implemented (open points or unclear specs). Use it as the single source of truth for scope and handover.

---

## 1. Implemented features

### 1.1 Product vision and flows

- **Discovery and interest-tracking** for the northern coast of Sardinia: no bookings or payments; users express interest and are shown provider link/contact.
- **Track interest**: every “I’m interested” is stored with `experience_id`, `party_size`, `dates_of_interest`, `created_at`, optional `session_id`, and optional `email`/`name` with consent.
- **Track user data**: page/experience views recorded; cookie/consent banner before non-essential cookies; behavior suitable for GDPR (consent, minimal data). No specific analytics tool integrated (see §2).
- **SEO**: server-rendered pages, semantic HTML, one `<h1>` per page, unique `<title>` and meta description per page and per experience, stable readable URLs.
- **Performance**: design supports caching (ISR/SSR), image optimization via Next.js `Image`, static assets cacheable; CDN and full Core Web Vitals tuning left to deployment.

### 1.2 Explorer (visitor) flow

- **Discover**: Home with hero, search bar, popular categories, trending/featured experiences. Search works across experiences, locations, and categories (full-text on titles/locations/category names).
- **Explore**: Experience detail page with carousel, description, key features (duration, group size, difficulty), location, reviews placeholder. Session-based **favorites** (save for later, no account). **Share**: each experience page has Open Graph meta (title, description, image, url, hreflang) for social previews.
- **Express interest**: Form with party size, dates of interest (comma/newline-separated YYYY-MM-DD), optional email/name with consent checkbox. Server-side validation (party size 1–20, at least one valid date, max 14 dates). **Honeypot** and **rate limiting** (per IP/session, 5 submissions per minute) to reduce spam/bots.
- **After submit**: Provider booking URL and/or contact (email, phone) shown on the same page; no automatic redirect. If an experience has **no** provider URL or contact, the CTA shows “Contact details coming soon” and the interest form is not offered (no misleading CTA).
- **301 redirects**: Not implemented as a dynamic map (e.g. old slug → new slug). Recommended: maintain a redirect table (e.g. in next.config `redirects` or middleware) when experiences are removed or slugs change; document rules in runbook.

### 1.3 Data model

- **Interest event**: `experience_id`, `party_size`, `dates_of_interest` (array of ISO date strings), `created_at`, optional `session_id`, optional `email`/`name` (with consent).
- **Geography/areas**: One area (northern Sardinia) at launch; data model and URLs support multiple areas (`areas` table / `area_id` on experiences; `/areas/[areaSlug]`, `/categories/[categorySlug]`).
- **Storage:** In-memory store in `src/lib/db-memory.ts` when `DATABASE_URL` is unset. When `DATABASE_URL` is set, `src/lib/db-pg.ts` (PostgreSQL via `pg`) is used; schema and seed in `scripts/schema.sql`. Works with any Postgres (local, Supabase direct connection, Neon, etc.).

### 1.4 SEO

- **Rendering**: Server-rendered or statically generated HTML; no SPA-only shell.
- **Structure**: One `<h1>` per page; logical headings; unique `<title>` and `<meta name="description">` per page and per experience.
- **URLs**: Lowercase, hyphenated slugs; e.g. `/en/experiences/northern-sardinia`, `/en/experiences/[slug]`.
- **Structured data**: JSON-LD `Product` on experience detail pages.
- **Sitemap & robots**: `sitemap.xml` and `robots.txt` generated; `robots` disallows `/api/` and `/admin/`.
- **Languages**: Two locales (en, it). Per-locale URLs (`/en/...`, `/it/...`), `hreflang` and `alternates.languages` in metadata on experience pages.

### 1.5 i18n (next-intl)

- **Locales**: English (en) and Italian (it). All UI strings and content have en/it in `src/i18n/messages/`.
- **Auto-adapt**: Locale from browser (Accept-Language) or saved preference (cookie/localStorage) via next-intl middleware; fallback to en.
- **Manual switch**: Language switcher in header (EN / IT); persists choice and navigates to same page in new locale.
- **SEO**: `hreflang` and per-locale URLs for indexing.

### 1.6 Admin (site owner)

- **Leads per experience**: Admin view lists leads (interest count) per listing.
- **Basic analytics**: Views per experience, interests over time (last 30 days), top experiences by interest count.
- **Export leads**: CSV export of all interest events (id, experience_id, experience_title_en, party_size, dates_of_interest, created_at, session_id, email, name) at `/api/leads/export`.
- **Manage experiences**: List of experiences and link to “edit” (edit form not fully wired to backend; see §1.7). No on-platform availability or pricing management.
- **Authentication**: Admin dashboard and leads export are protected by **username/password login** (NextAuth.js Credentials provider). Only authenticated admins can access `/[locale]/admin/*` and `/api/leads/export`. See §1.9 Admin auth strategy.

### 1.7 Design and tech stack

- **Design tokens**: Primary `#136dec`, background light `#f6f7f8`, background dark `#101822`; Tailwind; Plus Jakarta Sans (next/font); Material Symbols Outlined for icons.
- **Stack:** Next.js 14 (App Router), Tailwind CSS, next-intl, React Hook Form, PostgreSQL via `pg` when `DATABASE_URL` is set, else in-memory store.
- **Forms**: “I’m interested” uses React Hook Form and a server action; validation is server-side (party size, date format, max dates).
- **Abuse**: Rate limiting (per IP/session) and honeypot on the interest form; documented in this file.
- **Accessibility**: Focus states (focus-visible), semantic structure, keyboard navigation; alt text and ARIA where used. Full WCAG 2.1 AA audit not run.
- **Mobile**: Layout is responsive and mobile-first; key flows work on small viewports.

### 1.8 Key pages and routes

- **Home**: `/[locale]` — hero, search, categories, trending experiences.
- **Experiences list**: `/[locale]/experiences` — optional query `?q=` for search.
- **Experience detail**: `/[locale]/experiences/[slug]` — full content, OG meta, JSON-LD, **Google reviews** (when URL set), interest form or “Contact coming soon”.
- **Category / area**: `/[locale]/categories/[categorySlug]`, `/[locale]/areas/[areaSlug]`.
- **Favorites**: `/[locale]/favorites` — session-stored saved experiences.
- **Admin**: `/[locale]/admin`, `/admin/login`, `/admin/experiences`, `/admin/leads`, `/admin/analytics`, `/admin/experiences/[id]`, `/admin/experiences/new`.

### 1.9 Admin auth strategy

- **Requirement**: Admin area and leads export API are accessible only after login. Simple username/password with protection against attacks.
- **Implementation**:
  - **NextAuth.js v4** with Credentials provider; session stored in an encrypted JWT cookie (httpOnly, sameSite, secure in production).
  - **Admin users** stored in PostgreSQL table `admin_users` (id, username, password_hash). Passwords hashed with **bcrypt** (cost 12). No plain-text passwords.
  - **Login rate limiting**: Max 5 failed login attempts per IP per 15 minutes (in-memory; `src/lib/login-rate-limit.ts`). Generic “Invalid username or password” on failure (no user enumeration).
  - **Middleware**: Requests to `/(en|it)/admin` (except `.../admin/login`) require a valid session; else redirect to same-locale login. `/api/leads/export` without session returns 401.
  - **Login page**: `/[locale]/admin/login`; logout via “Sign out” in admin nav.
- **First admin**: Run schema, then `PASSWORD=yourPassword node --env-file=.env.local scripts/create-admin.mjs` (or `npm run create-admin` with env). **Environment**: `NEXTAUTH_SECRET` required (e.g. `openssl rand -base64 32`).

### 1.10 Google Maps reviews

- **When**: Shown on the experience detail page only if the experience has a **Google Maps / Business URL** (optional field in admin). If no URL is set, the section shows “Reviews (coming soon)”.
- **Data**: Experiences have optional `google_maps_url` and `google_place_id`. Place ID is resolved from the URL when possible (e.g. `place_id=ChIJ...` in the URL); otherwise only the “See reviews on Google” link is shown.
- **Backend**: `src/lib/google-reviews.ts` — uses **Google Places API (New) v1** (`GET https://places.googleapis.com/v1/places/{placeId}`) with field mask `rating,userRatingCount,reviews`. Requires **GOOGLE_PLACES_API_KEY**. Enable “Places API (New)” in Google Cloud. Responses are cached for 24 hours (DB table `experience_google_reviews` when using Postgres, or in-memory when not).
- **UX**: Rating summary (e.g. “4.5 · 12 reviews on Google”), up to 5 review snippets (author, stars, relative time, text), and “Reviews from Google” with link “See all reviews on Google” to the stored URL. If the API key is missing or the request fails, the link is still shown when a URL is set.
- **Admin**: Create/edit experience form includes “Google Maps / Business URL” (optional). No separate Place ID field; Place ID is extracted from the URL or left empty.

---

## 2. Not implemented / open points

- **Analytics tool**: Which product (Plausible, PostHog, GA4, etc.) is not decided. Cookie/consent banner and cookie documentation are in place; analytics script integration and consent gating are left for when the tool is chosen.
- **Admin auth**: ~~No login or session check.~~ Implemented: NextAuth Credentials, bcrypt, rate-limited login, middleware protection; see §1.9.
- **Full admin CRUD**: Create/edit experience form is only a stub; persistence is in-memory. Full create/edit/delete should be wired to Supabase (or chosen backend) and documented.
- **Lead notification**: Optional “email to provider or site owner when someone expresses interest” was not implemented; no email sending or webhook.
- **301 redirect map**: No dynamic redirect from old experience slugs to new ones or to fallback pages; to be added when slug changes/removals are defined (e.g. in next.config or middleware).
- **On-platform reviews**: Implemented via **Google Maps reviews** when a Google Maps/Business URL is set on the experience; see §1.10. Place ID is extracted from the URL; Google Places API (with key) fetches and caches reviews.

---

## 3. Cookies and scripts (for GDPR documentation)

- **ce_consent**: Stored in localStorage after user choice; values `all` or `essential`. Used to know whether to load optional analytics (when integrated).
- **ce_favorites**: Session-only; list of experience IDs saved for later. Not sent to server except implicitly when user visits an experience.
- **No third-party scripts** are currently loaded; when an analytics tool is added, document its cookies and scripts and gate on `ce_consent`.

---

## 4. Rate limiting and anti-bot

- **Interest form**: Rate limit of 5 submissions per minute per identifier (IP or session ID). Implemented in `src/lib/db-pg.ts` and `src/lib/db-memory.ts` (`checkRateLimit`).
- **Anti-bot**: Honeypot field (`honeypot`) in the form; hidden from users; if filled, submission is ignored.
- No CAPTCHA or Turnstile; can be added later and documented here.

---

## 5. How to run

- `npm install`
- `npm run dev` — dev server; in-memory data if `DATABASE_URL` is not set.
- **PostgreSQL:** Set `DATABASE_URL` (e.g. `postgresql://user:password@localhost:5432/coast_experience`). Run the schema once:
  ```bash
  psql "$DATABASE_URL" -f scripts/schema.sql
  ```
  Then start the app; it will use the `pg` client for all reads/writes. Works with any Postgres (local, Supabase direct connection, Neon, etc.).
- `npm run test` — runs Vitest tests (uses in-memory db when `DATABASE_URL` is unset).
- Set `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`) for admin login. Create first admin: `PASSWORD=yourPassword node --env-file=.env.local scripts/create-admin.mjs`.
- When ready: ~~add admin auth~~ (done; see §1.9).

---

*This file is the single reference for implemented vs non-implemented features. Update it when product decisions or scope change.*
