-- ============================================================
-- Migration: 0005_pending_status
-- Adds 'pending' as a valid prompt status.
--   draft     → user saved but did not submit
--   pending   → user submitted, awaiting admin review
--   published → live and visible to everyone
--   flagged   → reported, hidden pending review
--   removed   → admin removed
-- ============================================================

ALTER TABLE prompts
  DROP CONSTRAINT IF EXISTS prompts_status_check;

ALTER TABLE prompts
  ADD CONSTRAINT prompts_status_check
  CHECK (status IN ('draft', 'pending', 'published', 'flagged', 'removed'));
