-- ============================================================
-- FindComedy Phase 4 — community freshness
-- Run this in the Supabase SQL editor after 001_schema.sql.
-- ============================================================

-- ──────────────────────────────────────────
-- reports  ("Report a problem")
-- One report per user per night per type.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  night_id   TEXT        NOT NULL REFERENCES public.nights(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN (
               'no-longer-running','wrong-time','wrong-venue','wrong-info','other'
             )),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, night_id, type)
);

-- ──────────────────────────────────────────
-- reviews  (vibe-tag reviews)
-- One review per user per night.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  night_id     TEXT        NOT NULL REFERENCES public.nights(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT        NOT NULL DEFAULT 'Anonymous',
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, night_id)
);

-- ──────────────────────────────────────────
-- submissions  (submit-a-night form)
-- Insert-only via anon key; admin reviews via dashboard.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.submissions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  data             JSONB       NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected')),
  submitter_note   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- RLS policies
-- ──────────────────────────────────────────

ALTER TABLE public.reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- reports: counts visible to all; writes owned per user
CREATE POLICY "Reports are publicly readable"
  ON public.reports FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reports"
  ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reports"
  ON public.reports FOR DELETE USING (auth.uid() = user_id);

-- reviews: public read; one per user per night
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- submissions: anyone can submit; only admins read (via Supabase dashboard / service key)
CREATE POLICY "Anyone can submit a night"
  ON public.submissions FOR INSERT WITH CHECK (true);
