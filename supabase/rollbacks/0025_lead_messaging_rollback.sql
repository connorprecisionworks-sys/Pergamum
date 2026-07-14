-- ============================================================
-- Rollback for: 0025_lead_messaging
-- Drops the RPC, the lead_messages table (cascades its own indexes
-- and RLS policies), and the opt-out column on user_attributes.
--
-- Destructive: every message a creator has sent through this
-- feature, and each one's read/clicked state, is lost. Any
-- 'creator_message' notification rows already delivered to leads
-- are left in place — payload is plain JSONB with no foreign key
-- to lead_messages, so nothing there breaks or dangles.
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

DROP FUNCTION IF EXISTS send_lead_message(UUID, UUID, TEXT);

DROP TABLE IF EXISTS lead_messages;

ALTER TABLE user_attributes DROP COLUMN IF EXISTS creator_messages_opt_out;
