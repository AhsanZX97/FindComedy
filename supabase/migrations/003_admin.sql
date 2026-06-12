-- ============================================================
-- FindComedy Phase 5 — admin role
-- Run this in the Supabase SQL editor after 002_phase4.sql.
-- ============================================================

-- ──────────────────────────────────────────
-- admins
-- Membership granted only via direct SQL — no anon INSERT policy.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admins (
  user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can confirm their own membership; nobody can write via anon key.
CREATE POLICY "Admins can read admin list"
  ON public.admins FOR SELECT USING (auth.uid() = user_id);

-- ──────────────────────────────────────────
-- is_admin() helper
-- SECURITY DEFINER so it bypasses RLS on the admins table and avoids
-- infinite recursion when other policies call it.
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()); $$;

-- ──────────────────────────────────────────
-- nights: grant admin full write
-- (existing "Nights are publicly readable" policy stays)
-- ──────────────────────────────────────────
CREATE POLICY "Admins can insert nights"
  ON public.nights FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update nights"
  ON public.nights FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete nights"
  ON public.nights FOR DELETE USING (public.is_admin());

-- ──────────────────────────────────────────
-- submissions: admin can read the queue + update status
-- (existing "Anyone can submit a night" INSERT policy stays)
-- ──────────────────────────────────────────
CREATE POLICY "Admins can read submissions"
  ON public.submissions FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update submissions"
  ON public.submissions FOR UPDATE USING (public.is_admin());

-- ──────────────────────────────────────────
-- reviews: admin moderation delete
-- (existing owner-scoped policies stay)
-- ──────────────────────────────────────────
CREATE POLICY "Admins can delete any review"
  ON public.reviews FOR DELETE USING (public.is_admin());

-- ──────────────────────────────────────────
-- reports: admin resolve + delete
-- (existing owner-scoped policies stay)
-- ──────────────────────────────────────────
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any report"
  ON public.reports FOR DELETE USING (public.is_admin());

-- ──────────────────────────────────────────
-- Bootstrap — run once in Supabase SQL editor after first Google sign-in:
--
--   INSERT INTO public.admins (user_id)
--   SELECT id FROM auth.users WHERE email = '<your-google-email>'
--   ON CONFLICT DO NOTHING;
--
-- Verify:  SELECT public.is_admin();  -- must return true when signed in as admin
-- Revoke:  DELETE FROM public.admins WHERE user_id = '<uuid>';
-- ──────────────────────────────────────────
