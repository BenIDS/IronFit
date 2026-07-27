-- ═══════════════════════════════════════════════════════════════════
-- IronFit — Migration 001: Full macros + portion library
-- Run this in Supabase SQL Editor AFTER the initial schema.sql
-- Safe to re-run: uses IF NOT EXISTS everywhere.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Add macro columns to food_logs ────────────────────────────────
ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS carbs_g NUMERIC,
  ADD COLUMN IF NOT EXISTS fat_g NUMERIC,
  ADD COLUMN IF NOT EXISTS portion_g NUMERIC,
  ADD COLUMN IF NOT EXISTS source TEXT,          -- 'manual' | 'plan' | 'ai-photo' | 'barcode' | 'search' | 'recent'
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS product_name TEXT;    -- separate from description for grouping "recent meals"

-- ─── Add macro target columns to profiles ──────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS carb_target_g INTEGER,
  ADD COLUMN IF NOT EXISTS fat_target_g INTEGER;

-- Backfill sensible defaults for existing rows (40C / 30P / 30F split)
UPDATE public.profiles
SET carb_target_g = COALESCE(carb_target_g, ROUND((COALESCE(kcal_target, 2400) * 0.40) / 4)::int),
    fat_target_g  = COALESCE(fat_target_g,  ROUND((COALESCE(kcal_target, 2400) * 0.30) / 9)::int)
WHERE carb_target_g IS NULL OR fat_target_g IS NULL;

-- ─── Portion library — per-user shortcut portions ──────────────────
CREATE TABLE IF NOT EXISTS public.portion_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label TEXT NOT NULL,           -- e.g. "1 slice", "small handful"
  grams NUMERIC NOT NULL,
  food_key TEXT,                 -- optional: barcode or a normalised name, groups portions to specific foods
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portion_library_user_idx ON public.portion_library (user_id);
CREATE INDEX IF NOT EXISTS portion_library_food_key_idx ON public.portion_library (user_id, food_key);

ALTER TABLE public.portion_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own portion_library select" ON public.portion_library;
CREATE POLICY "own portion_library select" ON public.portion_library FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own portion_library insert" ON public.portion_library;
CREATE POLICY "own portion_library insert" ON public.portion_library FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own portion_library update" ON public.portion_library;
CREATE POLICY "own portion_library update" ON public.portion_library FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own portion_library delete" ON public.portion_library;
CREATE POLICY "own portion_library delete" ON public.portion_library FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════
