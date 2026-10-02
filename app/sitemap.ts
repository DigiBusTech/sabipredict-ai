import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/utils/supabase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sabipredicts.com').replace(/\/$/, '');
  const supabase = createAdminClient();
  const [{ data: pages }, { data: posts }] = await Promise.all([
    supabase.from('seo_metadata').select('path, updated_at').eq('no_index', false),
    supabase.from('blog_posts').select('slug, updated_at').eq('published', true),
  ]);

  const staticPages = (pages || [])
    .filter((page) => !page.path.startsWith('/blog/'))
    .map((page) => ({
      url: `${origin}${page.path === '/' ? '' : page.path}`,
      lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
      changeFrequency: (page.path === '/' ? 'daily' : 'weekly') as 'daily' | 'weekly',
      priority: page.path === '/' ? 1 : 0.7,
    }));

  const blogPages = (posts || []).map((post) => ({
    url: `${origin}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}