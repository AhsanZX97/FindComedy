-- ============================================================
-- FindComedy Phase 3 — initial schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor).
-- ============================================================

-- ──────────────────────────────────────────
-- nights
-- Nested fields (bringer, schedule, venue, etc.) stored as JSONB
-- so the TS type maps directly with minimal transformation.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nights (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  type          TEXT        NOT NULL CHECK (type IN ('open-mic','showcase','pro','mixed')),
  levels        TEXT[]      NOT NULL DEFAULT '{}',
  bringer       JSONB       NOT NULL DEFAULT '{}',
  schedule      JSONB       NOT NULL DEFAULT '{}',
  venue         JSONB       NOT NULL DEFAULT '{}',
  pricing       JSONB       NOT NULL DEFAULT '{}',
  how_to_book   JSONB       NOT NULL DEFAULT '{}',
  socials       JSONB       NOT NULL DEFAULT '{}',
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','gone')),
  last_verified DATE        NOT NULL,
  images        TEXT[],
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- profiles  (1-to-1 with auth.users)
-- Auto-created by the trigger below on first sign-in.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT        NOT NULL DEFAULT 'Anonymous',
  avatar_url   TEXT,
  role         TEXT        NOT NULL DEFAULT 'punter' CHECK (role IN ('punter','comic','promoter')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- favourites
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favourites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  night_id   TEXT        NOT NULL REFERENCES public.nights(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, night_id)
);

-- ──────────────────────────────────────────
-- attendance  ("I'm going")
-- occurrence_date is NULL for the next occurrence of a recurring night.
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  night_id        TEXT        NOT NULL REFERENCES public.nights(id) ON DELETE CASCADE,
  occurrence_date DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, night_id, occurrence_date)
);

-- ──────────────────────────────────────────
-- RLS policies  (written before any data lands)
-- ──────────────────────────────────────────

ALTER TABLE public.nights    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- nights: public read; no writes via anon key (data managed through Supabase dashboard or admin tooling)
CREATE POLICY "Nights are publicly readable"
  ON public.nights FOR SELECT USING (true);

-- profiles: public read; users can write their own row
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- favourites: private per user
CREATE POLICY "Users can read their own favourites"
  ON public.favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favourites"
  ON public.favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favourites"
  ON public.favourites FOR DELETE USING (auth.uid() = user_id);

-- attendance: counts are public; writes are private
CREATE POLICY "Attendance is publicly readable"
  ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Users can insert their own attendance"
  ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own attendance"
  ON public.attendance FOR DELETE USING (auth.uid() = user_id);

-- ──────────────────────────────────────────
-- Auto-create profile on first sign-in
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Anonymous')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
