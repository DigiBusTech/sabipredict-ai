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

-- 2. PREDICTIONS TABLE (With match results & outcomes)
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
    market TEXT NOT NULL,
    odds NUMERIC(6, 2) NOT NULL DEFAULT 1.50 CHECK (odds > 1.00),
    confidence_score INTEGER NOT NULL DEFAULT 70 CHECK (confidence_score BETWEEN 1 AND 100),
    ai_analysis TEXT NOT NULL DEFAULT '',
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'vip')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    home_score INTEGER DEFAULT NULL,
    away_score INTEGER DEFAULT NULL,
    prediction_outcome TEXT NOT NULL DEFAULT 'Pending' CHECK (prediction_outcome IN ('Pending', 'Won', 'Lost', 'Void')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_predictions_match_date ON public.predictions(match_date);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON public.predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_tier ON public.predictions(tier);
CREATE INDEX IF NOT EXISTS idx_predictions_outcome ON public.predictions(prediction_outcome);

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
    interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly', 'yearly', 'lifetime')),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

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
