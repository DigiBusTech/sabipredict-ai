-- =============================================================================
-- SABIPREDICT AI - PRODUCTION SUPABASE POSTGRESQL SCHEMA WITH RBAC & RLS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS PROFILES TABLE (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'free_user' CHECK (role IN ('admin', 'vip_user', 'free_user')),
    subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due')),
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'vip')),
    vip_until TIMESTAMPTZ,
    avatar_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Automatic Profile Creation Trigger on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, subscription_status, subscription_tier)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'free_user'),
        'inactive',
        'free'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function: Is current user an Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Has current user VIP or Admin access?
CREATE OR REPLACE FUNCTION public.has_vip_access()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'admin' OR (role = 'vip_user' AND subscription_status = 'active'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIXTURES TABLE (Supports both Sportsmonks numeric IDs and The Odds API string hashes like c54a807...)
CREATE TABLE IF NOT EXISTS public.fixtures (
    fixture_id TEXT PRIMARY KEY,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_logo TEXT DEFAULT '',
    away_logo TEXT DEFAULT '',
    league TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'International',
    match_date DATE NOT NULL,
    match_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    starting_at TIMESTAMPTZ,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fixtures_match_date ON public.fixtures(match_date);

-- 3. PREDICTIONS TABLE (With match results & outcomes, accepts string hashes or numeric IDs)
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_logo TEXT DEFAULT '',
    away_logo TEXT DEFAULT '',
    league TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'International',
    match_date DATE NOT NULL,
    match_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    starting_at TIMESTAMPTZ,
    market TEXT NOT NULL,
    odds NUMERIC(6, 2) NOT NULL DEFAULT 1.50 CHECK (odds > 1.00),
    confidence_score INTEGER NOT NULL DEFAULT 70 CHECK (confidence_score BETWEEN 1 AND 100),
    ai_analysis TEXT NOT NULL DEFAULT '',
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'vip')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    home_score INTEGER DEFAULT NULL,
    away_score INTEGER DEFAULT NULL,
    prediction_outcome TEXT NOT NULL DEFAULT 'Pending' CHECK (prediction_outcome IN ('Pending', 'Won', 'Lost', 'Void')),
    result TEXT NOT NULL DEFAULT 'pending',
    raw_data JSONB DEFAULT '{}'::jsonb,
    translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure fixture_id is TEXT (converts from INTEGER or UUID if previously configured)
ALTER TABLE IF EXISTS public.predictions ALTER COLUMN fixture_id TYPE TEXT;
ALTER TABLE IF EXISTS public.predictions ADD COLUMN IF NOT EXISTS starting_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.predictions ADD COLUMN IF NOT EXISTS result TEXT DEFAULT 'pending';
ALTER TABLE IF EXISTS public.predictions ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_predictions_fixture_id ON public.predictions(fixture_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_date ON public.predictions(match_date);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON public.predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_tier ON public.predictions(tier);
CREATE INDEX IF NOT EXISTS idx_predictions_outcome ON public.predictions(prediction_outcome);
CREATE INDEX IF NOT EXISTS idx_predictions_result ON public.predictions(result);

-- 3. BLOG POSTS TABLE
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    author TEXT NOT NULL DEFAULT 'SabiPredict AI Editorial',
    cover_image TEXT,
    published BOOLEAN NOT NULL DEFAULT true,
    category TEXT DEFAULT 'Betting Intelligence',
    read_time TEXT DEFAULT '4 min',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published);

-- 4. SYSTEM SETTINGS TABLE (Sportsmonks, Payment Gateways & LLM configurations)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. SUBSCRIPTION PLANS TABLE (Admin Managed Plans)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('weekly', 'monthly', 'yearly', 'lifetime')),
    tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('free', 'standard', 'gold', 'platinum')),
    translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- 6. SUBSCRIPTION REMINDER LOGS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('5_days', '3_days', 'exact_day', 'manual')),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
    vip_until TIMESTAMPTZ,
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_id ON public.subscription_reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON public.subscription_reminder_logs(sent_at);

-- 7. MANUAL PAYMENT METHODS TABLE (Dynamic Crypto, E-Wallets, Bank Transfers)
CREATE TABLE IF NOT EXISTS public.manual_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    method_name TEXT NOT NULL,
    account_details TEXT NOT NULL,
    instructions TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    require_file_proof BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_manual_payment_active ON public.manual_payment_methods(is_active);

-- 8. PENDING SUBSCRIPTIONS TABLE (User submissions awaiting admin verification)
CREATE TABLE IF NOT EXISTS public.pending_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    payment_method_used TEXT NOT NULL,
    transaction_reference TEXT NOT NULL,
    proof_file_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_plan_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 80),
    avatar_url TEXT,
    role_title TEXT NOT NULL DEFAULT 'SabiPredict Member' CHECK (char_length(role_title) <= 100),
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 20 AND 1500),
    translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_locale TEXT NOT NULL DEFAULT 'en' CHECK (source_locale IN ('en', 'fr', 'es', 'pt')),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_settings (
    id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
    commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 15 CHECK (commission_percent BETWEEN 0 AND 20),
    minimum_payout NUMERIC(10, 2) NOT NULL DEFAULT 20 CHECK (minimum_payout >= 0),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.affiliate_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL UNIQUE CHECK (referral_code ~ '^[A-Z0-9]{8,16}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (referrer_id <> referred_user_id)
);

CREATE TABLE IF NOT EXISTS public.affiliate_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    source_pending_subscription_id UUID REFERENCES public.pending_subscriptions(id) ON DELETE SET NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('commission', 'adjustment', 'reversal')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount <> 0),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_ledger_subscription_commission
    ON public.affiliate_ledger(source_pending_subscription_id)
    WHERE entry_type = 'commission' AND source_pending_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.affiliate_payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payout_method TEXT NOT NULL CHECK (payout_method IN ('bank', 'crypto')),
    payout_details TEXT NOT NULL CHECK (char_length(payout_details) BETWEEN 5 AND 2000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    admin_note TEXT,
    payment_reference TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.account_moderation (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'suspended', 'banned')),
    reason TEXT,
    previous_role TEXT,
    previous_subscription_tier TEXT,
    previous_plan_id TEXT,
    previous_subscription_status TEXT,
    previous_vip_until TIMESTAMPTZ,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 30 AND 3000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reinstated', 'rejected')),
    admin_response TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_appeals_one_pending
    ON public.account_appeals(user_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.policy_pages (
    slug TEXT PRIMARY KEY CHECK (slug IN ('terms', 'privacy', 'affiliate-policy')),
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.policy_pages ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
INSERT INTO public.policy_pages (slug, title, content, is_published) VALUES
    ('terms', 'Terms and Conditions', '', false),
    ('privacy', 'Privacy Policy', '', false),
    ('affiliate-policy', 'Affiliate Policy', '', false)
ON CONFLICT (slug) DO NOTHING;

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
    translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    no_index BOOLEAN NOT NULL DEFAULT false,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.winning_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    win_date DATE NOT NULL,
    bet_date DATE,
    caption TEXT NOT NULL DEFAULT '' CHECK (char_length(caption) <= 240),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    moderation_note TEXT,
    moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CHECK (bet_date IS NULL OR bet_date <= win_date)
);

CREATE INDEX IF NOT EXISTS idx_winning_tickets_win_date_status
    ON public.winning_tickets(win_date, status);
CREATE INDEX IF NOT EXISTS idx_winning_tickets_user_created
    ON public.winning_tickets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pending_subs_user_id ON public.pending_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_subs_status ON public.pending_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pending_subs_created_at ON public.pending_subscriptions(created_at);



-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view fixtures" ON public.fixtures;
CREATE POLICY "Public can view fixtures" ON public.fixtures FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full control on fixtures" ON public.fixtures;
CREATE POLICY "Admin full control on fixtures" ON public.fixtures FOR ALL USING (public.is_admin());

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winning_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_slots ENABLE ROW LEVEL SECURITY;


-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admin full control on profiles" ON public.profiles;
CREATE POLICY "Admin full control on profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- PREDICTIONS POLICIES
-- 1. Free predictions: Publicly readable when approved
DROP POLICY IF EXISTS "Public can view approved free predictions" ON public.predictions;
CREATE POLICY "Public can view approved free predictions"
    ON public.predictions FOR SELECT
    USING (status = 'approved' AND tier = 'free');

-- 2. VIP predictions: Readable only by authenticated users with VIP or Admin role
DROP POLICY IF EXISTS "VIP and Admins can view approved VIP predictions" ON public.predictions;
CREATE POLICY "VIP and Admins can view approved VIP predictions"
    ON public.predictions FOR SELECT
    USING (status = 'approved' AND tier = 'vip' AND public.has_vip_access());

-- 3. Admin Full Management: Admin can view all statuses (pending/approved/rejected) and write/update/delete
DROP POLICY IF EXISTS "Admin full access on predictions" ON public.predictions;
CREATE POLICY "Admin full access on predictions"
    ON public.predictions FOR ALL
    USING (public.is_admin());

-- BLOG POSTS POLICIES
DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;
CREATE POLICY "Public can view published blog posts"
    ON public.blog_posts FOR SELECT
    USING (published = true);

DROP POLICY IF EXISTS "Admin full access on blog posts" ON public.blog_posts;
CREATE POLICY "Admin full access on blog posts"
    ON public.blog_posts FOR ALL
    USING (public.is_admin());

-- SYSTEM SETTINGS POLICIES (Only Admin access)
DROP POLICY IF EXISTS "Admin full access on system_settings" ON public.system_settings;
CREATE POLICY "Admin full access on system_settings"
    ON public.system_settings FOR ALL
    USING (public.is_admin());

-- SUBSCRIPTION PLANS POLICIES
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can view active subscription plans"
    ON public.subscription_plans FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access on subscription plans" ON public.subscription_plans;
CREATE POLICY "Admin full access on subscription plans"
    ON public.subscription_plans FOR ALL
    USING (public.is_admin());
-- SUBSCRIPTION REMINDER LOGS POLICIES
DROP POLICY IF EXISTS "Admin full access on reminder logs" ON public.subscription_reminder_logs;
CREATE POLICY "Admin full access on reminder logs"
    ON public.subscription_reminder_logs FOR ALL
    USING (public.is_admin());

-- MANUAL PAYMENT METHODS POLICIES
DROP POLICY IF EXISTS "Public can view active payment methods" ON public.manual_payment_methods;
CREATE POLICY "Public can view active payment methods"
    ON public.manual_payment_methods FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on manual payment methods" ON public.manual_payment_methods;
CREATE POLICY "Admin full access on manual payment methods"
    ON public.manual_payment_methods FOR ALL
    USING (public.is_admin());

-- PENDING SUBSCRIPTIONS POLICIES
DROP POLICY IF EXISTS "Users can insert own pending subscriptions" ON public.pending_subscriptions;
CREATE POLICY "Users can insert own pending subscriptions"
    ON public.pending_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own pending subscriptions" ON public.pending_subscriptions;
CREATE POLICY "Users can view own pending subscriptions"
    ON public.pending_subscriptions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on pending subscriptions" ON public.pending_subscriptions;
CREATE POLICY "Admin full access on pending subscriptions"
    ON public.pending_subscriptions FOR ALL
    USING (public.is_admin());

-- WINNING TICKETS POLICIES
DROP POLICY IF EXISTS "Public can view approved winning tickets" ON public.winning_tickets;
CREATE POLICY "Public can view approved winning tickets"
    ON public.winning_tickets FOR SELECT
    USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view own winning tickets" ON public.winning_tickets;
CREATE POLICY "Users can view own winning tickets"
    ON public.winning_tickets FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit own winning tickets" ON public.winning_tickets;
CREATE POLICY "Users can submit own winning tickets"
    ON public.winning_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admin full access on winning tickets" ON public.winning_tickets;
CREATE POLICY "Admin full access on winning tickets"
    ON public.winning_tickets FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view approved testimonials" ON public.testimonials;
CREATE POLICY "Public can view approved testimonials" ON public.testimonials FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS "Users can submit testimonials for review" ON public.testimonials;
CREATE POLICY "Users can submit testimonials for review" ON public.testimonials FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id AND status = 'pending' AND is_featured = false);
DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public can view affiliate settings" ON public.affiliate_settings;
CREATE POLICY "Public can view affiliate settings" ON public.affiliate_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage affiliate settings" ON public.affiliate_settings;
CREATE POLICY "Admins manage affiliate settings" ON public.affiliate_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Users view own affiliate profile" ON public.affiliate_profiles;
CREATE POLICY "Users view own affiliate profile" ON public.affiliate_profiles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users view relevant referral attribution" ON public.referral_attributions;
CREATE POLICY "Users view relevant referral attribution" ON public.referral_attributions FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users view own affiliate ledger" ON public.affiliate_ledger;
CREATE POLICY "Users view own affiliate ledger" ON public.affiliate_ledger FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users view own payout requests" ON public.affiliate_payout_requests;
CREATE POLICY "Users view own payout requests" ON public.affiliate_payout_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage payout requests" ON public.affiliate_payout_requests;
CREATE POLICY "Admins manage payout requests" ON public.affiliate_payout_requests FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Users view own moderation status" ON public.account_moderation;
CREATE POLICY "Users view own moderation status" ON public.account_moderation FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage account moderation" ON public.account_moderation;
CREATE POLICY "Admins manage account moderation" ON public.account_moderation FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Users view own appeals" ON public.account_appeals;
CREATE POLICY "Users view own appeals" ON public.account_appeals FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users submit own appeals" ON public.account_appeals;
CREATE POLICY "Users submit own appeals" ON public.account_appeals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
DROP POLICY IF EXISTS "Admins manage appeals" ON public.account_appeals;
CREATE POLICY "Admins manage appeals" ON public.account_appeals FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Public can view published policies" ON public.policy_pages;
CREATE POLICY "Public can view published policies" ON public.policy_pages FOR SELECT USING (is_published = true OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage policies" ON public.policy_pages;
CREATE POLICY "Admins manage policies" ON public.policy_pages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Public can read homepage content" ON public.homepage_content;
CREATE POLICY "Public can read homepage content" ON public.homepage_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage homepage content" ON public.homepage_content;
CREATE POLICY "Admins manage homepage content" ON public.homepage_content FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Public can read indexable page SEO" ON public.seo_metadata;
CREATE POLICY "Public can read indexable page SEO" ON public.seo_metadata FOR SELECT USING (no_index = false);
DROP POLICY IF EXISTS "Admins manage SEO metadata" ON public.seo_metadata;
CREATE POLICY "Admins manage SEO metadata" ON public.seo_metadata FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Public can view scheduled promo slots" ON public.promo_slots;
CREATE POLICY "Public can view scheduled promo slots" ON public.promo_slots FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));
DROP POLICY IF EXISTS "Admins manage promo slots" ON public.promo_slots;
CREATE POLICY "Admins manage promo slots" ON public.promo_slots FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.approve_subscription_with_commission(p_pending_id UUID, p_admin_id UUID, p_admin_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID;
    v_plan_id TEXT;
    v_plan_price NUMERIC(10, 2);
    v_plan_interval TEXT;
    v_referrer_id UUID;
    v_commission_percent NUMERIC(5, 2);
    v_account_status TEXT;
    v_duration INTERVAL;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN RAISE EXCEPTION 'Admin privileges required'; END IF;
    SELECT ps.user_id, ps.plan_id, sp.price, sp.interval INTO v_user_id, v_plan_id, v_plan_price, v_plan_interval
      FROM public.pending_subscriptions ps JOIN public.subscription_plans sp ON sp.id = ps.plan_id
     WHERE ps.id = p_pending_id AND ps.status = 'pending' FOR UPDATE OF ps;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pending subscription not found'; END IF;
    v_duration := CASE v_plan_interval WHEN 'weekly' THEN INTERVAL '7 days' WHEN 'yearly' THEN INTERVAL '1 year' WHEN 'lifetime' THEN INTERVAL '100 years' ELSE INTERVAL '1 month' END;
    UPDATE public.profiles SET role = 'vip_user', subscription_status = 'active', subscription_tier = 'vip',
        current_plan_id = v_plan_id, vip_until = greatest(coalesce(vip_until, now()), now()) + v_duration, updated_at = now()
     WHERE id = v_user_id;
    UPDATE public.pending_subscriptions SET status = 'approved', admin_notes = coalesce(nullif(trim(p_admin_notes), ''), 'Approved by administrator'), updated_at = now()
     WHERE id = p_pending_id;
    SELECT referrer_id INTO v_referrer_id FROM public.referral_attributions WHERE referred_user_id = v_user_id;
    SELECT commission_percent INTO v_commission_percent FROM public.affiliate_settings WHERE id = true;
    SELECT status INTO v_account_status FROM public.account_moderation WHERE user_id = v_referrer_id;
    IF v_referrer_id IS NOT NULL AND coalesce(v_account_status, 'active') = 'active' AND coalesce(v_commission_percent, 0) > 0 THEN
        INSERT INTO public.affiliate_ledger (user_id, referred_user_id, source_pending_subscription_id, entry_type, amount, description)
        VALUES (v_referrer_id, v_user_id, p_pending_id, 'commission', round(v_plan_price * v_commission_percent / 100, 2),
            format('%s%% commission for confirmed %s subscription', v_commission_percent, v_plan_id))
        ON CONFLICT (source_pending_subscription_id) WHERE entry_type = 'commission' AND source_pending_subscription_id IS NOT NULL DO NOTHING;
    END IF;
    RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.approve_subscription_with_commission(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_subscription_with_commission(UUID, UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.request_affiliate_payout(p_user_id UUID, p_amount NUMERIC, p_method TEXT, p_details TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_balance NUMERIC(10, 2);
    v_minimum NUMERIC(10, 2);
    v_reserved NUMERIC(10, 2);
    v_status TEXT;
    v_request_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'vip_user' AND subscription_status = 'active' AND (vip_until IS NULL OR vip_until > now())) THEN RAISE EXCEPTION 'An active VIP subscription is required'; END IF;
    SELECT status INTO v_status FROM public.account_moderation WHERE user_id = p_user_id;
    IF coalesce(v_status, 'active') <> 'active' THEN RAISE EXCEPTION 'Account is not eligible to request a payout'; END IF;
    IF p_amount <= 0 OR p_method NOT IN ('bank', 'crypto') OR char_length(p_details) NOT BETWEEN 5 AND 2000 THEN RAISE EXCEPTION 'Invalid payout request'; END IF;
    PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
    SELECT coalesce(sum(amount), 0) INTO v_balance FROM public.affiliate_ledger WHERE user_id = p_user_id;
    SELECT coalesce(sum(amount), 0) INTO v_reserved FROM public.affiliate_payout_requests WHERE user_id = p_user_id AND status IN ('pending', 'approved', 'paid');
    v_balance := v_balance - v_reserved;
    SELECT minimum_payout INTO v_minimum FROM public.affiliate_settings WHERE id = true;
    IF p_amount < coalesce(v_minimum, 0) THEN RAISE EXCEPTION 'Request is below the minimum payout'; END IF;
    IF p_amount > v_balance THEN RAISE EXCEPTION 'Requested amount exceeds available commission balance'; END IF;
    INSERT INTO public.affiliate_payout_requests (user_id, amount, payout_method, payout_details) VALUES (p_user_id, round(p_amount, 2), p_method, trim(p_details)) RETURNING id INTO v_request_id;
    RETURN v_request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.request_affiliate_payout(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_affiliate_payout(UUID, NUMERIC, TEXT, TEXT) TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'winning-tickets',
    'winning-tickets',
    false,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

DROP POLICY IF EXISTS "Users can upload own winning ticket images" ON storage.objects;
CREATE POLICY "Users can upload own winning ticket images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'winning-tickets'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can view own winning ticket images" ON storage.objects;
CREATE POLICY "Users can view own winning ticket images"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'winning-tickets'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- =============================================================================
-- INITIAL DEFAULT SYSTEM SETTINGS & SEED PLANS
-- =============================================================================

INSERT INTO public.system_settings (key, value, description) VALUES
(
    'sportsmonks',
    '{"api_key": ""}'::jsonb,
    'Sportsmonks Football API v3 credentials'
),
(
    'payment_gateways',
    '{"active_provider": "paystack", "stripe_public_key": "", "stripe_secret_key": "", "paystack_public_key": "", "paystack_secret_key": "", "manual_bank_details": "Bank Name: Sabi Bank, Account: 0123456789, Ref: Your Email"}'::jsonb,
    'Stripe, Paystack, and manual bank payment configuration'
),
(
    'ai_llm_settings',
    '{"active_provider": "groq", "model": "llama-3.3-70b-versatile", "gemini_api_key": "", "groq_api_key": "", "system_prompt": "You are SabiPredict AI, an elite quantitative sports betting analyst. Evaluate the football fixture using Poisson expected goals (xG), recent team form, and head-to-head records. Propose a high-value betting market with estimated odds, probability, and a concise tactical rationale paragraph explaining why the selection has positive expected value (+EV)."}'::jsonb,
    'Active LLM provider (Gemini or Groq), model selection, and prompt template'
,
(
    'site_branding',
    '{"site_name": "SabiPredict AI", "site_tagline": "Quantitative Football Intelligence", "logo_url": "", "favicon_url": ""}'::jsonb,
    'Site branding configuration including logo and favicon'
)
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.subscription_plans (id, name, price, currency, interval, features, is_active) VALUES
(
    'plan_free',
    'Free Starter',
    0.00,
    'USD',
    'monthly',
    '["Daily 3-5 Free AI Predictions", "Standard Expected Goals (xG) metrics", "Historical results & accuracy audit", "Access to Betting Strategy Blog"]'::jsonb,
    true
),
(
    'plan_vip_monthly',
    'VIP Lounge Monthly',
    29.99,
    'USD',
    'monthly',
    '["All Free features included", "High-Confidence 80%+ VIP Value Bets", "Daily Banker of the Day (Max Kelly Edge)", "Detailed xG & AI Tactical Breakdown", "Instant Match Outcome & Score Alerts", "Priority 24/7 VIP Community Access"]'::jsonb,
    true
),
(
    'plan_vip_yearly',
    'VIP Lounge Annual',
    249.99,
    'USD',
    'yearly',
    '["All VIP Monthly perks", "2 Months Free discount", "Exclusive Weekend Multi-Bet Accumulators", "Direct Quantitative Analyst Support"]'::jsonb,
    true
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.subscription_plans
     SET tier = CASE WHEN lower(id) LIKE '%free%' OR lower(name) LIKE '%free%' THEN 'free' ELSE 'standard' END
 WHERE tier = 'standard' AND (lower(id) LIKE '%free%' OR id IN ('plan_vip_monthly', 'plan_vip_yearly'));

INSERT INTO public.subscription_plans (id, name, price, currency, interval, tier, features, is_active) VALUES
        ('plan_standard_weekly', 'Standard VIP Weekly', 7.50, 'USD', 'weekly', 'standard', '["VIP predictions", "Match analytics"]'::jsonb, true),
        ('plan_standard_monthly', 'Standard VIP Monthly', 30.00, 'USD', 'monthly', 'standard', '["VIP predictions", "Match analytics"]'::jsonb, true),
        ('plan_standard_yearly', 'Standard VIP Yearly', 300.00, 'USD', 'yearly', 'standard', '["VIP predictions", "Match analytics"]'::jsonb, true),
        ('plan_gold_weekly', 'Gold VIP Weekly', 15.00, 'USD', 'weekly', 'gold', '["All Standard benefits", "Priority analytics"]'::jsonb, true),
        ('plan_gold_monthly', 'Gold VIP Monthly', 60.00, 'USD', 'monthly', 'gold', '["All Standard benefits", "Priority analytics"]'::jsonb, true),
        ('plan_gold_yearly', 'Gold VIP Yearly', 600.00, 'USD', 'yearly', 'gold', '["All Standard benefits", "Priority analytics"]'::jsonb, true),
        ('plan_platinum_weekly', 'Platinum VIP Weekly', 25.00, 'USD', 'weekly', 'platinum', '["All Gold benefits", "Enhanced analytics"]'::jsonb, true),
        ('plan_platinum_monthly', 'Platinum VIP Monthly', 100.00, 'USD', 'monthly', 'platinum', '["All Gold benefits", "Enhanced analytics"]'::jsonb, true),
        ('plan_platinum_yearly', 'Platinum VIP Yearly', 1000.00, 'USD', 'yearly', 'platinum', '["All Gold benefits", "Enhanced analytics"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 5. SUBSCRIPTION PLANS TABLE (Admin Managed Plans)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly', 'yearly', 'lifetime')),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
