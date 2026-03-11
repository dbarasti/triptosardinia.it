'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSupabaseServer } from '@/lib/supabase-server';
import { cleanupDraftPaths } from '@/lib/media-cleanup';
import type { Experience } from '@/lib/types';
import path from 'path';
import fs from 'fs/promises';

const MEDIA_BUCKET = 'media';
const PUBLIC_MEDIA = path.join(process.cwd(), 'public', MEDIA_BUCKET);

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Moves a file within the media bucket (Supabase) or on the local filesystem. */
async function moveStoredFile(
  fromObjectKey: string,
  toObjectKey: string,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<void> {
  if (supabase) {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).move(fromObjectKey, toObjectKey);
    if (error) throw new Error(error.message);
  } else {
    const src = path.join(process.cwd(), 'public', MEDIA_BUCKET, fromObjectKey);
    const dest = path.join(process.cwd(), 'public', MEDIA_BUCKET, toObjectKey);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.rename(src, dest);
  }
}

/**
 * Moves all _draft image paths for a given experience to its permanent folder,
 * updates the DB, and returns the updated image_urls.
 */
async function moveDraftImages(
  imageUrls: string[],
  experienceId: string,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<string[]> {
  const updated = [...imageUrls];
  for (let i = 0; i < updated.length; i++) {
    const url = updated[i];
    if (!url.startsWith('media/experiences/_draft/')) continue;
    const filename = url.slice('media/experiences/_draft/images/'.length);
    const newPath = `media/experiences/${experienceId}/images/${filename}`;
    await moveStoredFile(
      `experiences/_draft/images/${filename}`,
      `experiences/${experienceId}/images/${filename}`,
      supabase
    );
    // Move original too if it exists
    try {
      await moveStoredFile(
        `experiences/_draft/images/originals/${filename}`,
        `experiences/${experienceId}/images/originals/${filename}`,
        supabase
      );
    } catch { /* original may not exist yet */ }
    updated[i] = newPath;
  }
  return updated;
}

export async function uploadExperienceMedia(
  experienceId: string | null,
  formData: FormData
): Promise<{ ok: boolean; paths?: string[]; error?: string }> {
  const prefix = experienceId || '_draft';
  const files = formData.getAll('files') as File[];
  if (!files.length) return { ok: false, error: 'No files' };
  const allowedTypes = /^image\/(jpeg|png|gif|webp)|video\/(mp4|webm|quicktime)$/i;
  const paths: string[] = [];
  const supabase = getSupabaseServer();

  for (const file of files) {
    if (!file.size || !allowedTypes.test(file.type)) continue;
    const ext = path.extname(file.name) || (file.type.startsWith('video/') ? (file.type.includes('quicktime') ? '.mov' : '.mp4') : '.jpg');
    const base = path.basename(file.name, path.extname(file.name)).replace(/\s+/g, '-').slice(0, 40);
    const key = `${crypto.randomUUID().slice(0, 8)}-${base}${ext}`;
    const storedPath = `media/experiences/${prefix}/images/${key}`;
    const objectKey = `experiences/${prefix}/images/${key}`;
    const originalObjectKey = `experiences/${prefix}/images/originals/${key}`;

    if (supabase) {
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(objectKey, file, {
        contentType: file.type,
        upsert: true,
      });
      if (error) return { ok: false, error: error.message };
      await supabase.storage.from(MEDIA_BUCKET).upload(originalObjectKey, file, {
        contentType: file.type,
        upsert: false,
      });
    } else if (isProduction()) {
      return {
        ok: false,
        error: 'Image upload requires Supabase Storage. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY), and create a "media" bucket in Supabase.',
      };
    } else {
      const dir = path.join(PUBLIC_MEDIA, 'experiences', prefix, 'images');
      await fs.mkdir(dir, { recursive: true });
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(dir, key), buf);
      const originalsDir = path.join(dir, 'originals');
      await fs.mkdir(originalsDir, { recursive: true });
      await fs.writeFile(path.join(originalsDir, key), buf);
    }
    paths.push(storedPath);
  }
  return paths.length ? { ok: true, paths } : { ok: false, error: 'No valid files' };
}

/** Replace an existing media file (e.g. after crop). Path is the stored path (e.g. media/experiences/exp-1/images/xyz.jpg). */
export async function replaceExperienceMedia(
  existingPath: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const pathTrim = existingPath.trim();
  if (!pathTrim.startsWith('media/')) return { ok: false, error: 'Invalid path' };
  const file = formData.get('file') as File | null;
  if (!file?.size || !file.type.startsWith('image/')) return { ok: false, error: 'No image file' };

  const supabase = getSupabaseServer();
  const objectKey = pathTrim.slice('media/'.length);
  const dir = objectKey.substring(0, objectKey.lastIndexOf('/'));
  const base = objectKey.substring(objectKey.lastIndexOf('/') + 1);
  const originalObjectKey = `${dir}/originals/${base}`;

  if (supabase) {
    // Ensure original exists before overwriting — copy current main file if not yet saved
    await supabase.storage.from(MEDIA_BUCKET).copy(objectKey, originalObjectKey);
    // (error intentionally ignored: if original already exists the copy fails, which is correct)

    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(objectKey, file, {
      contentType: file.type,
      upsert: true,
    });
    if (error) return { ok: false, error: error.message };
  } else if (isProduction()) {
    return {
      ok: false,
      error: 'Image upload requires Supabase Storage. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY), and create a "media" bucket in Supabase.',
    };
  } else {
    const dest = path.join(process.cwd(), 'public', pathTrim);
    const originalDest = path.join(path.dirname(dest), 'originals', path.basename(dest));
    // Ensure original exists before overwriting
    try {
      await fs.access(originalDest);
    } catch {
      await fs.mkdir(path.dirname(originalDest), { recursive: true });
      await fs.copyFile(dest, originalDest);
    }
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(dest, buf);
  }
  return { ok: true };
}

export async function setExperiencePublished(id: string, published: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const updated = await db.updateExperience(id, { published });
    if (!updated) return { ok: false, error: 'not_found' };
    revalidatePath('/admin');
    revalidatePath('/admin/experiences');
    revalidatePath('/admin/analytics');
    revalidatePath('/en');
    revalidatePath('/it');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

type ExperienceFormData = Omit<Experience, 'id' | 'created_at' | 'updated_at'>;

function parseFormData(form: FormData): { data: ExperienceFormData; errors: string[] } {
  const errors: string[] = [];
  const title_en = (form.get('title_en') as string)?.trim();
  const title_it = (form.get('title_it') as string)?.trim();
  const slug = (form.get('slug') as string)?.trim().toLowerCase().replace(/\s+/g, '-');
  const area_id = (form.get('area_id') as string)?.trim();
  const category_id = (form.get('category_id') as string)?.trim();
  const description_en = (form.get('description_en') as string)?.trim();
  const description_it = (form.get('description_it') as string)?.trim();
  const imageUrlsRaw = (form.get('image_urls') as string)?.trim();
  const image_urls = imageUrlsRaw ? imageUrlsRaw.split(/\r?\n/).map((u) => u.trim()).filter(Boolean) : [];
  const duration_minutes = parseInt(String(form.get('duration_minutes')), 10);
  const group_size_max = parseInt(String(form.get('group_size_max')), 10);
  const difficulty = (form.get('difficulty') as string)?.trim() || undefined;
  const location_name_en = (form.get('location_name_en') as string)?.trim() || undefined;
  const location_name_it = (form.get('location_name_it') as string)?.trim() || undefined;
  const provider_booking_url = (form.get('provider_booking_url') as string)?.trim() || null;
  const provider_email = (form.get('provider_email') as string)?.trim() || null;
  const provider_phone = (form.get('provider_phone') as string)?.trim() || null;
  const google_maps_url = (form.get('google_maps_url') as string)?.trim() || null;
  const google_place_id = (form.get('google_place_id') as string)?.trim() || null;
  const published = form.get('published') === 'on' || form.get('published') === 'true';
  const priceRaw = (form.get('price_euros') as string)?.trim();
  const price_cents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : null;

  if (!title_en) errors.push('Title (English) is required');
  if (!title_it) errors.push('Title (Italian) is required');
  if (!slug) errors.push('Slug is required');
  if (!area_id) errors.push('Area is required');
  if (!category_id) errors.push('Category is required');
  if (!description_en) errors.push('Description (English) is required');
  if (!description_it) errors.push('Description (Italian) is required');
  if (Number.isNaN(duration_minutes) || duration_minutes < 1) errors.push('Duration must be at least 1');
  if (Number.isNaN(group_size_max) || group_size_max < 1) errors.push('Group size must be at least 1');
  if (image_urls.length === 0) errors.push('At least one image URL is required');

  const data: ExperienceFormData = {
    slug,
    area_id,
    category_id,
    title_en,
    title_it,
    description_en,
    description_it,
    image_urls,
    duration_minutes,
    group_size_max,
    difficulty,
    location_name_en,
    location_name_it,
    provider_booking_url,
    provider_email,
    provider_phone,
    google_maps_url,
    google_place_id,
    published,
    price_cents: price_cents != null && !isNaN(price_cents) && price_cents >= 0 ? price_cents : null,
  };
  return { data, errors };
}

export async function createExperienceAction(formData: FormData): Promise<{ ok: boolean; id?: string; errors?: string[] }> {
  const { data, errors } = parseFormData(formData);
  if (errors.length > 0) return { ok: false, errors };
  try {
    const exp = await db.createExperience(data);
    // Move any _draft images to the permanent experience folder
    if (data.image_urls.some((u) => u.startsWith('media/experiences/_draft/'))) {
      const supabase = getSupabaseServer();
      const newImageUrls = await moveDraftImages(data.image_urls, exp.id, supabase);
      await db.updateExperience(exp.id, { image_urls: newImageUrls });
    }
    revalidatePath('/admin');
    revalidatePath('/admin/experiences');
    revalidatePath('/en');
    revalidatePath('/it');
    return { ok: true, id: exp.id };
  } catch (e) {
    return { ok: false, errors: [String(e)] };
  }
}

export async function updateExperienceAction(id: string, formData: FormData): Promise<{ ok: boolean; errors?: string[] }> {
  const { data, errors } = parseFormData(formData);
  if (errors.length > 0) return { ok: false, errors };
  try {
    const updated = await db.updateExperience(id, data);
    if (!updated) return { ok: false, errors: ['Not found'] };
    revalidatePath('/admin');
    revalidatePath('/admin/experiences');
    revalidatePath(`/admin/experiences/${id}`);
    revalidatePath('/en');
    revalidatePath('/it');
    if (updated.slug) {
      revalidatePath(`/en/experiences/${updated.slug}`);
      revalidatePath(`/it/experiences/${updated.slug}`);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, errors: [String(e)] };
  }
}

export async function cleanupDraftMediaAction(paths: string[]): Promise<{ ok: boolean }> {
  try {
    await cleanupDraftPaths(paths);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function migrateDraftMediaAction(): Promise<{ ok: boolean; migrated: number; error?: string }> {
  try {
    const experiences = await db.getAllExperiencesForAdmin();
    const supabase = getSupabaseServer();
    let migrated = 0;
    for (const exp of experiences) {
      if (!exp.image_urls.some((u) => u.startsWith('media/experiences/_draft/'))) continue;
      const newImageUrls = await moveDraftImages(exp.image_urls, exp.id, supabase);
      await db.updateExperience(exp.id, { image_urls: newImageUrls });
      migrated++;
    }
    revalidatePath('/admin/experiences');
    revalidatePath('/en');
    revalidatePath('/it');
    return { ok: true, migrated };
  } catch (e) {
    return { ok: false, migrated: 0, error: String(e) };
  }
}

export async function deleteExperienceAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const deleted = await db.deleteExperience(id);
    if (!deleted) return { ok: false, error: 'not_found' };

    // Delete all media files for this experience
    const supabase = getSupabaseServer();
    if (supabase) {
      for (const prefix of [`experiences/${id}/images`, `experiences/${id}/images/originals`]) {
        const { data: files } = await supabase.storage.from(MEDIA_BUCKET).list(prefix);
        if (files?.length) {
          const keys = files.map((f) => `${prefix}/${f.name}`);
          await supabase.storage.from(MEDIA_BUCKET).remove(keys);
        }
      }
    } else if (!isProduction()) {
      const folder = path.join(PUBLIC_MEDIA, 'experiences', id);
      await fs.rm(folder, { recursive: true, force: true });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/experiences');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/analytics');
    revalidatePath('/en');
    revalidatePath('/it');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
