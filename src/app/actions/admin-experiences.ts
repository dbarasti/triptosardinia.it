'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import type { Experience } from '@/lib/types';

export async function setExperiencePublished(id: string, published: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const updated = await db.updateExperience(id, { published });
    if (!updated) return { ok: false, error: 'not_found' };
    revalidatePath('/admin');
    revalidatePath('/admin/experiences');
    revalidatePath('/admin/analytics');
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
  const published = form.get('published') === 'on' || form.get('published') === 'true';

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
    published,
  };
  return { data, errors };
}

export async function createExperienceAction(formData: FormData): Promise<{ ok: boolean; id?: string; errors?: string[] }> {
  const { data, errors } = parseFormData(formData);
  if (errors.length > 0) return { ok: false, errors };
  try {
    const exp = await db.createExperience(data);
    revalidatePath('/admin');
    revalidatePath('/admin/experiences');
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
    return { ok: true };
  } catch (e) {
    return { ok: false, errors: [String(e)] };
  }
}

export async function deleteExperienceAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const deleted = await db.deleteExperience(id);
    if (!deleted) return { ok: false, error: 'not_found' };
    revalidatePath('/admin');
    revalidatePath('/admin/experiences');
    revalidatePath('/admin/leads');
    revalidatePath('/admin/analytics');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
