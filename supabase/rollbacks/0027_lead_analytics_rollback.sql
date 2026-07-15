-- ============================================================
-- Rollback for: 0027_lead_analytics
-- Drops the three read-only RPCs. No table/column changes were made
-- in the migration, so there's nothing else to restore.
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

DROP FUNCTION IF EXISTS get_lead_stats();
DROP FUNCTION IF EXISTS get_engagement_series(INT);
DROP FUNCTION IF EXISTS get_prompt_performance();
