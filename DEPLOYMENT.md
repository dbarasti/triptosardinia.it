# Deploying to Vercel

## Prerequisites

- Git repo connected to [Vercel](https://vercel.com)
- Node.js 18+ (Vercel provides this)

## Steps

1. **Connect the repo**  
   In Vercel: New Project → Import your Git repository. Vercel will detect Next.js and use `npm run build` and `next start` (or the serverless runtime).

2. **Set environment variables**  
   In the project settings (Settings → Environment Variables), add the variables listed in `.env.example`. At minimum for production:

   - **Required**
     - `NEXTAUTH_SECRET` — Long random string (e.g. `openssl rand -base64 32`)
     - `NEXTAUTH_URL` — Your production URL (e.g. `https://your-app.vercel.app`)
     - `NEXT_PUBLIC_SITE_URL` — Same as `NEXTAUTH_URL` (for sitemap, OG, images)
   - **If using PostgreSQL**
     - `DATABASE_URL` — Connection string (e.g. Supabase “Connection string” from Project Settings → Database)
   - **If using Supabase Storage for media**
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_USE_MEDIA_PROXY=true`
   - **Optional**
     - `GOOGLE_PLACES_API_KEY` — For Google reviews
     - `NEXT_PUBLIC_HERO_IMAGE_URL` — Hero image on the home page

3. **Deploy**  
   Push to your main branch or trigger a deploy from the Vercel dashboard. Build logs will show `next build`; the app runs on Vercel’s Edge/Node runtime.

## Config files

- **`vercel.json`** — Security and cache headers (e.g. long cache for `/_next/static/*`).
- **`.vercelignore`** — Excludes unneeded files from the deploy payload (e.g. mockups, coverage, local env).

## Custom domain

In Vercel: Project → Settings → Domains. Add your domain and follow the DNS instructions.

## Troubleshooting

- **Build fails** — Check build logs; ensure all required env vars are set for the “Production” environment.
- **NextAuth redirect / session issues** — Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the exact production URL (no trailing slash).
- **Images or media 404** — If using Supabase Storage, set `NEXT_PUBLIC_USE_MEDIA_PROXY=true` and ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
