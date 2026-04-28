-- ============================================================
-- Migration: 0008_security_hardening
-- Rate limiting for the vote endpoint.
-- One row per vote action; rows older than 1 hour are stale.
-- ============================================================

CREATE TABLE rate_limit_vote_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_vote_user_time
  ON rate_limit_vote_log (user_id, created_at DESC);

ALTER TABLE rate_limit_vote_log ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own rows; no SELECT for users
CREATE POLICY "rate_limit_vote_log_insert_own"
  ON rate_limit_vote_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Purge function — call via pg_cron or Supabase scheduled job:
--   SELECT purge_old_rate_limit_logs();
-- Removes rows older than 1 hour to keep the table small.
-- ============================================================
CREATE OR REPLACE FUNCTION purge_old_rate_limit_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM rate_limit_vote_log
  WHERE created_at < now() - INTERVAL '1 hour';
$$;
