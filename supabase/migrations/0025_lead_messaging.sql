-- ============================================================
-- Migration: 0025_lead_messaging
-- Platform-mediated reach: a creator can push their offer or a
-- short note to one of their own leads without ever seeing who
-- that lead is (LEAD-MESSAGING-SPEC.md).
--
-- lead_messages       — one row per sent message. No client INSERT
--                        (zero INSERT policy = deny-all, same idiom
--                        as lead_events/lead_alert_state in 0021) —
--                        every write goes through send_lead_message().
-- user_attributes      — gains creator_messages_opt_out, the
--                        strictly-owner-only opt-out column the
--                        privacy policy promises.
-- send_lead_message()  — SECURITY DEFINER RPC: validates the target
--                        is actually one of the caller's leads (a
--                        lead_events row), rejects opted-out leads,
--                        enforces a 24h-per-(creator,lead) cooldown,
--                        validates any offer_slot_id belongs to the
--                        caller, inserts the message + a
--                        'creator_message' notification to the lead.
--
-- notifications.type has no CHECK constraint (confirmed against
-- every migration touching that table) — 'creator_message' needs no
-- schema change there.
-- ============================================================

CREATE TABLE lead_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_slot_id UUID REFERENCES offer_slots(id) ON DELETE SET NULL,
  body          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at       TIMESTAMPTZ,
  clicked_at    TIMESTAMPTZ
);

CREATE INDEX idx_lead_messages_lead_created
  ON lead_messages (lead_user_id, created_at DESC);
CREATE INDEX idx_lead_messages_creator_created
  ON lead_messages (creator_id, created_at DESC);

-- ---- RLS ----
ALTER TABLE lead_messages ENABLE ROW LEVEL SECURITY;

-- No INSERT policy at all — deny-all to every client role. The only
-- write path is send_lead_message(), a SECURITY DEFINER function
-- that bypasses RLS as its owner.
CREATE POLICY "lead_messages_select_as_lead" ON lead_messages
  FOR SELECT USING (lead_user_id = auth.uid());

CREATE POLICY "lead_messages_select_as_creator" ON lead_messages
  FOR SELECT USING (creator_id = auth.uid());

-- The lead stamps read_at/clicked_at on their own rows directly from
-- the client (mirrors notifications_update_own's shape: owner-only,
-- not column-restricted — consistent with that existing precedent).
CREATE POLICY "lead_messages_update_own_as_lead" ON lead_messages
  FOR UPDATE USING (lead_user_id = auth.uid());


-- user_attributes (0016): the strictly-owner-only home for private
-- user data, since profiles.profiles_read_all is world-readable.
ALTER TABLE user_attributes
  ADD COLUMN IF NOT EXISTS creator_messages_opt_out BOOLEAN NOT NULL DEFAULT FALSE;


-- send_lead_message: the only write path onto lead_messages. Resolves
-- the caller as auth.uid(); the target lead is never trusted beyond
-- validating a real lead_events row exists for (caller, target) —
-- same "DB-enforced, not UI-enforced" boundary as record_lead_event.
CREATE OR REPLACE FUNCTION send_lead_message(
  p_lead_user_id  UUID,
  p_offer_slot_id UUID DEFAULT NULL,
  p_body          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id   UUID := auth.uid();
  v_opted_out    BOOLEAN;
  v_last_sent_at TIMESTAMPTZ;
  v_offer_label  TEXT;
  v_offer_url    TEXT;
  v_creator_name TEXT;
  v_body         TEXT;
  v_message_id   UUID;
BEGIN
  IF v_creator_id IS NULL THEN
    RETURN jsonb_build_object('sent', false, 'reason', 'not_authenticated');
  END IF;

  -- The target must be an actual lead of this creator's — a lead_events
  -- row is the only source of truth for "who is on this creator's leads
  -- list." This also blocks self-messaging for free: record_lead_event
  -- already drops self-events, so a creator_id = user_id lead_events row
  -- can never exist.
  IF NOT EXISTS (
    SELECT 1 FROM lead_events
    WHERE creator_id = v_creator_id AND user_id = p_lead_user_id
  ) THEN
    RETURN jsonb_build_object('sent', false, 'reason', 'not_a_lead');
  END IF;

  v_opted_out := COALESCE(
    (SELECT creator_messages_opt_out FROM user_attributes WHERE user_id = p_lead_user_id),
    FALSE
  );
  IF v_opted_out THEN
    RETURN jsonb_build_object('sent', false, 'reason', 'opted_out');
  END IF;

  SELECT MAX(created_at) INTO v_last_sent_at
  FROM lead_messages
  WHERE creator_id = v_creator_id AND lead_user_id = p_lead_user_id;

  IF v_last_sent_at IS NOT NULL AND v_last_sent_at > now() - INTERVAL '24 hours' THEN
    RETURN jsonb_build_object('sent', false, 'reason', 'cooldown');
  END IF;

  -- The offer slot, if any, must be the caller's own — never trust a
  -- client-supplied id without checking ownership server-side. label
  -- is NOT NULL on offer_slots, so a NULL here after the SELECT means
  -- "no matching row," not "a slot with a blank label."
  IF p_offer_slot_id IS NOT NULL THEN
    SELECT label, url INTO v_offer_label, v_offer_url
    FROM offer_slots
    WHERE id = p_offer_slot_id AND creator_id = v_creator_id;

    IF v_offer_label IS NULL THEN
      RETURN jsonb_build_object('sent', false, 'reason', 'invalid_offer_slot');
    END IF;
  END IF;

  v_body := NULLIF(BTRIM(p_body), '');

  SELECT COALESCE(display_name, username) INTO v_creator_name
  FROM profiles WHERE id = v_creator_id;

  INSERT INTO lead_messages (creator_id, lead_user_id, offer_slot_id, body)
  VALUES (v_creator_id, p_lead_user_id, p_offer_slot_id, v_body)
  RETURNING id INTO v_message_id;

  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    p_lead_user_id,
    'creator_message',
    jsonb_build_object(
      'lead_message_id', v_message_id,
      'creator_id',      v_creator_id,
      'creator_name',    v_creator_name,
      'offer_slot_id',   p_offer_slot_id,
      'offer_label',     v_offer_label,
      'offer_url',       v_offer_url,
      'note',            v_body
    )
  );

  RETURN jsonb_build_object('sent', true, 'reason', null);
END;
$$;

GRANT EXECUTE ON FUNCTION send_lead_message(UUID, UUID, TEXT) TO authenticated;
