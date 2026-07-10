-- ============================================================
-- Migration: 0017_living_prompts
-- Version history, changelog, "updated" marker, and update
-- notifications for published prompts.
--
-- prompts.updated_at already exists with a trigger (prompts_updated_at,
-- 0001_init.sql) — nothing to add there. version is new.
-- ============================================================

ALTER TABLE prompts
  ADD COLUMN version INT NOT NULL DEFAULT 1;

-- prompt_versions is an append-only changelog. Version 1 is implicit
-- (prompts.version defaults to 1, no row needed) — rows start appearing
-- from the second published version onward, written when an author
-- edits and re-publishes.
CREATE TABLE prompt_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id      UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version        INT NOT NULL,
  changelog      TEXT,
  body_snapshot  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (prompt_id, version)
);

CREATE INDEX idx_prompt_versions_prompt_version
  ON prompt_versions (prompt_id, version DESC);

-- ---- RLS ----
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

-- Public can read a prompt's version history once the prompt itself is
-- published — same visibility rule as the prompt content it's a history of.
CREATE POLICY "prompt_versions_select_published" ON prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts
      WHERE prompts.id = prompt_versions.prompt_id
        AND prompts.status = 'published'
    )
  );

-- Only the prompt's author can write a version row for it.
CREATE POLICY "prompt_versions_insert_by_author" ON prompt_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts
      WHERE prompts.id = prompt_versions.prompt_id
        AND prompts.author_id = auth.uid()
    )
  );

-- notifications: minimal, in-app only (no email here). One row per
-- recipient per event.
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  prompt_id  UUID REFERENCES prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at    TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- ---- RLS ----
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users see only their own notifications.
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Marking a notification read is the only write a recipient makes.
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- A notification can only be inserted by the author of the prompt it
-- references — this is what lets the update-fan-out write rows for
-- OTHER users (the followers/collection-savers being notified) without
-- a service-role bypass, while still preventing arbitrary spam: you can
-- only ever generate notifications about a prompt you actually authored.
CREATE POLICY "notifications_insert_by_prompt_author" ON notifications
  FOR INSERT WITH CHECK (
    prompt_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM prompts
      WHERE prompts.id = notifications.prompt_id
        AND prompts.author_id = auth.uid()
    )
  );
