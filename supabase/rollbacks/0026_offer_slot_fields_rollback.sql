-- ============================================================
-- Rollback for: 0026_offer_slot_fields
-- Drops the title and image_url columns added to offer_slots.
-- Any data in those columns is lost — there is no separate archive.
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

ALTER TABLE offer_slots DROP COLUMN title, DROP COLUMN image_url;
