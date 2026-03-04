# Supabase Storage for production media

Hero images and experience images/videos are uploaded to **Supabase Storage** in production. The app streams them via `/api/images/...` using the secret key (server-side only).

Supabase’s [new API keys](https://github.com/orgs/supabase/discussions/29260) use **Publishable key** (client-safe) and **Secret key** (server-only). This app only needs the **Secret key** for Storage uploads and serving.

## 1. Create the Storage bucket

1. In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Storage**.
2. Click **New bucket**.
3. Name: **`media`** (must match the code).
4. **Public bucket**: off (recommended). The app uses the secret key to serve files, so the bucket can stay private.
5. Create the bucket.

## 2. Set environment variables (e.g. Vercel)

In your production env (e.g. Vercel → Project → Settings → Environment Variables), set:

| Variable | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (e.g. `https://xxxx.supabase.co`) from Project Settings → API. |
| `SUPABASE_SECRET_KEY` | **Secret key** from the dashboard (new keys). Same role as the legacy “Service role” key. Keep secret. |
| `NEXT_PUBLIC_USE_MEDIA_PROXY` | Set to **`true`** so image/video paths are served via `/api/images/...` (Supabase). |

You can use **`SUPABASE_SERVICE_ROLE_KEY`** instead of `SUPABASE_SECRET_KEY` if you still have the legacy key.

Redeploy after changing env vars.

## 3. Result

- **Hero image** (Admin → Settings): uploads go to Storage `media/site/hero.{ext}`.
- **Experience media** (Admin → Experiences): uploads go to Storage `media/experiences/{id}/images/...`.
- The app stores paths like `media/site/hero.jpg`. With `NEXT_PUBLIC_USE_MEDIA_PROXY=true`, the frontend requests `/api/images/media/site/hero.jpg`, and the API route streams the file from Storage using the secret key.

Without these env vars in production, uploads would try to write to the server filesystem and fail (e.g. `ENOENT: no such file or directory, mkdir '/var/task/public'` on Vercel).
