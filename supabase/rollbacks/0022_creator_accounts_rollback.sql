-- ============================================================
-- Rollback for: 0022_creator_accounts
-- Drops the three profiles columns added for account-type routing.
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
--
-- Destructive: every profile's account_type, creator_onboarding_complete,
-- and offer_headline value is lost.
-- ============================================================

ALTER TABLE profiles
  DROP COLUMN IF EXISTS offer_headline,
  DROP COLUMN IF EXISTS creator_onboarding_complete,
  DROP COLUMN IF EXISTS account_type;
