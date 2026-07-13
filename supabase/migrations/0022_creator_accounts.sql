-- ============================================================
-- Migration: 0022_creator_accounts
-- Creator/client account-type split + routing sentinel
-- (CREATOR-ONBOARDING-SPEC.md "Schema additions"). Runs after
-- 0021_hot_leads.sql, which creates offer_slots and
-- creator_alert_settings that the creator onboarding flow writes to.
--
-- account_type is nullable ON PURPOSE — NULL is the "not yet chosen"
-- sentinel the (app)/layout.tsx routing gate reads to send a fresh
-- landing signup to /welcome. claimPendingState() sets 'client' as
-- part of attaching a claimed prompt, so anyone arriving via a
-- creator's link never sees the picker. Do NOT give this a default.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN account_type TEXT
    CHECK (account_type IN ('client', 'creator')),
  ADD COLUMN creator_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN offer_headline TEXT;

-- Backfill: anyone who already finished the client onboarding flow is
-- unambiguously a client — without this they'd all bounce to /welcome
-- once on next visit. Everyone else (no onboarding_complete yet, or
-- never signed up through a claim) stays NULL and sees the picker.
UPDATE profiles SET account_type = 'client' WHERE onboarding_complete = true;
