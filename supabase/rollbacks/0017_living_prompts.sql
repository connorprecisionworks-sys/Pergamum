-- ============================================================
-- Rollback for: 0017_living_prompts
-- Drops notifications and prompt_versions (cascades their indexes and
-- RLS policies), then drops prompts.version. Does NOT touch
-- prompts.updated_at or its trigger — those predate this migration.
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS prompt_versions;

ALTER TABLE prompts
  DROP COLUMN IF EXISTS version;
