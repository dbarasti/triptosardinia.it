# Trip to Sardinia — Product & Technical Brief for Agents

**Version:** 1.1  
**Last updated:** February 2026  
**Purpose:** Single source of truth for AI agents and developers building Trip to Sardinia. Read this before making changes.

---

## 1. Product vision

Trip to Sardinia is a **discovery and interest-tracking** product for the **northern coast of Sardinia**. It helps tourists and visitors find experiences and adventures, express interest (party size + dates), and then book **directly with the activity provider** (their website or contact). The platform does **not** process bookings or payments.

**Four main focuses (in order of importance):**

1. **Track interest** — Capture and store every “I’m interested” (experience, number of people, dates of interest) for analytics and lead insight.
2. **Track user data** — Understand user behavior (pages viewed, funnel, optionally identity) in a **GDPR-compliant** way (Italy/EU).
3. **Very good SEO** — Rank well for queries like “experiences northern Sardinia”, “kayaking Sardinia”, etc. Content must be crawlable, semantic, and fast.
4. **Very fast website** — Use every available technology and tool for optimization: caching (page, API, static assets), image caching and image optimization, CDN, and minimal payloads. Speed is a first-class requirement.

**Languages:** The website is **multilingual**. We start with **English** and **Italian** only. The UI must (1) **automatically adapt** to the user's preference (e.g. browser language or saved preference) and (2) offer a **manual language switcher** so users can change language at any time. All copy (UI strings and content) must exist in both locales.

### 1.1 Success metrics

- **North Star:** Interest submissions per month (or per period). This is the primary measure of product success.
- **Supporting metrics:** SEO rankings for target keywords (e.g. “experiences northern Sardinia”, “kayaking Sardinia”); Core Web Vitals (LCP, INP, CLS); interest-to-provider-click rate; interests per experience (for content and listing quality). Measure these from launch and treat regressions as bugs.

### 1.2 Content ownership and freshness

- **Owner:** The site owner is responsible for experience descriptions, area/category copy, and meta descriptions. Content must be unique and of good quality (no generic templates only).
- **Cadence:** Define a review/update cadence for listings and key pages so content stays accurate and SEO-effective. Document it in the admin or runbook.

---

## 2. User flows

### 2.1 Explorer (visitor) flow

1. **Discover** — Land on the site (or a category/area page), browse experiences by category (e.g. Hiking, Diving, Kayaking) and/or location. **Search** works across **experiences**, **locations**, and **categories** (full-text and/or filters as implemented).
2. **Explore** — Open an experience detail page (description, photos, location, duration, provider info). Users can **save favorites for later** in the same session (session-based “save”; no account required). **Share:** each experience page supports sharing (e.g. share URL, Open Graph meta tags for social previews).
3. **Express interest** — Submit:
   - **Number of people** (party size)
   - **Dates of interest** (when they want to do the experience)
   - **Optional:** email (and optionally name) with explicit consent — for follow-up, sending provider link, or passing leads to providers. If collected, document legal basis and consent text; store only with consent. Phased rollout is acceptable (e.g. optional email in v1).
4. **Redirect to provider** — After submit, **show the provider’s booking URL and/or contact information** (phone, email) on the same page so the user can book on the provider’s side. We do **not** redirect automatically; we surface the link and contact so they can use it. **Edge case:** If an experience has no provider URL or contact, do not show “I’m interested” as a booking path; show a clear message (e.g. “Contact details coming soon” or hide the CTA) so users are not misled.
5. **Form validation and resilience** — Validate interest form server-side (e.g. date format, max party size, required fields). When an experience is removed or its slug changes, use **301 redirects** from old URLs to the new URL or to a sensible landing page (category/area or home) to avoid dead or duplicate content; document redirect rules for SEO.

### 2.2 What we do NOT do

- We do **not** handle payments.
- We do **not** confirm availability or reservations.
- We do **not** replace the provider’s booking system — we send users to it.
- We do **not** host on-platform reviews at launch. **Future phase:** we plan to add reviews sourced from Google (e.g. aggregate rating, link to Google). The experience-detail mockup’s “reviews” block is a placeholder for that; do not implement on-platform review submission or storage for now.

### 2.3 Admin (site owner)

- The **owner of the website** handles all experience listings. There is **no host dashboard** (activity owners do not self-serve). There is an **admin dashboard** for the site owner to create, edit, and manage listings. Use the existing “Manage experiences” / “Create experience” mockups only as UI reference for this admin flow; we do not need on-platform availability or pricing management for providers.
- **Authentication:** Only the site owner has an account. Admin access is via the chosen auth (e.g. Supabase Auth, magic link); no provider accounts in v1.
- **Admin analytics and leads:** The admin view must include **leads per experience** (interest count per listing). In addition, provide basic **admin analytics**: views per experience, interests over time, top experiences. The site owner must be able to **export leads** (e.g. CSV) for their own use and/or to pass to providers. Optionally, support **lead notification** (e.g. email to provider or to site owner when someone expresses interest); if implemented, document how and with what consent.

---

## 3. Data model (core)

### 3.1 Interest event (required)

Every “I’m interested” submission must persist:

| Field            | Type        | Notes                                      |
|-----------------|------------|--------------------------------------------|
| `experience_id` | reference  | Which experience                            |
| `party_size`    | number     | Number of people                           |
| `dates_of_interest` | list/dates | Dates user is interested in (structure TBD) |
| `created_at`    | timestamp  | Server-side                                |
| `session_id`    | string     | Optional; for linking to analytics         |

Optional (with consent and legal basis when introduced):

- `email`, `name` — e.g. for passing leads to providers, follow-up, or “send me the provider link”. Only store with explicit consent; document purpose and consent text. Phased rollout (e.g. optional in v1) is acceptable.
- `user_id` if we have authenticated users later.

### 3.2 User/behavior tracking (for “track user data”)

- **Analytics events:** page views, experience views, clicks (e.g. “Book on provider site”), funnel steps. Prefer consent-aware (e.g. after cookie/consent banner).
- **Consent and cookies:** Implement a **cookie/consent banner** before setting non-essential cookies or analytics. Document which cookies and scripts are used, for what purpose, and how consent is stored. Align with GDPR (purpose, consent, minimal data).
- **Identity:** Session-based by default; optional email/identifier only if needed and documented; must be GDPR-compliant (purpose, consent, minimal data).
- **Storage:** Either your analytics platform (e.g. GA4, Plausible, etc.) and/or your own backend for interest events. Do not store PII without a clear legal basis and consent.

### 3.3 Geography / areas

Launch with **one area** (northern Sardinia). Design for **multiple areas** from the start: e.g. an `areas` table or `area_id` on experiences, and URL/filter structure that supports per-area listing so more areas can be added later without a schema or URL redesign.

---

## 4. SEO requirements (non-negotiable)

- **Server-rendered or statically generated HTML** — No SPA-only shell. Crawlers must receive full content in the initial response.
- **Semantic structure** — One clear `<h1>` per page; logical `<h2>`/`<h3>`; meaningful `<title>` and `<meta name="description">` per page (especially per experience and per category/area).
- **Stable, readable URLs** — e.g. `/experiences/northern-sardinia`, `/experiences/[slug]`. Prefer lowercase, hyphenated, meaningful slugs. When an experience is removed or its slug changes, serve **301 redirects** from old URLs to the new URL or to a sensible fallback (e.g. category/area or home) so crawlers and users do not hit dead or duplicate pages.
- **Structured data** — Use schema.org where it fits (e.g. `Event`, `Product`, or `LocalBusiness` for experiences). Validate with Google’s Rich Results Test.
- **Performance** — Fast LCP, good Core Web Vitals. Optimize images (format, size, lazy-load where appropriate). See **§4.1 Performance, caching & image optimization** for mandatory practices.
- **Sitemap & robots** — Provide `sitemap.xml` and a sensible `robots.txt`.
- **Languages** — Two locales: **English (en)** and **Italian (it)**. Use `hreflang` and per-locale URLs (e.g. `/en/...`, `/it/...`). Each locale must have its own crawlable, semantic pages so both languages are indexed.

### 4.1 Performance, caching & image optimization (mandatory)

The site must be **very fast**. Use every appropriate technology for optimization.

**Caching**

- **Page/route caching:** Use framework and host features (e.g. Next.js `revalidate`, ISR, or Astro static build) so that HTML and data are cached at the edge or origin. Set long cache for static/listings where content is stable.
- **API/backend caching:** Cache responses from any CMS or API that serves experience data (e.g. short TTL for lists, longer for individual experience pages if they change rarely). Use `Cache-Control` headers.
- **Static assets:** JS, CSS, fonts — immutable filenames (e.g. content hash), long-lived `Cache-Control` (e.g. `public, max-age=31536000, immutable`). Serve from CDN when possible.
- **CDN:** Serve the site and static assets from a CDN (e.g. Vercel Edge, Cloudflare, Netlify Edge) for low latency and caching at the edge.

**Images**

- **Image optimization:** Use a proper image pipeline: modern formats (WebP/AVIF where supported), responsive sizes (srcset), and compressed quality. Prefer framework/host image components (e.g. Next.js `Image`, Astro's image integration, or a dedicated image CDN).
- **Image caching:** Serve images via CDN with long cache headers (e.g. immutable, 1 year). Use stable URLs or content-addressed URLs so cache stays valid.
- **Lazy loading:** Lazy-load images below the fold (`loading="lazy"` or equivalent). Avoid loading large hero/carousel images until needed.
- **Dimensions:** Always set `width` and `height` (or aspect-ratio) to avoid layout shift (CLS).

**Other**

- **Fonts:** Load with `display=swap`, subset when possible, and prefer self-host or a fast font provider. Avoid render-blocking font loads.
- **JS/CSS:** Minimize main-thread work. Code-split and lazy-load non-critical JS. Keep above-the-fold CSS minimal and defer or inline critical CSS where it helps.
- **Measure:** Use Lighthouse and Core Web Vitals (LCP, INP/CLS) in CI or before release; treat regressions as bugs.

**Abuse and spam prevention**

- **Interest form:** Apply **rate limiting** (e.g. per IP or per session) to the “I’m interested” submission endpoint to prevent spam and bots. Consider a lightweight **anti-bot** measure (e.g. honeypot field or Turnstile/CAPTCHA alternative) before launch; document the choice.

**Accessibility**

- **Requirement:** The UI must meet **WCAG 2.1 Level AA** where feasible: focus states, meaningful alt text for images, semantic structure (already aligned with SEO), keyboard navigation, and screen-reader-friendly markup. Treat accessibility as a shipping requirement.

**Mobile and responsive**

- The site must be **mobile-first and fully responsive**. All key flows (discover, explore, express interest) must work well on small screens; test on real devices and viewports.

### 4.2 Multilanguage (i18n)

- **Locales:** **English (en)** and **Italian (it)** only for launch. All UI strings and content must have both en and it copy.
- **Auto-adapt:** On first visit, set locale from browser `Accept-Language` if en or it; otherwise fallback (e.g. en). If user has a saved preference (cookie/localStorage), use that so repeat visitors keep their choice.
- **Manual switch:** Provide a language switcher (header/footer) to switch between en and it. Persist choice after switch; if using locale in URL, navigate to same page in new locale.
- **SEO:** Use hreflang and per-locale URLs so both languages are indexed.

---

## 5. Technical guidelines for implementation

### 5.1 Tech stack (recommended and alternatives)

Use this as the default stack. Alternatives are listed where relevant.

| Layer | Recommended | Alternatives / notes |
|-------|-------------|----------------------|
| **Framework** | **Next.js** (App Router) — SSR/SSG, built-in image optimization, server actions for interest form, excellent SEO and Vercel integration. | **Astro** (if content is mostly static and you want minimal JS). **Nuxt** (if you prefer Vue). |
| **Hosting + CDN** | **Vercel** — Edge network, automatic image optimization, serverless, great DX with Next.js. | **Netlify**, **Cloudflare Pages** — also support edge, static/SSR, and image transforms. |
| **Database / backend** | **Supabase** — Postgres for experiences + interest events, optional auth, Row Level Security, REST/Realtime. | **Vercel Postgres**, **Firebase**, **PlanetScale**, or custom API + any DB. |
| **Styling** | **Tailwind CSS** — already in mockups; purge in production, optional critical CSS. | Keep Tailwind; do not switch without reason. |
| **Images** | **Next.js `Image`** (on Vercel: automatic WebP/AVIF, srcset, caching). Or **Cloudinary** / **imgix** for framework-agnostic pipeline. | Serve via CDN with long cache; always optimize format and size. |
| **Analytics** | **Vercel Analytics** (Web Vitals). For behavior: **Plausible** or **PostHog** (GDPR-friendly, consent-first). | **GA4** if needed; ensure consent banner. |
| **Monitoring** | **Vercel Speed Insights** (Core Web Vitals). **Sentry** (errors, optional). | Any RUM + error tracking that respects privacy. |
| **Fonts** | **Plus Jakarta Sans** / **Manrope** (from mockups). Load via `next/font` (Next) or self-host with `display=swap` and subset. | Google Fonts is fine if optimized; self-host is slightly faster. |
| **i18n** | **next-intl** (Next.js). **Required.** Locales: **en**, **it**. Auto-detect from browser or saved preference; manual language switcher in UI; persist choice. Use hreflang and per-locale URLs for SEO. |
| **Forms** | **React Hook Form** (Next) or native form + Server Action / API route that writes to Supabase. | Keep the "I'm interested" form simple; validate server-side. |

**Summary:** Next.js + Vercel + Supabase + Tailwind is the recommended default. It gives SSR/SSG, edge caching, image optimization, and a single backend for experiences and interest events. Add Plausible or PostHog for analytics and Vercel Speed Insights for performance monitoring.

### 5.2 Existing assets in this repo

- **Location:** `stitch_experience_pricing_and_availability/` (HTML only).
- **Contents:** Five static HTML mockups:
  - `explorer_home_variant_1/code.html` — Explorer home (hero, search, categories, trending cards).
  - `experience_detail_view_v2/code.html` — Experience detail (carousel, features, location, reviews placeholder for future Google reviews, CTA).
  - `manage_all_experiences/code.html` — List of experiences (host-side).
  - `create_new_experience/code.html` — Create experience form (Step 1 — basic info).
  - `experience_pricing_and_availability/code.html` — Pricing & availability (host-side).
- **Use:** Treat as **UI/UX reference and design system** (layout, components, primary color `#136dec`, light/dark). Do **not** copy client-only patterns that harm SEO; reimplement with SSR/SSG and semantic HTML.

### 5.3 Design tokens (from mockups)

- **Primary:** `#136dec`
- **Background light:** `#f6f7f8`
- **Background dark:** `#101822`
- **Border radius:** 0.25rem–1rem (varies by mockup); keep consistent in the app.
- **Dark mode:** Class-based (`dark:` in Tailwind). Prefer system or user preference.

### 5.4 Key pages to implement (priority)

1. **Home** — Discovery (hero, search, categories, featured/trending experiences). SEO: title/description for “experiences northern Sardinia” etc.
2. **Experience detail** — `/experiences/[slug]`. Replace “Reserve now” with “I’m interested” → form (party size + dates) → store event → show provider link/contact/redirect.
3. **Category / area listing** — e.g. by activity type or sub-region. **Geography:** one area (“northern Sardinia”) for launch; **design the data model and UI to support multiple areas** (e.g. Costa Smeralda, Stintino, Alghero) so we can add them later without a rewrite.
4. **Interest submission endpoint** — API or server action that saves interest events and returns success (and optionally provider URL for redirect).

---

## 6. Open points / to confirm with product

- **Analytics:** Which tool(s) for behavior tracking? When you decide, document the choice and ensure consent and GDPR alignment. The brief recommends Plausible or PostHog as GDPR-friendly options. The **cookie/consent banner** and documentation of cookies/scripts are required (see §3.2 and checklist).

---

## 7. Checklist for agents before shipping

- [ ] Every “I’m interested” is stored with at least: `experience_id`, `party_size`, `dates_of_interest`, `created_at`. Optional email/name only with consent and documented purpose.
- [ ] No booking or payment flow on our side; user is directed to provider’s site/contact.
- [ ] Key pages are server-rendered or statically generated and have unique `<title>` and meta description.
- [ ] One `<h1>` per page; URLs are clean and readable; **301 redirects** in place for removed or renamed experiences.
- [ ] **Consent and cookies:** Cookie/consent banner implemented; cookies and scripts documented (purpose, consent storage). User tracking (analytics/PII) is documented and GDPR-compliant (consent, purpose, minimal data).
- [ ] Design (colors, typography, components) is consistent with the existing HTML mockups where applicable.
- [ ] **Performance:** Caching is configured (pages, API, static assets); images use optimization (format, size, lazy-load) and cacheable URLs; assets served from CDN where possible; Core Web Vitals are acceptable (measure before ship).
- [ ] **i18n:** English and Italian copy; locale auto-detected from browser or saved preference; manual language switcher; hreflang and per-locale URLs for SEO.
- [ ] **Search:** Works for experiences, locations, and categories (as specified).
- [ ] **Favorites:** Session-based “save for later” and **share** (e.g. OG meta tags) on experience pages.
- [ ] **Admin:** Leads per experience, basic analytics (views, interests over time, top experiences), and **export leads** (e.g. CSV) for site owner. Admin auth: only site owner account.
- [ ] **Abuse:** Rate limiting and optional anti-bot on interest form; documented.
- [ ] **Accessibility:** WCAG 2.1 Level AA where feasible (focus, alt text, semantic markup, keyboard, screen readers).
- [ ] **Mobile:** Site is mobile-first and responsive; key flows tested on small viewports.
- [ ] **Edge cases:** Experience with no provider URL/contact handled (no misleading CTA); interest form validated server-side.

---

*End of document. Update this file when product decisions change or new conventions are adopted.*
