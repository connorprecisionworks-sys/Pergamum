-- ============================================================
-- Migration: 0026_offer_slot_fields
-- Adds the fields the slide-in offer popup needs beyond the plain
-- button (label/url/description) offer_slots already had: a headline
-- distinct from the button's own text, and an image to show alongside
-- it. Both nullable — existing slots render fine with neither set.
-- ============================================================

ALTER TABLE offer_slots ADD COLUMN title text, ADD COLUMN image_url text;
