-- ============================================================
-- Migration: 0016_pro_profile_fields
-- Professional-profile capture for Audience Intelligence
-- (ONBOARDING-FRICTION-SPEC.md #5 / AUDIENCE-INTELLIGENCE-SPEC.md).
--
-- Progressive profiling, not a signup gate: every field is optional,
-- filled in later via a dismissible in-app prompt or the profile
-- settings page — never required to sign up, use a prompt, or save.
--
-- Lives in its own table, not on profiles: profiles.profiles_read_all
-- (0001_init.sql) grants row-level SELECT to everyone with no column
-- restriction, and RLS has no concept of per-column visibility, so
-- these fields would have been readable by anyone via a direct query
-- regardless of what the app renders. A separate, strictly owner-only
-- table sidesteps that entirely and leaves profiles' existing policies
-- and every profiles:profiles!*_fkey author-display embed untouched.
-- Aggregate/consent-gated access for anyone other than the owner is a
-- later, separate build via SECURITY DEFINER RPCs, not this migration.
-- ============================================================

CREATE TYPE role_category_enum AS ENUM (
  'founder_owner',
  'executive',
  'marketing',
  'sales_bd',
  'consultant_coach',
  'engineering_data',
  'product_design',
  'operations',
  'hr_recruiting',
  'finance_legal',
  'content_creator',
  'student',
  'other'
);

CREATE TYPE industry_enum AS ENUM (
  'agency_consulting',
  'saas_tech',
  'ecommerce_retail',
  'coaching_education',
  'health_wellness',
  'finance_insurance',
  'real_estate',
  'legal',
  'marketing_media',
  'manufacturing_trades',
  'nonprofit',
  'other'
);

CREATE TYPE company_size_enum AS ENUM (
  'solo',
  's2_10',
  's11_50',
  's51_200',
  's201_1000',
  's1000_plus'
);

CREATE TABLE user_attributes (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role_category   role_category_enum,
  industry        industry_enum,
  company_size    company_size_enum,
  goals           TEXT[],
  job_title       TEXT,
  company_name    TEXT,
  linkedin_url    TEXT,
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reuse the shared updated_at trigger function from 0001_init.sql
CREATE TRIGGER user_attributes_updated_at
  BEFORE UPDATE ON user_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---- RLS: strictly owner-only, no public/anon select at all ----
ALTER TABLE user_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_attributes_select_own" ON user_attributes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_attributes_insert_own" ON user_attributes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "user_attributes_update_own" ON user_attributes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_attributes_delete_own" ON user_attributes
  FOR DELETE USING (user_id = auth.uid());
