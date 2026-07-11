-- ============================================================
-- Rollback for 0020_onboarding_need_text.sql
-- ============================================================
-- Drops the free-text need column. goals[], role_category and industry are
-- from 0016 and are left alone.
--
-- Destructive: any captured free-text needs are lost.
-- ============================================================

ALTER TABLE user_attributes
  DROP COLUMN IF EXISTS need_text;
