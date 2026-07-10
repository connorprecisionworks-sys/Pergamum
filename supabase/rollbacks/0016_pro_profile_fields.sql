-- ============================================================
-- Rollback for: 0016_pro_profile_fields
-- Drops user_attributes (cascades its trigger, indexes, and RLS
-- policies), then the 3 enum types (table must go first — Postgres
-- won't drop a type still referenced by a column).
--
-- Run manually against the target database; this file is never
-- picked up by `supabase db push` (only supabase/migrations/ is).
-- ============================================================

DROP TABLE IF EXISTS user_attributes;

DROP TYPE IF EXISTS role_category_enum;
DROP TYPE IF EXISTS industry_enum;
DROP TYPE IF EXISTS company_size_enum;
