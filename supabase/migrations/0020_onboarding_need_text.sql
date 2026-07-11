-- ============================================================
-- 0020 — Client onboarding: free-text need
-- ============================================================
-- The client first-run flow (Prmpt Client Onboarding mockup) asks
-- "What do you need help with right now?" as multi-select chips plus an
-- optional "Or in your words" free-text line.
--
-- The chips already have a home: user_attributes.goals TEXT[] (0016).
-- Role and industry already map onto role_category_enum / industry_enum.
-- The only thing with nowhere to go is the free-text line, so this adds
-- exactly one nullable column and nothing else.
--
-- Deliberately NOT a separate `needs` table: the real needs/matching model
-- lands with demand-matching. goals[] + need_text is enough until then.
-- ============================================================

ALTER TABLE user_attributes
  ADD COLUMN IF NOT EXISTS need_text TEXT;

COMMENT ON COLUMN user_attributes.need_text IS
  'Optional free-text need captured during client onboarding ("Or in your words"). Superseded by the demand-matching model later.';
