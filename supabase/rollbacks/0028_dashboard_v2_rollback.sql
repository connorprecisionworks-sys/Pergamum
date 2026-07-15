-- ============================================================
-- Rollback for: 0028_dashboard_v2
-- Restores get_lead_stats/get_engagement_series/get_prompt_performance
-- to their 0027 shapes, drops the two new RPCs, and drops the two new
-- columns.
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

DROP FUNCTION IF EXISTS get_lead_funnel();
DROP FUNCTION IF EXISTS mark_lead_booked(UUID, BOOLEAN);

DROP FUNCTION IF EXISTS get_lead_stats();
DROP FUNCTION IF EXISTS get_engagement_series(INT);
DROP FUNCTION IF EXISTS get_prompt_performance();

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

ALTER TABLE lead_alert_state        DROP COLUMN IF EXISTS booked_at;
ALTER TABLE creator_alert_settings  DROP COLUMN IF EXISTS deal_value;
