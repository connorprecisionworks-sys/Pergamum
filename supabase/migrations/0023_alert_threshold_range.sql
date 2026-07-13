-- ============================================================
-- Migration: 0023_alert_threshold_range
-- Widens creator_alert_settings.hot_threshold's valid range from
-- 30-80 to 5-100, so the slider's low end can reach "alert on any
-- use or copy" (a single copy scores ~4-8, below the old floor of
-- 30) — CREATOR-AUTHORING-REDESIGN-SPEC.md phase 4.
--
-- Widen-only: 5-100 is a strict superset of 30-80, so no existing
-- row can violate the new constraint. Safe with no data changes.
-- ============================================================

ALTER TABLE creator_alert_settings
  DROP CONSTRAINT IF EXISTS creator_alert_settings_hot_threshold_check;

ALTER TABLE creator_alert_settings
  ADD CONSTRAINT creator_alert_settings_hot_threshold_check
  CHECK (hot_threshold BETWEEN 5 AND 100);
