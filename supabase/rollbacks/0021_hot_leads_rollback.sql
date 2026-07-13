-- ============================================================
-- Rollback for: 0021_hot_leads
-- Drops the RPCs (exact signatures, since Postgres overloads on
-- argument types), then the four new tables in reverse creation
-- order — DROP TABLE cascades each table's own indexes, triggers,
-- and RLS policies automatically — then notifications.payload.
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
--
-- Destructive: every recorded lead_events row, offer slot, alert
-- setting, and alert dedupe state is lost. Any 'hot_lead' notification
-- rows already sent to creators are left in place (payload column is
-- dropped, so their payload jsonb is lost, but the row itself stays).
-- ============================================================

DROP FUNCTION IF EXISTS get_lead_detail(UUID);
DROP FUNCTION IF EXISTS get_my_leads();
DROP FUNCTION IF EXISTS record_lead_event(TEXT, UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS lead_stage(NUMERIC);
DROP FUNCTION IF EXISTS lead_score(UUID, UUID);
DROP FUNCTION IF EXISTS lead_event_weight(TEXT, JSONB);

DROP TABLE IF EXISTS lead_alert_state;
DROP TABLE IF EXISTS creator_alert_settings;
DROP TABLE IF EXISTS offer_slots;
DROP TABLE IF EXISTS lead_events;

ALTER TABLE notifications DROP COLUMN IF EXISTS payload;
