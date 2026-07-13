-- ============================================================
-- Migration: 0024_follow_scoring
-- Scores organic follows as a lead signal (HOT-LEAD-HEAT-SPEC.md
-- section 1, S8) — the event write was the one piece left undone
-- when claim-bundled follow suppression shipped in 0021.
--
-- lead_event_weight: 'follow' weight raised from 3 to 35.
--   NOTE: HOT-LEAD-HEAT-SPEC.md documents 3 ("weighted low because
--   claim auto-follows"). This migration ships the explicitly
--   requested 35 instead — flagged here and in the handoff summary
--   for a deliberate before-push confirmation, not applied silently.
--
-- record_lead_event: a 'follow' event has neither a prompt nor a
-- pack in scope, so it can't reuse the existing prompt/pack creator
-- derivation. Adds p_creator_id, used ONLY to look up a row that
-- must already exist in follows (follower_id = auth.uid()) — the
-- client's claimed creator is validated against the real follow
-- relationship, never trusted outright. Requires DROP + recreate
-- (not a bare CREATE OR REPLACE): adding a trailing parameter, even
-- with a DEFAULT, creates a second overload rather than replacing
-- the 4-arg function — every existing caller passing exactly the
-- original 4 named args would then hit "function is not unique."
-- ============================================================

CREATE OR REPLACE FUNCTION lead_event_weight(p_event_type TEXT, p_meta JSONB)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base  INT := 0;
  v_bonus INT := 0;
BEGIN
  IF COALESCE((p_meta->>'claim_bundle')::boolean, false)
     AND p_event_type IN ('prompt_run', 'preset_saved', 'follow') THEN
    RETURN 0;
  END IF;

  CASE p_event_type
    WHEN 'claim' THEN
      RETURN 10;
    WHEN 'prompt_run' THEN
      -- Anti-farm cap: the 4th+ scored run of the same prompt in a day
      -- scores 0 (base and bonus both), regardless of ordinal.
      IF COALESCE((p_meta->>'over_daily_cap')::boolean, false) THEN
        RETURN 0;
      END IF;

      IF COALESCE((p_meta->>'run_ordinal')::int, 1) <= 1 THEN
        v_base := 8;  -- S2: first run of this prompt
      ELSE
        v_base := 5;  -- S3: repeat run
      END IF;

      IF COALESCE((p_meta->>'vars_filled_pct')::numeric, 0) >= 80 THEN
        v_bonus := 4; -- S4: genuinely filled, not just clicked through
      END IF;

      RETURN v_base + v_bonus;
    WHEN 'preset_saved' THEN
      RETURN 8;  -- S5
    WHEN 'item_saved' THEN
      RETURN 4;  -- S6
    WHEN 'follow' THEN
      RETURN 35; -- S8
    WHEN 'return_visit' THEN
      RETURN 12; -- S7
    WHEN 'pack_completed' THEN
      RETURN 12; -- S9
    WHEN 'velocity_bonus' THEN
      RETURN 5;  -- S10
    WHEN 'offer_view' THEN
      RETURN 0;  -- S12: log-only
    WHEN 'offer_click' THEN
      RETURN 30; -- S11
    ELSE
      RETURN 0;
  END CASE;
END;
$$;


-- record_lead_event gains p_creator_id (follow-only derivation path).
-- Signature changes (4 args -> 5), so the old overload must be dropped
-- first — see note above.
DROP FUNCTION IF EXISTS record_lead_event(TEXT, UUID, UUID, JSONB);

CREATE OR REPLACE FUNCTION record_lead_event(
  p_event_type TEXT,
  p_prompt_id  UUID DEFAULT NULL,
  p_pack_id    UUID DEFAULT NULL,
  p_meta       JSONB DEFAULT '{}'::jsonb,
  p_creator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_creator_id   UUID;
  v_claim_bundle BOOLEAN;
  v_stored_meta  JSONB;
  v_weight       INT;
  v_event_id     UUID;

  -- prompt_run enrichment
  v_prompt_variables JSONB;
  v_total_vars INT;
  v_filled_vars INT;
  v_variable JSONB;
  v_var_name TEXT;
  v_var_default TEXT;
  v_filled_val TEXT;
  v_vars_filled_pct NUMERIC;
  v_run_ordinal INT;
  v_today_scored_runs INT;
  v_over_daily_cap BOOLEAN;

  -- S7 return-day synthetic event
  v_first_event_day  DATE;
  v_active_today     BOOLEAN;
  v_return_day_count INT;

  -- S9 pack_completed synthetic event
  v_pack_id_iter     UUID;
  v_pack_total_items INT;
  v_pack_run_items   INT;

  -- S10 velocity_bonus synthetic event
  v_velocity_given   BOOLEAN;
  v_is_first_organic BOOLEAN;
  v_claim_at         TIMESTAMPTZ;

  -- score + alert crossing
  v_new_score       NUMERIC;
  v_new_stage       TEXT;
  v_previous_score  NUMERIC;
  v_hot_threshold   INT;
  v_cooldown_hours  INT;
  v_in_app          BOOLEAN;
  v_last_alerted_at TIMESTAMPTZ;
  v_cooldown_ok     BOOLEAN;
  v_crossed_hot     BOOLEAN;
  v_should_alert    BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('score', 0, 'stage', 'cold', 'alert_fired', false);
  END IF;

  -- Derive creator_id server-side only. A 'follow' event has neither a
  -- prompt nor a pack, so it's derived from the follows relationship
  -- itself instead — p_creator_id is never trusted directly, only used
  -- to look up a row that must already exist with follower_id =
  -- auth.uid(). Every other event type keeps the original prompt/pack
  -- derivation, unchanged.
  IF p_event_type = 'follow' THEN
    SELECT following_id INTO v_creator_id
    FROM follows
    WHERE follower_id = v_user_id AND following_id = p_creator_id;
  ELSIF p_prompt_id IS NOT NULL THEN
    SELECT author_id INTO v_creator_id FROM prompts WHERE id = p_prompt_id;
  ELSIF p_pack_id IS NOT NULL THEN
    SELECT creator_id INTO v_creator_id FROM packs WHERE id = p_pack_id;
  END IF;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'record_lead_event: could not derive creator_id from prompt_id=% pack_id=% creator_id=%',
      p_prompt_id, p_pack_id, p_creator_id;
  END IF;

  -- Self-events (a creator acting on their own content) are dropped at the door.
  IF v_creator_id = v_user_id THEN
    RETURN jsonb_build_object('score', 0, 'stage', 'cold', 'alert_fired', false);
  END IF;

  v_claim_bundle := COALESCE((p_meta->>'claim_bundle')::boolean, false);

  -- ---- event-specific weight + stored-meta enrichment ----
  IF p_event_type = 'prompt_run' THEN
    -- All-time ordinal, including 0-weight claim-bundled runs — a claim's
    -- bundled run still consumes the "first run" slot, so the next
    -- organic run correctly scores as a repeat (S2 vs S3).
    SELECT COUNT(*) INTO v_run_ordinal
    FROM lead_events
    WHERE creator_id = v_creator_id AND user_id = v_user_id
      AND prompt_id = p_prompt_id AND event_type = 'prompt_run';
    v_run_ordinal := v_run_ordinal + 1;

    -- Anti-farm cap: 3 SCORED runs of this prompt per calendar day.
    SELECT COUNT(*) INTO v_today_scored_runs
    FROM lead_events
    WHERE creator_id = v_creator_id AND user_id = v_user_id
      AND prompt_id = p_prompt_id AND event_type = 'prompt_run'
      AND weight > 0
      AND created_at >= CURRENT_DATE;
    v_over_daily_cap := v_today_scored_runs >= 3;

    -- S4: >=80% of variables genuinely filled (non-blank, non-default).
    -- Only the derived percentage is stored — raw filled values never
    -- land in lead_events, so a creator's signal breakdown can never
    -- surface a lead's actual typed content pre-consent (HOT-LEAD-HEAT-
    -- SPEC section 7). prompt_runs already holds the raw values, owned
    -- strictly by the lead.
    SELECT variables INTO v_prompt_variables FROM prompts WHERE id = p_prompt_id;
    v_total_vars  := COALESCE(jsonb_array_length(v_prompt_variables), 0);
    v_filled_vars := 0;

    IF v_total_vars > 0 THEN
      FOR v_variable IN SELECT jsonb_array_elements(v_prompt_variables) LOOP
        v_var_name    := v_variable->>'name';
        v_var_default := v_variable->>'default';
        v_filled_val  := p_meta->'values'->>v_var_name;

        IF v_filled_val IS NOT NULL
           AND btrim(v_filled_val) <> ''
           AND v_filled_val IS DISTINCT FROM v_var_default THEN
          v_filled_vars := v_filled_vars + 1;
        END IF;
      END LOOP;
      v_vars_filled_pct := (v_filled_vars::numeric * 100.0) / v_total_vars;
    ELSE
      v_vars_filled_pct := 0;
    END IF;

    v_stored_meta := (p_meta - 'values') || jsonb_build_object(
      'run_ordinal',     v_run_ordinal,
      'over_daily_cap',  v_over_daily_cap,
      'vars_filled_pct', v_vars_filled_pct,
      'claim_bundle',    v_claim_bundle
    );
  ELSE
    v_stored_meta := p_meta || jsonb_build_object('claim_bundle', v_claim_bundle);
  END IF;

  v_weight := lead_event_weight(p_event_type, v_stored_meta);

  -- ---- S7: return-day synthetic event — computed BEFORE the primary
  -- insert so "already active today" doesn't see this call's own row. ----
  SELECT MIN(created_at)::date INTO v_first_event_day
  FROM lead_events WHERE creator_id = v_creator_id AND user_id = v_user_id;

  IF v_first_event_day IS NOT NULL AND v_first_event_day < CURRENT_DATE THEN
    SELECT EXISTS (
      SELECT 1 FROM lead_events
      WHERE creator_id = v_creator_id AND user_id = v_user_id
        AND created_at >= CURRENT_DATE
    ) INTO v_active_today;

    IF NOT v_active_today THEN
      SELECT COUNT(*) INTO v_return_day_count
      FROM lead_events
      WHERE creator_id = v_creator_id AND user_id = v_user_id AND event_type = 'return_visit';

      IF v_return_day_count < 3 THEN
        INSERT INTO lead_events (creator_id, user_id, event_type, weight, prompt_id, pack_id, meta)
        VALUES (
          v_creator_id, v_user_id, 'return_visit',
          lead_event_weight('return_visit', '{}'::jsonb),
          NULL, NULL, '{}'::jsonb
        );
      END IF;
    END IF;
  END IF;

  -- ---- the primary event ----
  INSERT INTO lead_events (creator_id, user_id, event_type, weight, prompt_id, pack_id, meta)
  VALUES (v_creator_id, v_user_id, p_event_type, v_weight, p_prompt_id, p_pack_id, v_stored_meta)
  RETURNING id INTO v_event_id;

  -- ---- S9: pack_completed synthetic event ----
  IF p_event_type = 'prompt_run' AND p_prompt_id IS NOT NULL THEN
    FOR v_pack_id_iter IN
      SELECT DISTINCT pi.pack_id
      FROM pack_items pi
      JOIN packs pk ON pk.id = pi.pack_id
      WHERE pi.prompt_id = p_prompt_id AND pi.item_type = 'prompt' AND pk.creator_id = v_creator_id
    LOOP
      SELECT COUNT(*) INTO v_pack_total_items
      FROM pack_items WHERE pack_id = v_pack_id_iter AND item_type = 'prompt';

      SELECT COUNT(DISTINCT pi2.prompt_id) INTO v_pack_run_items
      FROM pack_items pi2
      WHERE pi2.pack_id = v_pack_id_iter AND pi2.item_type = 'prompt'
        AND EXISTS (
          SELECT 1 FROM lead_events le
          WHERE le.creator_id = v_creator_id AND le.user_id = v_user_id
            AND le.event_type = 'prompt_run' AND le.prompt_id = pi2.prompt_id
        );

      IF v_pack_total_items > 0 AND v_pack_run_items = v_pack_total_items
         AND NOT EXISTS (
           SELECT 1 FROM lead_events
           WHERE creator_id = v_creator_id AND user_id = v_user_id
             AND event_type = 'pack_completed' AND pack_id = v_pack_id_iter
         ) THEN
        INSERT INTO lead_events (creator_id, user_id, event_type, weight, prompt_id, pack_id, meta)
        VALUES (
          v_creator_id, v_user_id, 'pack_completed',
          lead_event_weight('pack_completed', '{}'::jsonb),
          NULL, v_pack_id_iter, '{}'::jsonb
        );
      END IF;
    END LOOP;
  END IF;

  -- ---- S10: velocity_bonus synthetic event (one-time, organic runs only) ----
  IF p_event_type = 'prompt_run' AND NOT v_claim_bundle THEN
    SELECT EXISTS (
      SELECT 1 FROM lead_events
      WHERE creator_id = v_creator_id AND user_id = v_user_id AND event_type = 'velocity_bonus'
    ) INTO v_velocity_given;

    IF NOT v_velocity_given THEN
      SELECT NOT EXISTS (
        SELECT 1 FROM lead_events
        WHERE creator_id = v_creator_id AND user_id = v_user_id AND event_type = 'prompt_run'
          AND id <> v_event_id
          AND COALESCE((meta->>'claim_bundle')::boolean, false) = false
      ) INTO v_is_first_organic;

      IF v_is_first_organic THEN
        SELECT created_at INTO v_claim_at
        FROM lead_events
        WHERE creator_id = v_creator_id AND user_id = v_user_id AND event_type = 'claim'
        ORDER BY created_at ASC LIMIT 1;

        IF v_claim_at IS NOT NULL AND now() - v_claim_at < INTERVAL '10 minutes' THEN
          INSERT INTO lead_events (creator_id, user_id, event_type, weight, prompt_id, pack_id, meta)
          VALUES (
            v_creator_id, v_user_id, 'velocity_bonus',
            lead_event_weight('velocity_bonus', '{}'::jsonb),
            p_prompt_id, NULL, '{}'::jsonb
          );
        END IF;
      END IF;
    END IF;
  END IF;

  -- ---- score + alert crossing (HOT-LEAD-HEAT-SPEC section 4) ----
  v_new_score := lead_score(v_creator_id, v_user_id);
  v_new_stage := lead_stage(v_new_score);

  INSERT INTO lead_alert_state (creator_id, user_id)
  VALUES (v_creator_id, v_user_id)
  ON CONFLICT (creator_id, user_id) DO NOTHING;

  SELECT last_score, last_alerted_at INTO v_previous_score, v_last_alerted_at
  FROM lead_alert_state
  WHERE creator_id = v_creator_id AND user_id = v_user_id
  FOR UPDATE;

  SELECT hot_threshold, cooldown_hours, in_app
  INTO v_hot_threshold, v_cooldown_hours, v_in_app
  FROM creator_alert_settings
  WHERE creator_id = v_creator_id;

  IF NOT FOUND THEN
    -- creator_alert_settings row is created lazily elsewhere; fall back
    -- to spec defaults when absent.
    v_hot_threshold  := 50;
    v_cooldown_hours := 72;
    v_in_app         := true;
  END IF;

  v_crossed_hot := v_previous_score < v_hot_threshold AND v_new_score >= v_hot_threshold;
  v_cooldown_ok := v_last_alerted_at IS NULL
    OR v_last_alerted_at < now() - make_interval(hours => v_cooldown_hours);

  -- offer_click always breaks through, regardless of score or dedupe state.
  v_should_alert := (p_event_type = 'offer_click') OR (v_crossed_hot AND v_cooldown_ok);

  IF v_should_alert THEN
    IF v_in_app THEN
      INSERT INTO notifications (user_id, type, prompt_id, pack_id, payload)
      VALUES (
        v_creator_id,
        'hot_lead',
        p_prompt_id,
        p_pack_id,
        jsonb_build_object(
          'lead_user_id',      v_user_id,
          'score',             v_new_score,
          'stage',             v_new_stage,
          'trigger_event_type', p_event_type,
          'consented',          false
        )
      );
    END IF;

    UPDATE lead_alert_state
    SET last_alerted_at = now()
    WHERE creator_id = v_creator_id AND user_id = v_user_id;
  END IF;

  UPDATE lead_alert_state
  SET stage = v_new_stage, last_score = v_new_score
  WHERE creator_id = v_creator_id AND user_id = v_user_id;

  RETURN jsonb_build_object('score', v_new_score, 'stage', v_new_stage, 'alert_fired', v_should_alert);
END;
$$;

GRANT EXECUTE ON FUNCTION record_lead_event(TEXT, UUID, UUID, JSONB, UUID) TO authenticated;
