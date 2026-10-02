'use server';

import { revalidatePath } from 'next/cache';
import { upsertBlogPost, deleteBlogPost } from '@/lib/db';
import { getCurrentUser } from './auth';
import { BlogPost } from '@/lib/types';
import { Locale } from '@/lib/i18n/types';

function readBlogTranslations(formData: FormData): BlogPost['translations'] {
  const translations: NonNullable<BlogPost['translations']> = {};
  for (const locale of ['fr', 'es', 'pt'] as Locale[]) {
    const title = String(formData.get(`${locale}_title`) || '').trim();
    const excerpt = String(formData.get(`${locale}_excerpt`) || '').trim();
    const content = String(formData.get(`${locale}_content`) || '').trim();
    const category = String(formData.get(`${locale}_category`) || '').trim();
    if (title || excerpt || content || category) {
      translations[locale] = { title, excerpt, content, category };
    }
  }
  return translations;
}

async function verifyAdmin() {
  const { profile } = await getCurrentUser();
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized. Admin access required.');
  }
}

export async function createBlogPostAction(formData: FormData) {
  await verifyAdmin();

  const title = formData.get('title') as string;
  let slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const category = (formData.get('category') as string) || 'Betting Intelligence';
  const author = (formData.get('author') as string) || 'SabiPredict AI Editorial';
  const cover_image = formData.get('cover_image') as string;
  const published = formData.get('published') === 'true';
  const translations = readBlogTranslations(formData);

  if (!title || !content) {
    return { error: 'Title and content are required.' };
  }

  if (!slug) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  const read_time = `${Math.max(2, Math.round(content.split(' ').length / 180))} min read`;

  const success = await upsertBlogPost({
    title,
    slug,
    content,
    excerpt,
    category,
    author,
    cover_image,
    published,
    read_time,
    translations,
  });

  revalidatePath('/admin');
  revalidatePath('/blog');
  revalidatePath('/');
  return { success, slug };
}

export async function updateBlogPostAction(id: string, formData: FormData) {
  await verifyAdmin();

  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const category = formData.get('category') as string;
  const author = formData.get('author') as string;
  const cover_image = formData.get('cover_image') as string;
  const published = formData.get('published') === 'true';
  const translations = readBlogTranslations(formData);

  const read_time = `${Math.max(2, Math.round(content.split(' ').length / 180))} min read`;

  const success = await upsertBlogPost({
    id,
    title,
    slug,
    content,
    excerpt,
    category,
    author,
    cover_image,
    published,
    read_time,
    translations,
  });

  revalidatePath('/admin');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  return { success };
}

export async function deleteBlogPostAction(id: string) {
  await verifyAdmin();
  const success = await deleteBlogPost(id);
  revalidatePath('/admin');
  revalidatePath('/blog');
  return { success };
}
