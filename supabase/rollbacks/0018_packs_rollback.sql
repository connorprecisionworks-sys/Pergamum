-- ============================================================
-- Rollback for: 0018_packs
-- Drops the notifications_insert_by_pack_creator policy and
-- notifications.pack_id column first (a column can't be dropped
-- while a policy references it), then drops pack_saves,
-- pack_versions, pack_items, and packs in dependency order —
-- DROP TABLE cascades each table's own indexes, triggers, and
-- RLS policies automatically.
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

DROP POLICY IF EXISTS "notifications_insert_by_pack_creator" ON notifications;
ALTER TABLE notifications DROP COLUMN IF EXISTS pack_id;

DROP TABLE IF EXISTS pack_saves;
DROP TABLE IF EXISTS pack_versions;
DROP TABLE IF EXISTS pack_items;
DROP TABLE IF EXISTS packs;
