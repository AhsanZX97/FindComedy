-- ============================================================
-- FindComedy Phase 6 — site feedback
-- Run this in the Supabase SQL editor after 003_admin.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.site_feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message    TEXT        NOT NULL,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit feedback.
CREATE POLICY "Anyone can submit feedback"
  ON public.site_feedback FOR INSERT WITH CHECK (true);

-- Only admins can read feedback.
CREATE POLICY "Admins can read feedback"
  ON public.site_feedback FOR SELECT USING (public.is_admin());

-- Only admins can delete feedback.
CREATE POLICY "Admins can delete feedback"
  ON public.site_feedback FOR DELETE USING (public.is_admin());
