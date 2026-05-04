-- ============================================================
-- Migration: 0010_prompt_drafts_examples
-- Adds an `examples` JSONB column to prompt_drafts so the builder can
-- attach few-shot input/output pairs to a draft. Few-shot examples are
-- one of the strongest prompting levers — surfacing them as first-class
-- on the draft means they survive save/load and bake into the assembled
-- prompt at copy time.
--
-- Shape: an array of { input: string, output: string } objects.
-- Default: [] so existing rows remain valid.
-- ============================================================

ALTER TABLE prompt_drafts
  ADD COLUMN IF NOT EXISTS examples JSONB NOT NULL DEFAULT '[]'::jsonb;
