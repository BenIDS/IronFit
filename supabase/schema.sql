-- ═══════════════════════════════════════════════════════════════════
-- IronFit — Database Schema
-- Paste this entire file into Supabase SQL Editor and run.
-- Safe to re-run: uses IF NOT EXISTS everywhere.
-- ═══════════════════════════════════════════════════════════════════

-- ─── PROFILES ──────────────────────────────────────────────────────
-- Extends auth.users with app-specific fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  sex TEXT,
  height_cm NUMERIC,
  current_weight_kg NUMERIC,
  goal_weight_kg NUMERIC,
  primary_goal TEXT,
  activity_level TEXT,
  training_experience TEXT,
  step_goal INTEGER DEFAULT 10000,
  avg_sleep_hrs NUMERIC,
  injuries TEXT,
  notes TEXT,
  hydration_target_ml INTEGER DEFAULT 4500,
  kcal_target INTEGER DEFAULT 2400,
  protein_target_g INTEGER DEFAULT 220,
  phase_name TEXT DEFAULT 'Boost',
  phase_goal_date DATE,
  phase_goal_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── WORKOUTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,           -- 'push' | 'pull' | 'legs' | 'home' | 'sport'
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workouts_user_date_idx ON public.workouts (user_id, date DESC);

-- ─── BODY STATS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.body_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC,
  body_fat_pct NUMERIC,
  waist_cm NUMERIC,
  muscle_mass_kg NUMERIC,
  water_pct NUMERIC,
  visceral_fat NUMERIC,
  bone_mass_kg NUMERIC,
  bmr_kcal INTEGER,
  metabolic_age INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS body_stats_user_date_idx ON public.body_stats (user_id, date DESC);

-- ─── FOOD LOGS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  meal TEXT NOT NULL,           -- 'Meal 1', 'Snack 1', etc
  description TEXT,
  kcal INTEGER,
  protein_g NUMERIC,
  photo_path TEXT,              -- path in supabase storage bucket
  ai_analysis JSONB,            -- {confidence, reasoning, warnings, matched_template}
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS food_logs_user_date_idx ON public.food_logs (user_id, date DESC);

-- ─── HYDRATION ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hydration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  ml INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS hydration_user_date_idx ON public.hydration (user_id, date DESC);

-- ─── PREFERENCES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  excluded_tags TEXT[] DEFAULT '{}',
  hidden_meals TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — users only see/edit their own data
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences  ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
DROP POLICY IF EXISTS "own profile select" ON public.profiles;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Standard "own data" policies for the rest
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['workouts','body_stats','food_logs','hydration','preferences'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "own %s select" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "own %s select" ON public.%I FOR SELECT USING (auth.uid() = user_id)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "own %s insert" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "own %s insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "own %s update" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "own %s update" ON public.%I FOR UPDATE USING (auth.uid() = user_id)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "own %s delete" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "own %s delete" ON public.%I FOR DELETE USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE ON SIGNUP
-- When a user signs up via auth, insert a row in profiles automatically
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phase_goal_date, phase_goal_label)
  VALUES (
    NEW.id,
    (CURRENT_DATE + INTERVAL '90 days')::date,
    'My Goal'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKET FOR MEAL PHOTOS
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can only access their own photos
-- Photos are stored as: <user_id>/<food_log_id>.jpg
DROP POLICY IF EXISTS "own meal photos select" ON storage.objects;
CREATE POLICY "own meal photos select" ON storage.objects
  FOR SELECT USING (bucket_id = 'meal-photos' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "own meal photos insert" ON storage.objects;
CREATE POLICY "own meal photos insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'meal-photos' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "own meal photos delete" ON storage.objects;
CREATE POLICY "own meal photos delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'meal-photos' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- ═══════════════════════════════════════════════════════════════════
-- DONE
-- Next steps in Supabase:
-- 1. Go to Authentication → Providers → enable Email (password) provider
-- 2. Go to Authentication → URL Configuration → set Site URL to your Vercel URL
-- 3. Copy the anon key from Project Settings → API into .env.local
-- ═══════════════════════════════════════════════════════════════════
