-- analytics_events: lightweight first-party funnel tracking
-- events are written by the API route; user_id is nullable for pre-auth events

CREATE TABLE analytics_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event      text NOT NULL,
  props      jsonb,
  user_id    uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert their own events (or null user_id for anon)
CREATE POLICY "analytics_events_insert"
  ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Allow anon inserts for pre-auth events (signup_started fires before the user exists)
CREATE POLICY "analytics_events_insert_anon"
  ON analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- No SELECT for regular users; use service role for reporting
