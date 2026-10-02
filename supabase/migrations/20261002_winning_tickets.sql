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

ALTER TABLE public.winning_tickets ENABLE ROW LEVEL SECURITY;

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