-- ============================================================
-- Migration: 0004_admin_rls
-- Adds explicit, separate RLS policies for admin users.
-- All policies here are ADDITIVE — existing user-facing
-- policies are untouched. PostgreSQL combines permissive
-- policies with OR, so these only ever grant more access.
-- ============================================================

-- ============================================================
-- PROMPTS — explicit admin read
-- The existing "prompts_read_published" policy embeds the
-- admin check inside a compound OR. A standalone policy is
-- clearer, easier to audit, and avoids edge cases where
-- the subquery is silently short-circuited.
-- ============================================================
CREATE POLICY "prompts_admin_read_all"
  ON prompts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );

-- ============================================================
-- COMMENTS — admin read
-- The existing "comments_read_published_prompt" policy only
-- surfaces comments on *published* prompts. Admins reviewing
-- a pending prompt in the moderation queue need to read its
-- comments too.
-- ============================================================
CREATE POLICY "comments_admin_read_all"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );

-- ============================================================
-- PROFILES — admin update any
-- "profiles_update_own" restricts updates to the owner.
-- Admins need to be able to set is_admin, ban users, and
-- correct usernames on any profile.
-- ============================================================
CREATE POLICY "profiles_admin_update_any"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );
