-- ============================================================
-- Rollback for: 0030_identity_tier
-- Drops the plan-protect trigger + function, profiles.plan, and
-- lead_alert_state.identity_consented, then restores get_my_leads()
-- and get_lead_detail() to their exact 0029_lead_booked_visibility
-- shapes (no lead_name/lead_title/lead_company/lead_linkedin).
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

DROP TRIGGER IF EXISTS profiles_protect_plan ON profiles;
DROP FUNCTION IF EXISTS protect_profiles_plan();

ALTER TABLE profiles DROP COLUMN IF EXISTS plan;
ALTER TABLE lead_alert_state DROP COLUMN IF EXISTS identity_consented;

DROP FUNCTION IF EXISTS get_my_leads();

CREATE OR REPLACE FUNCTION get_my_leads()
RETURNS TABLE (
  user_id         UUID,
  score           NUMERIC,
  stage           TEXT,
  last_alerted_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  booked_at       TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID := auth.uid();
BEGIN
  IF v_creator_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.user_id,
    s.score,
    lead_stage(s.score) AS stage,
    s.last_alerted_at,
    s.updated_at,
    s.booked_at
  FROM (
    SELECT
      las.user_id,
      lead_score(v_creator_id, las.user_id) AS score,
      las.last_alerted_at,
      las.updated_at,
      las.booked_at
    FROM lead_alert_state las
    WHERE las.creator_id = v_creator_id
  ) s
  ORDER BY s.score DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_leads() TO authenticated;


CREATE OR REPLACE FUNCTION get_lead_detail(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id      UUID := auth.uid();
  v_score           NUMERIC;
  v_events          JSONB;
  v_last_alerted_at TIMESTAMPTZ;
  v_booked_at       TIMESTAMPTZ;
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

  SELECT last_alerted_at, booked_at INTO v_last_alerted_at, v_booked_at
  FROM lead_alert_state
  WHERE creator_id = v_creator_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'score', v_score,
    'stage', lead_stage(v_score),
    'last_alerted_at', v_last_alerted_at,
    'booked_at', v_booked_at,
    'events', v_events
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_lead_detail(UUID) TO authenticated;
