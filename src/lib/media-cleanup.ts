import { getSupabaseServer } from '@/lib/supabase-server';
import path from 'path';
import fs from 'fs/promises';

const MEDIA_BUCKET = 'media';

export async function cleanupDraftPaths(storedPaths: string[]): Promise<void> {
  const draftPaths = storedPaths.filter((p) => {
    const normalized = path.posix.normalize(p);
    return normalized.startsWith('media/experiences/_draft/') && !normalized.includes('..');
  });
  if (!draftPaths.length) return;

  const supabase = getSupabaseServer();
  if (supabase) {
    const objectKeys = draftPaths.map((p) => p.slice('media/'.length));
    const originalKeys = objectKeys.map((k) => {
      const dir = k.substring(0, k.lastIndexOf('/'));
      const base = k.substring(k.lastIndexOf('/') + 1);
      return `${dir}/originals/${base}`;
    });
    await supabase.storage.from(MEDIA_BUCKET).remove([...objectKeys, ...originalKeys]);
  } else if (process.env.NODE_ENV !== 'production') {
    for (const p of draftPaths) {
      const filePath = path.join(process.cwd(), 'public', p);
      await fs.rm(filePath, { force: true });
      const originalPath = path.join(path.dirname(filePath), 'originals', path.basename(filePath));
      await fs.rm(originalPath, { force: true });
    }
  }
}
