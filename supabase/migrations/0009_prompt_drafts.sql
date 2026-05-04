-- ============================================================
-- Migration: 0009_prompt_drafts
-- A scratchpad table for the /build prompt-builder feature.
-- Each draft holds the 5 structural blocks separately so the
-- builder can render and reassemble them, plus the seed "goal"
-- the user typed when generating from scratch.
--
-- Drafts are private to the author until they decide to ship
-- them through the existing /submit moderation pipeline. They
-- are NOT the same as prompts.status='draft' — those rows live
-- in the public `prompts` table and have already been shaped
-- into the published-prompt schema. Drafts here are the raw
-- block-form representation that the builder UI works with.
-- ============================================================

CREATE TABLE prompt_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Optional working title (the builder pre-fills this from the goal).
  title           TEXT,

  -- The single-sentence brief the user typed into "Generate from goal",
  -- kept around so we can show it next to the draft in the dashboard.
  goal            TEXT,

  -- The five structural blocks. All optional — the builder lets users
  -- skip any block they don't need.
  role            TEXT NOT NULL DEFAULT '',
  context         TEXT NOT NULL DEFAULT '',
  task            TEXT NOT NULL DEFAULT '',
  constraints     TEXT NOT NULL DEFAULT '',
  output_format   TEXT NOT NULL DEFAULT '',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_drafts_author_updated
  ON prompt_drafts (author_id, updated_at DESC);

-- Reuse the shared updated_at trigger function from 0001_init.sql
CREATE TRIGGER prompt_drafts_updated_at
  BEFORE UPDATE ON prompt_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---- RLS: owner-only ----
ALTER TABLE prompt_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_drafts_read_own" ON prompt_drafts
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "prompt_drafts_insert_own" ON prompt_drafts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND author_id = auth.uid()
  );

CREATE POLICY "prompt_drafts_update_own" ON prompt_drafts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "prompt_drafts_delete_own" ON prompt_drafts
  FOR DELETE USING (author_id = auth.uid());
