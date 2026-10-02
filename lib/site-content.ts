import { createAdminClient } from '@/utils/supabase/admin';
import { HomepageContent, PageSeoMetadata, PromoSlot } from '@/lib/types';
import { Locale } from '@/lib/i18n/types';

const DEFAULT_HOMEPAGE: HomepageContent = {
  translations: {},
  hero_image_url: '',
  hero_image_alt: {},
};

export async function getHomepageContent(): Promise<HomepageContent> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('homepage_content').select('*').eq('id', true).maybeSingle();
  if (error || !data) return DEFAULT_HOMEPAGE;
  return {
    translations: data.translations || {},
    hero_image_url: data.hero_image_url || '',
    hero_image_alt: data.hero_image_alt || {},
  };
}

export async function getActivePromoSlots(placement: PromoSlot['placement']): Promise<PromoSlot[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('promo_slots').select('*')
    .eq('placement', placement)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('sort_order', { ascending: true });
  return error ? [] : (data as PromoSlot[]) || [];
}

export async function getPageSeo(path: string): Promise<PageSeoMetadata | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('seo_metadata').select('*').eq('path', path).maybeSingle();
  return error ? null : (data as PageSeoMetadata | null);
}

export async function getAdminSeoMetadata(): Promise<PageSeoMetadata[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('seo_metadata').select('*').order('path');
  return error ? [] : (data as PageSeoMetadata[]) || [];
}

export async function getAdminPromoSlots(): Promise<PromoSlot[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('promo_slots').select('*').order('placement').order('sort_order');
  return error ? [] : (data as PromoSlot[]) || [];
}

export async function getPageMetadata(
  path: string,
  locale: Locale,
  fallback: { title: string; description: string },
) {
  const [seo, globalSeo] = await Promise.all([
    getPageSeo(path),
    path === '/' ? Promise.resolve(null) : getPageSeo('/'),
  ]);
  const localized = seo?.translations?.[locale] as { title?: string; description?: string } | undefined;
  const title = localized?.title || seo?.title || fallback.title;
  const description = localized?.description || seo?.description || fallback.description;
  const image = seo?.open_graph_image_url || globalSeo?.open_graph_image_url || undefined;

  return {
    title,
    description,
    keywords: seo?.keywords?.length ? seo.keywords : undefined,
    alternates: seo?.canonical_url ? { canonical: seo.canonical_url } : undefined,
    robots: seo?.no_index ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' as const : 'summary' as const,
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
