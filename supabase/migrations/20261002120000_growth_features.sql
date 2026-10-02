ALTER TABLE public.subscription_plans
    ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE public.subscription_plans
    DROP CONSTRAINT IF EXISTS subscription_plans_interval_check;
ALTER TABLE public.subscription_plans
    ADD CONSTRAINT subscription_plans_interval_check
    CHECK (interval IN ('weekly', 'monthly', 'yearly', 'lifetime'));
ALTER TABLE public.subscription_plans
    ADD CONSTRAINT subscription_plans_tier_check
    CHECK (tier IN ('free', 'standard', 'gold', 'platinum'));
UPDATE public.subscription_plans
   SET tier = 'free'
 WHERE lower(id) LIKE '%free%' OR lower(name) LIKE '%free%';
UPDATE public.subscription_plans SET tier = 'standard' WHERE id IN ('plan_vip_monthly', 'plan_vip_yearly');

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

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS current_plan_id TEXT;

CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 80),
    avatar_url TEXT,
    role_title TEXT NOT NULL DEFAULT 'SabiPredict Member' CHECK (char_length(role_title) <= 100),
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 20 AND 1500),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_testimonials_public ON public.testimonials(status, is_featured, created_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_referral_attributions_referrer ON public.referral_attributions(referrer_id, created_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_affiliate_ledger_user_created ON public.affiliate_ledger(user_id, created_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_requests_status ON public.affiliate_payout_requests(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_requests_user ON public.affiliate_payout_requests(user_id, requested_at DESC);

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
INSERT INTO public.policy_pages (slug, title, content, is_published) VALUES
    ('terms', 'Terms and Conditions', '', false),
    ('privacy', 'Privacy Policy', '', false),
    ('affiliate-policy', 'Affiliate Policy', '', false)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_pages ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION public.approve_subscription_with_commission(p_pending_id UUID, p_admin_id UUID, p_admin_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Admin privileges required';
    END IF;

    SELECT ps.user_id, ps.plan_id, sp.price, sp.interval
      INTO v_user_id, v_plan_id, v_plan_price, v_plan_interval
      FROM public.pending_subscriptions ps
      JOIN public.subscription_plans sp ON sp.id = ps.plan_id
     WHERE ps.id = p_pending_id AND ps.status = 'pending'
     FOR UPDATE OF ps;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pending subscription not found'; END IF;

    v_duration := CASE v_plan_interval
        WHEN 'weekly' THEN INTERVAL '7 days'
        WHEN 'yearly' THEN INTERVAL '1 year'
        WHEN 'lifetime' THEN INTERVAL '100 years'
        ELSE INTERVAL '1 month'
    END;

    UPDATE public.profiles
       SET role = 'vip_user', subscription_status = 'active', subscription_tier = 'vip',
           current_plan_id = v_plan_id,
           vip_until = greatest(coalesce(vip_until, now()), now()) + v_duration,
           updated_at = now()
     WHERE id = v_user_id;
    UPDATE public.pending_subscriptions
       SET status = 'approved', admin_notes = coalesce(nullif(trim(p_admin_notes), ''), 'Approved by administrator'), updated_at = now()
     WHERE id = p_pending_id;

    SELECT ra.referrer_id INTO v_referrer_id
      FROM public.referral_attributions ra
     WHERE ra.referred_user_id = v_user_id;
    SELECT commission_percent INTO v_commission_percent FROM public.affiliate_settings WHERE id = true;
    SELECT status INTO v_account_status FROM public.account_moderation WHERE user_id = v_referrer_id;

    IF v_referrer_id IS NOT NULL AND coalesce(v_account_status, 'active') = 'active' AND coalesce(v_commission_percent, 0) > 0 THEN
        INSERT INTO public.affiliate_ledger (user_id, referred_user_id, source_pending_subscription_id, entry_type, amount, description)
        VALUES (
            v_referrer_id,
            v_user_id,
            p_pending_id,
            'commission',
            round(v_plan_price * v_commission_percent / 100, 2),
            format('%s%% commission for confirmed %s subscription', v_commission_percent, v_plan_id)
        )
        ON CONFLICT (source_pending_subscription_id) WHERE entry_type = 'commission' AND source_pending_subscription_id IS NOT NULL DO NOTHING;
    END IF;
    RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.approve_subscription_with_commission(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_subscription_with_commission(UUID, UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.request_affiliate_payout(
    p_user_id UUID,
    p_amount NUMERIC,
    p_method TEXT,
    p_details TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance NUMERIC(10, 2);
    v_minimum NUMERIC(10, 2);
    v_status TEXT;
    v_request_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN RAISE EXCEPTION 'Account not found'; END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
         WHERE id = p_user_id AND role = 'vip_user' AND subscription_status = 'active'
           AND (vip_until IS NULL OR vip_until > now())
    ) THEN RAISE EXCEPTION 'An active VIP subscription is required'; END IF;
    SELECT status INTO v_status FROM public.account_moderation WHERE user_id = p_user_id;
    IF coalesce(v_status, 'active') <> 'active' THEN RAISE EXCEPTION 'Account is not eligible to request a payout'; END IF;
    IF p_amount <= 0 OR p_method NOT IN ('bank', 'crypto') OR char_length(p_details) NOT BETWEEN 5 AND 2000 THEN
        RAISE EXCEPTION 'Invalid payout request';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
    SELECT coalesce(sum(amount), 0) INTO v_balance FROM public.affiliate_ledger WHERE user_id = p_user_id;
    SELECT coalesce(sum(amount), 0) INTO v_minimum FROM public.affiliate_payout_requests
     WHERE user_id = p_user_id AND status IN ('pending', 'approved', 'paid');
    v_balance := v_balance - v_minimum;
    SELECT minimum_payout INTO v_minimum FROM public.affiliate_settings WHERE id = true;
    IF p_amount < coalesce(v_minimum, 0) THEN RAISE EXCEPTION 'Request is below the minimum payout'; END IF;
    IF p_amount > v_balance THEN RAISE EXCEPTION 'Requested amount exceeds available commission balance'; END IF;

    INSERT INTO public.affiliate_payout_requests (user_id, amount, payout_method, payout_details)
    VALUES (p_user_id, round(p_amount, 2), p_method, trim(p_details))
    RETURNING id INTO v_request_id;
    RETURN v_request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.request_affiliate_payout(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_affiliate_payout(UUID, NUMERIC, TEXT, TEXT) TO service_role;