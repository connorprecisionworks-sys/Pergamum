-- ============================================================
-- Migration: 0014_fix_admin_curation_trigger
--
-- Fixes 0013's admin-only trigger so it doesn't block updates
-- coming from the Supabase SQL editor or a service-role client
-- (both of which have auth.uid() = NULL by design).
--
-- New behavior:
--   - auth.uid() IS NULL  → allow (service-role / SQL editor)
--   - authenticated admin → allow
--   - authenticated non-admin → reject
--   - anonymous request that somehow reaches this point → reject
-- ============================================================

CREATE OR REPLACE FUNCTION enforce_admin_only_skill_curation()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_user BOOLEAN;
  current_uid UUID;
BEGIN
  -- If neither curation field changed, allow normal update
  IF NEW.is_featured IS NOT DISTINCT FROM OLD.is_featured
     AND NEW.theme_id IS NOT DISTINCT FROM OLD.theme_id
     AND NEW.featured_priority IS NOT DISTINCT FROM OLD.featured_priority THEN
    RETURN NEW;
  END IF;

  -- Service-role / SQL editor / direct DB access — auth.uid() is NULL.
  -- These contexts are trusted (you needed elevated credentials to get
  -- here), so allow the curation update.
  current_uid := auth.uid();
  IF current_uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Authenticated user — must be admin
  SELECT is_admin INTO is_admin_user
    FROM profiles
    WHERE id = current_uid;

  IF COALESCE(is_admin_user, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION
      'Only admins can change is_featured, theme_id, or featured_priority on skills.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
