-- ============================================================
-- Migration: 0028_dashboard_v2
-- Leads dashboard v2 ("the money dashboard", DASHBOARD-V2-SPEC.md).
-- Turns the dashboard from activity into revenue: a pipeline hero
-- (qualifying leads x deal_value), a booked-calls KPI, and a real
-- conversion funnel + value-mix engagement chart + buyer-ranked
-- prompt performance.
--
-- New columns:
--   creator_alert_settings.deal_value — creator's typical client
--     value in dollars, nullable, used client-side for the pipeline
--     hero math (qualifying_leads * deal_value).
--   lead_alert_state.booked_at — set/cleared by mark_lead_booked(),
--     the manual "this lead became a client" stamp (bookings happen
--     off-platform via Calendly for now).
--
-- New/extended RPCs, same posture as 0021/0027: SECURITY DEFINER,
-- hard-filtered to creator_id = auth.uid(), GRANT EXECUTE to
-- authenticated only. get_lead_stats/get_engagement_series/
-- get_prompt_performance change their RETURNS TABLE shape, which
-- Postgres does not allow via CREATE OR REPLACE, so each is DROPped
-- first.
-- ============================================================

ALTER TABLE creator_alert_settings ADD COLUMN deal_value NUMERIC;
ALTER TABLE lead_alert_state        ADD COLUMN booked_at  TIMESTAMPTZ;


-- get_lead_funnel: the five-stage conversion funnel (reached -> used
-- a prompt -> went hot -> clicked the offer -> booked) for the
-- calling creator. "hot" mirrors get_lead_stats' existing >= 50
-- cached-score cut (lead_stage's fixed display breakpoint, not the
-- creator's configurable alert threshold).
CREATE OR REPLACE FUNCTION get_lead_funnel()
RETURNS TABLE (
  reached BIGINT,
  used    BIGINT,
  hot     BIGINT,
  clicked BIGINT,
  booked  BIGINT
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
    (SELECT COUNT(*) FROM lead_alert_state WHERE creator_id = v_creator_id),
    (SELECT COUNT(DISTINCT user_id) FROM lead_events
       WHERE creator_id = v_creator_id AND event_type = 'prompt_run'),
    (SELECT COUNT(*) FROM lead_alert_state
       WHERE creator_id = v_creator_id AND last_score >= 50),
    (SELECT COUNT(DISTINCT user_id) FROM lead_events
       WHERE creator_id = v_creator_id AND event_type = 'offer_click'),
    (SELECT COUNT(*) FROM lead_alert_state
       WHERE creator_id = v_creator_id AND booked_at IS NOT NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION get_lead_funnel() TO authenticated;


-- mark_lead_booked: manual "this lead became a client" stamp. Only
-- ever touches a (creator_id, user_id) pair that already has a
-- lead_events row for the caller — same no-existence-leak posture as
-- get_lead_detail, silently returning false rather than raising when
-- the target isn't (yet) one of the caller's leads.
CREATE OR REPLACE FUNCTION mark_lead_booked(p_user_id UUID, p_booked BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID := auth.uid();
  v_is_lead    BOOLEAN;
BEGIN
  IF v_creator_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM lead_events WHERE creator_id = v_creator_id AND user_id = p_user_id
  ) INTO v_is_lead;

  IF NOT v_is_lead THEN
    RETURN false;
  END IF;

  INSERT INTO lead_alert_state (creator_id, user_id, booked_at)
  VALUES (v_creator_id, p_user_id, CASE WHEN p_booked THEN now() ELSE NULL END)
  ON CONFLICT (creator_id, user_id) DO UPDATE
    SET booked_at = CASE WHEN p_booked THEN now() ELSE NULL END;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_lead_booked(UUID, BOOLEAN) TO authenticated;


-- get_lead_stats: the KPI row. Superseded shape for the money
-- dashboard -- reached/booked replace the old total_leads/
-- new_this_week (the KPI row is now exactly these four), hot/
-- offer_clicks keep their original definitions.
DROP FUNCTION IF EXISTS get_lead_stats();

CREATE OR REPLACE FUNCTION get_lead_stats()
RETURNS TABLE (
  reached      BIGINT,
  hot_leads    BIGINT,
  offer_clicks BIGINT,
  booked       BIGINT
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
    (SELECT COUNT(*) FROM lead_alert_state WHERE creator_id = v_creator_id),
    (SELECT COUNT(*) FROM lead_alert_state WHERE creator_id = v_creator_id AND last_score >= 50),
    (SELECT COUNT(*) FROM lead_events WHERE creator_id = v_creator_id AND event_type = 'offer_click'),
    (SELECT COUNT(*) FROM lead_alert_state WHERE creator_id = v_creator_id AND booked_at IS NOT NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION get_lead_stats() TO authenticated;


-- get_engagement_series: reframed from a raw daily event count to the
-- three-series value mix -- copies (prompt_run), clicks (offer_click),
-- directed (claim, i.e. new leads directed in). Same gap-filled
-- generate_series shape and p_days clamp as before.
DROP FUNCTION IF EXISTS get_engagement_series(INT);

CREATE OR REPLACE FUNCTION get_engagement_series(p_days INT DEFAULT 14)
RETURNS TABLE (
  day      DATE,
  copies   BIGINT,
  clicks   BIGINT,
  directed BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID := auth.uid();
  v_days       INT := LEAST(GREATEST(COALESCE(p_days, 14), 1), 366);
BEGIN
  IF v_creator_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    d.day::DATE,
    COUNT(le.id) FILTER (WHERE le.event_type = 'prompt_run'),
    COUNT(le.id) FILTER (WHERE le.event_type = 'offer_click'),
    COUNT(le.id) FILTER (WHERE le.event_type = 'claim')
  FROM generate_series(
    CURRENT_DATE - (v_days - 1),
    CURRENT_DATE,
    INTERVAL '1 day'
  ) AS d(day)
  LEFT JOIN lead_events le
    ON le.creator_id = v_creator_id
   AND le.created_at >= d.day
   AND le.created_at < d.day + INTERVAL '1 day'
  GROUP BY d.day
  ORDER BY d.day;
END;
$$;

GRANT EXECUTE ON FUNCTION get_engagement_series(INT) TO authenticated;


-- get_prompt_performance: re-ranked by buyers rather than raw
-- engagement. hot_count/offer_click_count are distinct-lead counts
-- (consistent with lead_count's existing "distinct engaged leads, not
-- raw events" definition); hot_count reads the same cached
-- last_score >= 50 cut as get_lead_stats/get_lead_funnel.
DROP FUNCTION IF EXISTS get_prompt_performance();

CREATE OR REPLACE FUNCTION get_prompt_performance()
RETURNS TABLE (
  prompt_id         UUID,
  title             TEXT,
  lead_count        BIGINT,
  hot_count         BIGINT,
  offer_click_count BIGINT
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
    p.id,
    p.title,
    COUNT(DISTINCT le.user_id),
    COUNT(DISTINCT le.user_id) FILTER (WHERE las.last_score >= 50),
    COUNT(DISTINCT le.user_id) FILTER (WHERE le.event_type = 'offer_click')
  FROM lead_events le
  JOIN prompts p ON p.id = le.prompt_id
  LEFT JOIN lead_alert_state las
    ON las.creator_id = v_creator_id AND las.user_id = le.user_id
  WHERE le.creator_id = v_creator_id
    AND le.prompt_id IS NOT NULL
  GROUP BY p.id, p.title
  ORDER BY 4 DESC, 5 DESC, 3 DESC
  LIMIT 8;
END;
$$;

GRANT EXECUTE ON FUNCTION get_prompt_performance() TO authenticated;
