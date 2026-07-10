-- ============================================================
-- Rollback for: 0019_prompt_saves
-- Drops prompt_saves — cascades its indexes and RLS policies
-- automatically.
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

DROP TABLE IF EXISTS prompt_saves;
