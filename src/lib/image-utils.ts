/**
 * Returns the stored path for the original (pre-crop) version of an image.
 * e.g. media/experiences/exp-1/images/abc.jpg → media/experiences/exp-1/images/originals/abc.jpg
 */
export function getOriginalPath(storedPath: string): string {
  const lastSlash = storedPath.lastIndexOf('/');
  if (lastSlash === -1) return storedPath;
  return storedPath.slice(0, lastSlash + 1) + 'originals/' + storedPath.slice(lastSlash + 1);
}

/**
 * Resolves image (and video) paths for display.
 * - Relative paths (e.g. media/experiences/exp-1/images/x.jpg): dev → /media/..., prod → /api/images/media/...
 * - Full URLs (http/https): returned unchanged.
 * @see Reframe-Supabase-Image-Paths.md
 */
export function getImageUrl(urlOrPath: string | null | undefined): string {
  if (urlOrPath == null || urlOrPath === '') return '';
  const s = urlOrPath.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const cleanPath = s.startsWith('/') ? s.slice(1) : s;
  if (!cleanPath) return '';
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_USE_MEDIA_PROXY === 'true') return `/api/images/${cleanPath}`;
    return `/${cleanPath}`;
  }
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_USE_MEDIA_PROXY === 'true') {
    return `/api/images/${cleanPath}`;
  }
  return `/${cleanPath}`;
}
