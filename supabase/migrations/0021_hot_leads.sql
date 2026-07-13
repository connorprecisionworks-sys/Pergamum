-- ============================================================
-- Migration: 0021_hot_leads
-- The creator money layer, part 1: heat spine + in-app alert
-- (HOT-LEAD-HEAT-SPEC.md, phase 1).
--
-- lead_events           — append-only spine, one row per scored (or
--                          zero-weight) signal a lead produces on a
--                          creator's prompts/packs.
-- offer_slots           — a creator's "Book a call" CTA, default +
--                          optional per-prompt overrides.
-- creator_alert_settings — owner-tunable hot-lead alert thresholds.
-- lead_alert_state      — write-time cache of each lead's stage/score,
--                          used for crossing detection + dedupe.
--
-- All writes to lead_events go through record_lead_event(), a
-- SECURITY DEFINER RPC. No table grants direct INSERT to authenticated
-- users — creator_id and weight are always server-derived, never
-- trusted from the client. lead_events and lead_alert_state have zero
-- RLS policies (RLS enabled, no policies = deny-all to any role
-- subject to RLS), matching analytics_events' "no client SELECT"
-- posture but stricter still — not even INSERT is exposed directly.
-- ============================================================

CREATE TABLE lead_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN (
                'claim', 'prompt_run', 'preset_saved', 'item_saved', 'follow',
                'return_visit', 'pack_completed', 'velocity_bonus',
                'offer_view', 'offer_click'
              )),
  weight      INT  NOT NULL,
  prompt_id   UUID REFERENCES prompts(id) ON DELETE SET NULL,
  pack_id     UUID REFERENCES packs(id)   ON DELETE SET NULL,
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_events_creator_user_created
  ON lead_events (creator_id, user_id, created_at DESC);
CREATE INDEX idx_lead_events_creator_created
  ON lead_events (creator_id, created_at DESC);


-- offer_slots: the creator's CTA. prompt_id NULL = default slot applied
-- to all of the creator's prompts; a per-prompt row overrides it.
CREATE TABLE offer_slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id   UUID REFERENCES prompts(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offer_slots_creator_id ON offer_slots (creator_id);
CREATE INDEX idx_offer_slots_prompt_id  ON offer_slots (prompt_id) WHERE prompt_id IS NOT NULL;

-- "Per-prompt slot beats the default slot when both exist" (spec section 6)
-- presumes exactly one default and one per-prompt slot per creator/prompt.
-- Partial unique indexes enforce that rather than leaving it to app-layer
-- discipline (a re-submitted onboarding step would otherwise silently
-- create a second default slot with no defined winner).
CREATE UNIQUE INDEX idx_offer_slots_one_default_per_creator
  ON offer_slots (creator_id) WHERE prompt_id IS NULL;
CREATE UNIQUE INDEX idx_offer_slots_one_per_creator_prompt
  ON offer_slots (creator_id, prompt_id) WHERE prompt_id IS NOT NULL;

CREATE TRIGGER offer_slots_updated_at
  BEFORE UPDATE ON offer_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


CREATE TABLE creator_alert_settings (
  creator_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  hot_threshold INT NOT NULL DEFAULT 50 CHECK (hot_threshold BETWEEN 30 AND 80),
  in_app BOOLEAN NOT NULL DEFAULT TRUE,
  email BOOLEAN NOT NULL DEFAULT TRUE,
  email_mode TEXT NOT NULL DEFAULT 'instant' CHECK (email_mode IN ('instant', 'daily_digest')),
  slack_webhook_url TEXT,
  cooldown_hours INT NOT NULL DEFAULT 72,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER creator_alert_settings_updated_at
  BEFORE UPDATE ON creator_alert_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- lead_alert_state: dedupe + crossing detection. Row created lazily
-- (insert-or-ignore) inside record_lead_event on a lead's first event.
CREATE TABLE lead_alert_state (
  creator_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stage           TEXT NOT NULL DEFAULT 'cold' CHECK (stage IN ('cold', 'warm', 'hot')),
  last_score      NUMERIC NOT NULL DEFAULT 0,
  last_alerted_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (creator_id, user_id)
);

CREATE TRIGGER lead_alert_state_updated_at
  BEFORE UPDATE ON lead_alert_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- notifications (0017) gains a payload for the new 'hot_lead' type. The
-- insert happens inside record_lead_event (SECURITY DEFINER), so no new
-- INSERT policy is needed — existing policies stay untouched.
ALTER TABLE notifications ADD COLUMN payload JSONB;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE lead_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_slots            ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_alert_state       ENABLE ROW LEVEL SECURITY;

-- ---- lead_events: zero policies — no client SELECT, no client INSERT.
-- Every write goes through record_lead_event(); every read goes through
-- get_my_leads() / get_lead_detail(). Both are SECURITY DEFINER and so
-- bypass RLS as the function owner. ----

-- ---- offer_slots: creator full CRUD on own rows; public sees only
-- active slots (they render on public prompt pages, anon included). ----
CREATE POLICY "offer_slots_read_active_or_own" ON offer_slots
  FOR SELECT USING (active = true OR creator_id = auth.uid());

CREATE POLICY "offer_slots_insert_own" ON offer_slots
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND creator_id = auth.uid()
  );

CREATE POLICY "offer_slots_update_own" ON offer_slots
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "offer_slots_delete_own" ON offer_slots
  FOR DELETE USING (creator_id = auth.uid());

-- ---- creator_alert_settings: strictly owner-only ----
CREATE POLICY "creator_alert_settings_select_own" ON creator_alert_settings
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "creator_alert_settings_insert_own" ON creator_alert_settings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND creator_id = auth.uid()
  );

CREATE POLICY "creator_alert_settings_update_own" ON creator_alert_settings
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "creator_alert_settings_delete_own" ON creator_alert_settings
  FOR DELETE USING (creator_id = auth.uid());

-- ---- lead_alert_state: zero policies — managed entirely inside the
-- SECURITY DEFINER RPCs below. ----


-- ============================================================
-- FUNCTIONS
-- ============================================================

-- lead_event_weight: pure server-derived weight for an event_type given
-- its (already-enriched, server-computed) meta. Never reads the table,
-- never trusts client-supplied weight. A claim-bundled run/preset/follow
-- (meta.claim_bundle = true) always scores 0 — the claim event itself is
-- the only thing that scores, once (HOT-LEAD-HEAT-SPEC section 1, S1).
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
      RETURN 3;  -- S8
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


-- lead_score: the truth. 7-day half-life exponential decay, 30-day
-- window (HOT-LEAD-HEAT-SPEC section 2): sum(weight * 0.5^(age_days/7)).
-- Computed-on-read; lead_alert_state.last_score is a write-time cache
-- used only for crossing detection, never the source of truth.
CREATE OR REPLACE FUNCTION lead_score(p_creator_id UUID, p_user_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(
    weight * POWER(0.5, (EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0) / 7.0)
  ), 0)
  FROM lead_events
  WHERE creator_id = p_creator_id
    AND user_id    = p_user_id
    AND created_at >= NOW() - INTERVAL '30 days';
$$;


-- lead_stage: fixed display-tier breakpoints. Independent of a creator's
-- configurable creator_alert_settings.hot_threshold — stage is a display
-- concept, hot_threshold gates the alert (HOT-LEAD-HEAT-SPEC section 2/4
-- deliberately decouple the two).
CREATE OR REPLACE FUNCTION lead_stage(p_score NUMERIC)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_score >= 50 THEN 'hot'
    WHEN p_score >= 25 THEN 'warm'
    ELSE 'cold'
  END;
$$;


-- record_lead_event: the only write path onto lead_events. Resolves the
-- lead as auth.uid(); derives creator_id from prompts.author_id /
-- packs.creator_id (never the client); derives weight from
-- lead_event_weight() over server-computed meta (never the client);
-- enforces the 3-scored-runs-per-prompt-per-day cap; suppresses claim-
-- bundled run/preset/follow scoring; emits synthetic return_visit /
-- pack_completed / velocity_bonus events; drops self-events; runs alert
-- crossing + dedupe; returns {score, stage, alert_fired}.
CREATE OR REPLACE FUNCTION record_lead_event(
  p_event_type TEXT,
  p_prompt_id  UUID DEFAULT NULL,
  p_pack_id    UUID DEFAULT NULL,
  p_meta       JSONB DEFAULT '{}'::jsonb
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

  -- Derive creator_id server-side only. Every event type in this build
  -- is triggered from a prompt or pack context, so requiring one of the
  -- two (and rejecting when neither resolves) is the "never trust the
  -- client" boundary — there is no p_creator_id parameter to spoof.
  IF p_prompt_id IS NOT NULL THEN
    SELECT author_id INTO v_creator_id FROM prompts WHERE id = p_prompt_id;
  ELSIF p_pack_id IS NOT NULL THEN
    SELECT creator_id INTO v_creator_id FROM packs WHERE id = p_pack_id;
  END IF;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'record_lead_event: could not derive creator_id from prompt_id=% pack_id=%',
      p_prompt_id, p_pack_id;
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

GRANT EXECUTE ON FUNCTION record_lead_event(TEXT, UUID, UUID, JSONB) TO authenticated;


-- get_my_leads: ranked list for the calling creator, hard-filtered to
-- creator_id = auth.uid(). Enumerates from lead_alert_state (one row
-- per lead) but computes the displayed score live via lead_score() —
-- the cache exists for crossing detection, not display (section 2).
CREATE OR REPLACE FUNCTION get_my_leads()
RETURNS TABLE (
  user_id         UUID,
  score           NUMERIC,
  stage           TEXT,
  last_alerted_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
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
    s.updated_at
  FROM (
    SELECT
      las.user_id,
      lead_score(v_creator_id, las.user_id) AS score,
      las.last_alerted_at,
      las.updated_at
    FROM lead_alert_state las
    WHERE las.creator_id = v_creator_id
  ) s
  ORDER BY s.score DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_leads() TO authenticated;


-- get_lead_detail: full signal breakdown for one lead, hard-filtered to
-- the calling creator's own leads. Returns NULL if no events exist for
-- that (creator, lead) pair — same shape whether the lead doesn't exist
-- or simply isn't this creator's, so no existence leak either way.
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

  SELECT last_alerted_at INTO v_last_alerted_at
  FROM lead_alert_state
  WHERE creator_id = v_creator_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'score', v_score,
    'stage', lead_stage(v_score),
    'last_alerted_at', v_last_alerted_at,
    'events', v_events
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_lead_detail(UUID) TO authenticated;
