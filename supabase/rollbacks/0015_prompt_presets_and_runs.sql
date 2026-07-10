-- ============================================================
-- Rollback for: 0015_prompt_presets_and_runs
-- Drops both tables. DROP TABLE cascades to their indexes,
-- triggers, and RLS policies automatically — nothing else to
-- clean up. Does NOT touch update_updated_at(), which is shared
-- infrastructure used by other tables (see 0001_init.sql).
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

DROP TABLE IF EXISTS prompt_runs;
DROP TABLE IF EXISTS prompt_presets;
