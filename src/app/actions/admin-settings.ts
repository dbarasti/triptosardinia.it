'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSupabaseServer } from '@/lib/supabase-server';
import path from 'path';
import fs from 'fs/promises';

const HERO_SETTING_KEY = 'hero_image_path';
const MEDIA_BUCKET = 'media';
const PUBLIC_MEDIA = path.join(process.cwd(), 'public', MEDIA_BUCKET);

export async function setHeroImage(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const pathOrUrl = (formData.get('hero_path') as string)?.trim();
  const file = formData.get('hero_file') as File | null;

  if (file?.size && file.type.startsWith('image/')) {
    const ext = path.extname(file.name) || '.jpg';
    const storedPath = `media/site/hero${ext}`;
    const objectKey = `site/hero${ext}`;
    const supabase = getSupabaseServer();

    if (supabase) {
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(objectKey, file, {
        contentType: file.type,
        upsert: true,
      });
      if (error) return { ok: false, error: error.message };
    } else {
      const dir = path.join(PUBLIC_MEDIA, 'site');
      await fs.mkdir(dir, { recursive: true });
      const dest = path.join(dir, `hero${ext}`);
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(dest, buf);
    }
    await db.setSiteSetting(HERO_SETTING_KEY, storedPath);
  } else if (pathOrUrl) {
    await db.setSiteSetting(HERO_SETTING_KEY, pathOrUrl);
  } else {
    return { ok: false, error: 'Provide an image file or a path/URL' };
  }

  revalidatePath('/');
  revalidatePath('/en');
  revalidatePath('/it');
  return { ok: true };
}
