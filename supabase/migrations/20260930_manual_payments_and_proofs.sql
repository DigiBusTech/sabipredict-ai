-- =============================================================================
-- SABIPREDICT AI - SUPABASE MIGRATION: MANUAL PAYMENTS, PROOFS & TELEMETRY
-- Run this script in the Supabase Dashboard -> SQL Editor -> Click 'Run'
-- =============================================================================

-- 1. Ensure 'vip_until' exists on public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vip_until TIMESTAMPTZ;

-- 2. Create manual_payment_methods table
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

-- 3. Create pending_subscriptions table
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

CREATE INDEX IF NOT EXISTS idx_pending_subs_user_id ON public.pending_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_subs_status ON public.pending_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pending_subs_created_at ON public.pending_subscriptions(created_at);

-- 4. Create subscription_reminder_logs table (if not already present)
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

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.manual_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_reminder_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for manual_payment_methods
DROP POLICY IF EXISTS "Public can view active payment methods" ON public.manual_payment_methods;
CREATE POLICY "Public can view active payment methods" 
    ON public.manual_payment_methods FOR SELECT 
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on manual payment methods" ON public.manual_payment_methods;
CREATE POLICY "Admin full access on manual payment methods" 
    ON public.manual_payment_methods FOR ALL 
    USING (public.is_admin());

-- 7. RLS Policies for pending_subscriptions
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

-- 8. RLS Policies for subscription_reminder_logs
DROP POLICY IF EXISTS "Admin full access on reminder logs" ON public.subscription_reminder_logs;
CREATE POLICY "Admin full access on reminder logs" 
    ON public.subscription_reminder_logs FOR ALL 
    USING (public.is_admin());

-- 9. Storage Bucket: payment-proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-proofs',
    'payment-proofs',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

-- Storage RLS Policies for payment-proofs
DROP POLICY IF EXISTS "Public can view payment proofs" ON storage.objects;
CREATE POLICY "Public can view payment proofs" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment proofs" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');
