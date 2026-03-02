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
