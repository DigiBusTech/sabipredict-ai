'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/actions/auth';
import { createAdminClient } from '@/utils/supabase/admin';
import { HomepageContent, PageSeoMetadata, PromoSlot } from '@/lib/types';
import { Buffer } from 'node:buffer';

async function requireAdmin() {
  const { profile } = await getCurrentUser();
  if (profile?.role !== 'admin') throw new Error('Admin privileges required.');
}

export async function saveHomepageContentAction(input: HomepageContent) {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== 'admin') throw new Error('Admin privileges required.');
  if (input.hero_image_url && !/^https:\/\//.test(input.hero_image_url)) return { success: false, error: 'Hero image must use HTTPS.' };

  const allowedKeys = ['eyebrow', 'headline', 'headline_highlight', 'description', 'accuracy_label', 'verified_label', 'banker_label'];
  const translations: HomepageContent['translations'] = {};
  for (const locale of ['en', 'fr', 'es', 'pt'] as const) {
    const source = input.translations[locale] || {};
    const copy: Record<string, string> = {};
    for (const key of allowedKeys) {
      const value = source[key as keyof typeof source];
      if (typeof value === 'string') copy[key] = value.trim().slice(0, key === 'description' ? 500 : 160);
    }
    translations[locale] = copy;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('homepage_content').upsert({
    id: true,
    translations,
    hero_image_url: input.hero_image_url || null,
    hero_image_alt: input.hero_image_alt || {},
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });
  revalidatePath('/');
  return { success: !error, error: error?.message };
}

export async function uploadManagedImageAction(formData: FormData) {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== 'admin') throw new Error('Admin privileges required.');
  const file = formData.get('file');
  if (!(file instanceof File) || file.size < 1 || file.size > 8 * 1024 * 1024) return { success: false, error: 'Select an image up to 8 MB.' };
  const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const extension = extensions[file.type];
  if (!extension) return { success: false, error: 'Use a JPG, PNG, or WebP image.' };

  const supabase = createAdminClient();
  const bucket = 'branding';
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((item) => item.name === bucket)) {
    const { error } = await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 8 * 1024 * 1024, allowedMimeTypes: Object.keys(extensions) });
    if (error && !error.message.toLowerCase().includes('already exists')) return { success: false, error: 'Image storage is unavailable.' };
  }
  const path = `site-content/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return { success: false, error: 'Image upload failed.' };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

export async function savePageSeoAction(input: PageSeoMetadata) {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== 'admin') throw new Error('Admin privileges required.');
  if (!/^\/(?:[a-z0-9/-]*)$/.test(input.path) || input.path.includes('//') || input.title.trim().length > 180 || input.description.length > 320) {
    return { success: false, error: 'Check the route, title, and description.' };
  }
  if (input.canonical_url && !/^https:\/\//.test(input.canonical_url)) return { success: false, error: 'Canonical URL must use HTTPS.' };
  if (input.open_graph_image_url && !/^https:\/\//.test(input.open_graph_image_url)) return { success: false, error: 'Open Graph image URL must use HTTPS.' };
  const supabase = createAdminClient();
  const { error } = await supabase.from('seo_metadata').upsert({
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    keywords: input.keywords.slice(0, 20).map((keyword) => keyword.trim()).filter(Boolean),
    translations: input.translations || {},
    canonical_url: input.canonical_url || null,
    open_graph_image_url: input.open_graph_image_url || null,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });
  revalidatePath(input.path);
  revalidatePath('/admin');
  return { success: !error, error: error?.message };
}

export async function savePromoSlotAction(input: Partial<PromoSlot>) {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== 'admin') throw new Error('Admin privileges required.');
  if (!input.name?.trim() || input.name.length > 100 || !['home-hero', 'home-feed', 'blog-sidebar', 'pricing-banner'].includes(input.placement || '')) {
    return { success: false, error: 'Promotion name and a valid placement are required.' };
  }
  if (input.target_url && !/^https:\/\//.test(input.target_url)) return { success: false, error: 'Promotion link must use HTTPS.' };
  if (input.image_url && !/^https:\/\//.test(input.image_url)) return { success: false, error: 'Promotion image URL must use HTTPS.' };
  const supabase = createAdminClient();
  const { error } = await supabase.from('promo_slots').upsert({
    ...input,
    name: input.name.trim(),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });
  revalidatePath('/');
  revalidatePath('/pricing');
  revalidatePath('/blog');
  return { success: !error, error: error?.message };
}

export async function deletePromoSlotAction(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('promo_slots').delete().eq('id', id);
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: !error, error: error?.message };
}