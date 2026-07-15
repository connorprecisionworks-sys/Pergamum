-- ============================================================
-- Migration: 0027_lead_analytics
-- Three read-only RPCs backing the visual leads dashboard
-- (/dashboard/leads). Same shape as get_my_leads / get_lead_detail
-- (0021): SECURITY DEFINER, hard-filtered to auth.uid() so a creator
-- can only ever see their own numbers, GRANT EXECUTE to authenticated
-- only (no anon).
-- ============================================================

-- get_lead_stats: the four KPI tiles. hot_leads reads lead_alert_state's
-- cached last_score (the write-time snapshot used for alert crossing
-- detection) rather than recomputing lead_score() live — a stat tile is
-- a glance number, not a ranking, so the cheaper cached read is enough
-- here even though get_my_leads deliberately recomputes for display.
CREATE OR REPLACE FUNCTION get_lead_stats()
RETURNS TABLE (
  total_leads   BIGINT,
  hot_leads     BIGINT,
  offer_clicks  BIGINT,
  new_this_week BIGINT
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
    (SELECT COUNT(*) FROM (
      SELECT user_id, MIN(created_at) AS first_seen
      FROM lead_events
      WHERE creator_id = v_creator_id
      GROUP BY user_id
    ) f WHERE f.first_seen >= NOW() - INTERVAL '7 days');
END;
$$;

GRANT EXECUTE ON FUNCTION get_lead_stats() TO authenticated;


-- get_engagement_series: daily lead_events count for the trailing p_days
-- days, gap-filled via generate_series so a quiet day still returns a
-- zero row instead of the chart having a hole in it. p_days is clamped
-- to [1, 366] — it's client-suppliable, and an unclamped value would let
-- generate_series build an arbitrarily long series.
CREATE OR REPLACE FUNCTION get_engagement_series(p_days INT DEFAULT 14)
RETURNS TABLE (
  day   DATE,
  count BIGINT
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
    COUNT(le.id)
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


-- get_prompt_performance: the creator's prompts ranked by distinct
-- engaged leads (not raw event count — a lead running the same prompt
-- five times shouldn't outrank five different leads running it once).
CREATE OR REPLACE FUNCTION get_prompt_performance()
RETURNS TABLE (
  prompt_id  UUID,
  title      TEXT,
  lead_count BIGINT
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
    COUNT(DISTINCT le.user_id)
  FROM lead_events le
  JOIN prompts p ON p.id = le.prompt_id
  WHERE le.creator_id = v_creator_id
    AND le.prompt_id IS NOT NULL
  GROUP BY p.id, p.title
  ORDER BY COUNT(DISTINCT le.user_id) DESC
  LIMIT 8;
END;
$$;

GRANT EXECUTE ON FUNCTION get_prompt_performance() TO authenticated;
