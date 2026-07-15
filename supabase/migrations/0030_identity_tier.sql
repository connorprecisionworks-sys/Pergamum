-- ============================================================
-- Migration: 0030_identity_tier
-- The Business identity unlock: a creator on the 'business' plan
-- sees a lead's real name/title/company/LinkedIn once that lead has
-- consented, instead of the anonymous handle. Everyone else keeps
-- today's fully-anonymous behavior.
--
-- New columns:
--   profiles.plan                    — 'free' (default) | 'business'.
--   lead_alert_state.identity_consented — per-(creator, lead) consent
--     flag. Lives on lead_alert_state (not profiles/user_attributes)
--     because consent is scoped to one creator relationship, not
--     global — the same lead may consent with one creator and not
--     another.
--
-- get_my_leads() / get_lead_detail(): additive only. Both gain
-- lead_name / lead_title / lead_company / lead_linkedin, sourced from
-- profiles.display_name + user_attributes (job_title, company_name,
-- linkedin_url). Populated ONLY when the calling creator's own
-- profiles.plan = 'business' AND that lead's identity_consented =
-- true for this creator; NULL otherwise. Every existing column is
-- unchanged — Postgres won't let CREATE OR REPLACE add a column to a
-- RETURNS TABLE function, so get_my_leads() is DROPped first (same as
-- 0029); get_lead_detail() already returns JSONB, so it's a plain
-- CREATE OR REPLACE with two more keys in the object.
--
-- Security note (not requested, added because it's a real gap this
-- migration would otherwise open): "profiles_update_own" (0001_init)
-- is `USING (auth.uid() = id)` with no WITH CHECK and no column
-- restriction — RLS has no column-level granularity — so without a
-- guard, any authenticated user could UPDATE their own profiles row
-- and set plan = 'business' directly from the client, bypassing
-- whatever billing gate sits in front of the Business plan entirely.
-- (profiles.is_admin has this same pre-existing gap; out of scope to
-- fix here.) protect_profiles_plan() below reverts any change to
-- `plan` unless it comes from an admin or a service-role/server
-- context (auth.uid() IS NULL — what the demo seed script and any
-- future billing webhook run as). No other profiles column is
-- touched by the trigger.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'business'));

CREATE OR REPLACE FUNCTION protect_profiles_plan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
     ) THEN
    NEW.plan := OLD.plan;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER profiles_protect_plan
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profiles_plan();


ALTER TABLE lead_alert_state
  ADD COLUMN identity_consented BOOLEAN NOT NULL DEFAULT FALSE;


-- get_my_leads: additive lead_name/lead_title/lead_company/lead_linkedin.
DROP FUNCTION IF EXISTS get_my_leads();

CREATE OR REPLACE FUNCTION get_my_leads()
RETURNS TABLE (
  user_id         UUID,
  score           NUMERIC,
  stage           TEXT,
  last_alerted_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  booked_at       TIMESTAMPTZ,
  lead_name       TEXT,
  lead_title      TEXT,
  lead_company    TEXT,
  lead_linkedin   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id   UUID := auth.uid();
  v_creator_plan TEXT;
BEGIN
  IF v_creator_id IS NULL THEN
    RETURN;
  END IF;

  SELECT plan INTO v_creator_plan FROM profiles WHERE id = v_creator_id;

  RETURN QUERY
  SELECT
    s.user_id,
    s.score,
    lead_stage(s.score) AS stage,
    s.last_alerted_at,
    s.updated_at,
    s.booked_at,
    CASE WHEN v_creator_plan = 'business' AND s.identity_consented THEN p.display_name  ELSE NULL END,
    CASE WHEN v_creator_plan = 'business' AND s.identity_consented THEN ua.job_title     ELSE NULL END,
    CASE WHEN v_creator_plan = 'business' AND s.identity_consented THEN ua.company_name  ELSE NULL END,
    CASE WHEN v_creator_plan = 'business' AND s.identity_consented THEN ua.linkedin_url  ELSE NULL END
  FROM (
    SELECT
      las.user_id,
      lead_score(v_creator_id, las.user_id) AS score,
      las.last_alerted_at,
      las.updated_at,
      las.booked_at,
      las.identity_consented
    FROM lead_alert_state las
    WHERE las.creator_id = v_creator_id
  ) s
  LEFT JOIN profiles p        ON p.id = s.user_id
  LEFT JOIN user_attributes ua ON ua.user_id = s.user_id
  ORDER BY s.score DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_leads() TO authenticated;


-- get_lead_detail: additive lead_name/lead_title/lead_company/lead_linkedin
-- keys in the existing JSONB payload. Same gating as get_my_leads.
CREATE OR REPLACE FUNCTION get_lead_detail(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id         UUID := auth.uid();
  v_creator_plan       TEXT;
  v_score              NUMERIC;
  v_events             JSONB;
  v_last_alerted_at    TIMESTAMPTZ;
  v_booked_at          TIMESTAMPTZ;
  v_identity_consented BOOLEAN;
  v_lead_name          TEXT;
  v_lead_title         TEXT;
  v_lead_company       TEXT;
  v_lead_linkedin      TEXT;
BEGIN
  IF v_creator_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'event_type', le.event_type,
      'weight',     le.weight,
      'prompt_id',  le.prompt_id,
      'pack_id',    le.pack_id,
      'meta',       le.meta,
      'created_at', le.created_at
    ) ORDER BY le.created_at DESC
  ), '[]'::jsonb)
  INTO v_events
  FROM lead_events le
  WHERE le.creator_id = v_creator_id AND le.user_id = p_user_id;

  IF v_events = '[]'::jsonb THEN
    RETURN NULL;
  END IF;

  v_score := lead_score(v_creator_id, p_user_id);

  SELECT last_alerted_at, booked_at, identity_consented
  INTO v_last_alerted_at, v_booked_at, v_identity_consented
  FROM lead_alert_state
  WHERE creator_id = v_creator_id AND user_id = p_user_id;

  SELECT plan INTO v_creator_plan FROM profiles WHERE id = v_creator_id;

  IF v_creator_plan = 'business' AND COALESCE(v_identity_consented, FALSE) THEN
    SELECT display_name INTO v_lead_name FROM profiles WHERE id = p_user_id;

    SELECT job_title, company_name, linkedin_url
    INTO v_lead_title, v_lead_company, v_lead_linkedin
    FROM user_attributes WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'score', v_score,
    'stage', lead_stage(v_score),
    'last_alerted_at', v_last_alerted_at,
    'booked_at', v_booked_at,
    'lead_name', v_lead_name,
    'lead_title', v_lead_title,
    'lead_company', v_lead_company,
    'lead_linkedin', v_lead_linkedin,
    'events', v_events
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_lead_detail(UUID) TO authenticated;
