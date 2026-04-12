-- ============================================================
-- Migration: 0003_onboarding
-- Adds onboarding_complete flag to profiles so new users
-- are routed through the account setup flow on first login.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing users are considered done (retroactive — no need to re-onboard)
UPDATE profiles SET onboarding_complete = TRUE;
