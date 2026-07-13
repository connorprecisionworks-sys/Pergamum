-- ============================================================
-- Rollback for: 0023_alert_threshold_range
-- Restores hot_threshold's original 30-80 CHECK.
--
-- This is a narrowing change, unlike the migration it undoes: if any
-- creator has since saved a value outside 30-80 (now legal, e.g. 5 or
-- 95), the ADD CONSTRAINT below would fail against those rows. The
-- UPDATE first clamps any such rows back into 30-80 so the rollback
-- always succeeds.
-- ============================================================

UPDATE creator_alert_settings
  SET hot_threshold = LEAST(GREATEST(hot_threshold, 30), 80)
  WHERE hot_threshold < 30 OR hot_threshold > 80;

ALTER TABLE creator_alert_settings
  DROP CONSTRAINT IF EXISTS creator_alert_settings_hot_threshold_check;

ALTER TABLE creator_alert_settings
  ADD CONSTRAINT creator_alert_settings_hot_threshold_check
  CHECK (hot_threshold BETWEEN 30 AND 80);
