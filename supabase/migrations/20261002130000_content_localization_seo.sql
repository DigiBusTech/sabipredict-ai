ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.policy_pages ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS source_locale TEXT NOT NULL DEFAULT 'en' CHECK (source_locale IN ('en', 'fr', 'es', 'pt'));

CREATE TABLE IF NOT EXISTS public.homepage_content (
    id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
    translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    hero_image_url TEXT,
    hero_image_alt JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.homepage_content (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.seo_metadata (
    path TEXT PRIMARY KEY CHECK (path LIKE '/%'),
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    canonical_url TEXT,
    open_graph_image_url TEXT,
    no_index BOOLEAN NOT NULL DEFAULT false,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_metadata ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.promo_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    placement TEXT NOT NULL CHECK (placement IN ('home-hero', 'home-feed', 'blog-sidebar', 'pricing-banner')),
    translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_url TEXT,
    target_url TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (target_url IS NULL OR target_url ~ '^https?://')
);
CREATE INDEX IF NOT EXISTS idx_promo_slots_active_dates ON public.promo_slots(placement, is_active, starts_at, ends_at, sort_order);

ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read homepage content" ON public.homepage_content;
CREATE POLICY "Public can read homepage content" ON public.homepage_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage homepage content" ON public.homepage_content;
CREATE POLICY "Admins manage homepage content" ON public.homepage_content FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can read indexable page SEO" ON public.seo_metadata;
CREATE POLICY "Public can read indexable page SEO" ON public.seo_metadata FOR SELECT USING (no_index = false);
DROP POLICY IF EXISTS "Admins manage SEO metadata" ON public.seo_metadata;
CREATE POLICY "Admins manage SEO metadata" ON public.seo_metadata FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view scheduled promo slots" ON public.promo_slots;
CREATE POLICY "Public can view scheduled promo slots" ON public.promo_slots FOR SELECT
    USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));
DROP POLICY IF EXISTS "Admins manage promo slots" ON public.promo_slots;
CREATE POLICY "Admins manage promo slots" ON public.promo_slots FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.seo_metadata (path, title, description, no_index) VALUES
    ('/', 'SabiPredict AI | Football Intelligence', 'AI-powered football analytics, predictions, and match insights.', false),
    ('/predictions', 'Football Predictions | SabiPredict AI', 'Date-filtered football predictions and settled outcomes.', false),
    ('/vip', 'VIP Lounge | SabiPredict AI', 'VIP football predictions and match analytics.', false),
    ('/pricing', 'Membership Plans | SabiPredict AI', 'Compare SabiPredict AI membership plans and billing intervals.', false),
    ('/blog', 'Football Strategy & News | SabiPredict AI', 'Tactical breakdowns, quantitative tutorials, and match previews.', false),
    ('/testimonials', 'Member Reviews | SabiPredict AI', 'Read member experiences and share your own review.', false),
    ('/terms', 'Terms and Conditions | SabiPredict AI', 'Terms for SabiPredict AI services and memberships.', false),
    ('/privacy', 'Privacy Policy | SabiPredict AI', 'How SabiPredict AI handles account and site data.', false),
    ('/affiliate-policy', 'Affiliate Policy | SabiPredict AI', 'Referral eligibility, commission timing, and payout terms.', false),
    ('/account', 'My Account | SabiPredict AI', 'Manage your SabiPredict AI account and membership.', true),
    ('/login', 'Sign In | SabiPredict AI', 'Sign in to your SabiPredict AI account.', true),
    ('/signup', 'Create an Account | SabiPredict AI', 'Create a SabiPredict AI account.', true),
    ('/vip/affiliate', 'Affiliate Program | SabiPredict AI', 'Referral dashboard for active members.', true),
    ('/support/appeal', 'Account Appeal | SabiPredict AI', 'Account review and appeal center.', true),
    ('/admin', 'Admin | SabiPredict AI', 'SabiPredict AI administration.', true)
ON CONFLICT (path) DO NOTHING;