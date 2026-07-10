-- ============================================================
-- Migration: 0015_prompt_presets_and_runs
-- The "it remembers what they typed" feature (USER-DELIVERABLE-SPEC.md #3).
--
-- prompt_presets: a user's named, reusable sets of variable values for
-- a given prompt ("Acme cold email", "SaaS launch tone") — load one in
-- a tap instead of retyping.
--
-- prompt_runs: a log of every fill-in, one row per Copy or AI-launcher
-- click, so the last few uses are re-runnable without a saved preset.
--
-- Both tables are strictly owner-scoped: no public/anon access at all.
-- ============================================================

CREATE TABLE prompt_presets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id   UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  values      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, prompt_id, name)
);

CREATE INDEX idx_prompt_presets_user_prompt
  ON prompt_presets (user_id, prompt_id);

-- Reuse the shared updated_at trigger function from 0001_init.sql
CREATE TRIGGER prompt_presets_updated_at
  BEFORE UPDATE ON prompt_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---- RLS: owner-only, no public select ----
ALTER TABLE prompt_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_presets_select_own" ON prompt_presets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "prompt_presets_insert_own" ON prompt_presets
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "prompt_presets_update_own" ON prompt_presets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "prompt_presets_delete_own" ON prompt_presets
  FOR DELETE USING (user_id = auth.uid());


CREATE TABLE prompt_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id   UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  values      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supports "last 5 runs for this prompt" ordered by recency
CREATE INDEX idx_prompt_runs_user_prompt_created
  ON prompt_runs (user_id, prompt_id, created_at DESC);

-- ---- RLS: owner-only, no public select ----
ALTER TABLE prompt_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_runs_select_own" ON prompt_runs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "prompt_runs_insert_own" ON prompt_runs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "prompt_runs_update_own" ON prompt_runs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "prompt_runs_delete_own" ON prompt_runs
  FOR DELETE USING (user_id = auth.uid());
