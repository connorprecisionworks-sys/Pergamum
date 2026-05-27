-- ============================================================
-- Migration: 0013_featured_themes
--
-- Adds a curated/featured tier to skills. Featured skills can
-- reference a named theme component (theme_id) that renders the
-- card with a bespoke design. Non-featured skills keep the
-- default Vivid Hybrid card.
--
-- Only admins can flip is_featured or set theme_id.
-- ============================================================

ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_priority INT     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS theme_id          TEXT;

-- Index for the trending sort that mixes featured + score
CREATE INDEX IF NOT EXISTS idx_skills_featured
  ON skills (is_featured, featured_priority DESC, trending_score DESC)
  WHERE status = 'published';

-- ============================================================
-- ADMIN-ONLY GATE on is_featured and theme_id
--
-- Any UPDATE that changes is_featured OR theme_id must come from
-- an admin (profiles.is_admin = TRUE for auth.uid()).
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_admin_only_skill_curation()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- If neither curation field changed, allow normal update
  IF NEW.is_featured IS NOT DISTINCT FROM OLD.is_featured
     AND NEW.theme_id IS NOT DISTINCT FROM OLD.theme_id
     AND NEW.featured_priority IS NOT DISTINCT FROM OLD.featured_priority THEN
    RETURN NEW;
  END IF;

  -- A change is being attempted to curation fields. Verify admin.
  SELECT is_admin INTO is_admin_user
    FROM profiles
    WHERE id = auth.uid();

  IF COALESCE(is_admin_user, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION
      'Only admins can change is_featured, theme_id, or featured_priority on skills.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS skills_curation_admin_only ON skills;
CREATE TRIGGER skills_curation_admin_only
  BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION enforce_admin_only_skill_curation();
