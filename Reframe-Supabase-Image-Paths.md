# How Reframe Handles Relative Supabase Paths for Images

This document describes how the **Reframe** project resolves and serves images when using **relative paths** stored in the database, with **Supabase Storage** used in production.

---

## Overview

Reframe keeps **relative paths** in the database (e.g. `uploads/artworks/artwork-1.jpg`) instead of full Supabase URLs. A small **helper** and an **API proxy** turn those relative paths into the correct URL per environment and, in production, fetch the file from Supabase Storage.

- **Development:** Images are served from the local filesystem (`public/uploads/`).
- **Production:** The same relative path is used to fetch the file from Supabase Storage via a Next.js API route (proxy). The database never stores Supabase host or bucket in the path.

---

## 1. What Counts as a "Relative Path"

- Paths **without** a scheme: `uploads/artworks/artwork-1.jpg` or `/uploads/artworks/artwork-1.jpg`.
- Paths **with** `http://` or `https://` are treated as **absolute** and are returned unchanged (e.g. external or full Supabase URLs).

So "relative" here means: **path-only, no origin**. The app never mutates full URLs.

---

## 2. Helper: `getImageUrl()` (`lib/image-utils.ts`)

All image URLs that come from the database or from known relative paths should go through `getImageUrl()`:

```typescript
import { getImageUrl } from '@/lib/image-utils'

// Example: value from DB or built path
const imageUrl = getImageUrl(artwork.immagine_url)  // e.g. "uploads/artworks/artwork-1.jpg"
```

Behavior:

1. **Full URL**  
   If the string starts with `http://` or `https://`, it is returned as-is.

2. **Normalize slash**  
   A leading `/` is removed so `uploads/...` and `/uploads/...` are treated the same.

3. **Development**  
   Returns a path under the app origin, e.g. `/${cleanPath}` → `/uploads/artworks/artwork-1.jpg`.  
   Next.js serves these from `public/`, so the file must live at `public/uploads/artworks/artwork-1.jpg`.

4. **Production**  
   Returns the proxy URL: `/api/images/${cleanPath}` → `/api/images/uploads/artworks/artwork-1.jpg`.  
   The proxy is responsible for loading the file from Supabase using this same relative path.

So in Reframe, **relative Supabase paths** are not turned into Supabase URLs in the front-end; they are turned into **relative app URLs** that point to the proxy in production.

---

## 3. API Proxy: `/api/images/[...path]/route.ts`

The catch-all route receives the **relative path** as path segments, e.g. for `/api/images/uploads/artworks/artwork-1.jpg` the `path` param is `['uploads', 'artworks', 'artwork-1.jpg']`.

- **Development**  
  The route returns `NextResponse.next()` so Next.js continues and serves the file from `public/` (same path as the request path under the app).

- **Production**  
  1. Path segments are joined: `imagePath = path.join('/')` → `uploads/artworks/artwork-1.jpg`.
  2. The first segment is treated as the top-level "folder" and the rest as the object path inside the bucket:
     - `folder = pathParts[0]` (e.g. `uploads`)
     - `filename = pathParts.slice(1).join('/')` (e.g. `artworks/artwork-1.jpg`)
  3. The file is downloaded from Supabase Storage:
     - Bucket name: **`uploads`**
     - Object key: **`${folder}/${filename}`** → e.g. `uploads/artworks/artwork-1.jpg`

So the **relative path you store** (e.g. `uploads/artworks/artwork-1.jpg`) is used **as the object key** inside the `uploads` bucket. The proxy does not prepend the bucket name to the URL; it is encoded in the route (bucket = `uploads`) and the rest of the path is the key.

The response sets appropriate `Content-Type` (from extension) and cache headers and returns the file body.

---

## 4. Path Conventions and Storage Layout

- **Local (development)**  
  Files under `public/uploads/...`, e.g. `public/uploads/artworks/artwork-1.jpg`.  
  Relative path: `uploads/artworks/artwork-1.jpg` (or with leading slash; both are normalized).

- **Supabase (production)**  
  Bucket: **`uploads`**.  
  Object key = same relative path you use in code: e.g. `uploads/artworks/artwork-1.jpg`, `uploads/profiles/avatar.png`.  
  So the bucket contains keys like `uploads/artworks/...`, `uploads/profiles/...`, etc.

Convenience helpers in Reframe build the relative path for you:

- `getArtworkImageUrl(filename)` → `getImageUrl('uploads/artworks/' + filename)`
- `getProfileImageUrl(filename)` → `getImageUrl('uploads/profiles/' + filename)`
- `getGeneralImageUrl(filename)` → `getImageUrl('uploads/general/' + filename)`

The **relative path** is always of the form `uploads/<folder>/<filename>` (or with leading slash); the proxy maps that 1:1 to the Supabase Storage object key inside the `uploads` bucket.

---

## 5. Summary Table

| Stored value (DB / code)     | Development URL                    | Production URL (browser)              | Production source           |
|-----------------------------|-------------------------------------|--------------------------------------|-----------------------------|
| `uploads/artworks/x.jpg`    | `/uploads/artworks/x.jpg`           | `/api/images/uploads/artworks/x.jpg` | Supabase bucket `uploads`, key `uploads/artworks/x.jpg` |
| `http://example.com/x.jpg`  | (unchanged)                         | (unchanged)                          | External / full URL         |

So in short: **Reframe treats relative Supabase paths as path-only strings**, uses them in dev for `public/` and in prod as the **object key** in the `uploads` bucket, and never stores full Supabase URLs in the database for this flow.
