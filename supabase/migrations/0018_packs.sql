-- ============================================================
-- Migration: 0018_packs
-- The pack primitive: a creator's released, versioned bundle of
-- prompts (and skills) presented like an album drop.
--
-- packs           — the release itself (title, liner note, cover, gating)
-- pack_items      — ordered prompts/skills inside a pack
-- pack_versions   — living-pack changelog, mirrors prompt_versions (0017)
-- pack_saves      — a user's "Get this pack" bookmark, mirrors collection saves
-- ============================================================

CREATE TABLE packs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL,
  liner_note   TEXT,
  cover_type   TEXT NOT NULL DEFAULT 'auto' CHECK (cover_type IN ('auto', 'upload')),
  cover_seed   TEXT,
  accent       TEXT,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  gating       TEXT NOT NULL DEFAULT 'free' CHECK (gating IN ('free', 'paid', 'follower')),
  price_cents  INT NOT NULL DEFAULT 0,
  version      INT NOT NULL DEFAULT 1,
  released_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (creator_id, slug)
);

CREATE TRIGGER packs_updated_at
  BEFORE UPDATE ON packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_packs_creator_id ON packs (creator_id);
CREATE INDEX idx_packs_status     ON packs (status);

-- pack_items: ordered prompts/skills within a pack. Exactly one of
-- prompt_id / skill_id is set — enforced below, mirroring reports'
-- multi-target-but-exactly-one-set shape (0001_init.sql).
CREATE TABLE pack_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id      UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  item_type    TEXT NOT NULL CHECK (item_type IN ('prompt', 'skill')),
  prompt_id    UUID REFERENCES prompts(id) ON DELETE CASCADE,
  skill_id     UUID REFERENCES skills(id)  ON DELETE CASCADE,
  position     INT  NOT NULL,
  promise_line TEXT,
  is_preview   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (pack_id, position),
  CHECK (
    (item_type = 'prompt' AND prompt_id IS NOT NULL AND skill_id IS NULL) OR
    (item_type = 'skill'  AND skill_id  IS NOT NULL AND prompt_id IS NULL)
  )
);

CREATE INDEX idx_pack_items_pack_id   ON pack_items (pack_id, position);
CREATE INDEX idx_pack_items_prompt_id ON pack_items (prompt_id);
CREATE INDEX idx_pack_items_skill_id  ON pack_items (skill_id);

-- pack_versions: append-only changelog, mirrors prompt_versions (0017).
-- Version 1 is implicit (packs.version defaults to 1, no row needed).
CREATE TABLE pack_versions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id    UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  version    INT  NOT NULL,
  changelog  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (pack_id, version)
);

CREATE INDEX idx_pack_versions_pack_version ON pack_versions (pack_id, version DESC);

-- pack_saves: a user's "Get this pack" bookmark.
CREATE TABLE pack_saves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_id    UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, pack_id)
);

CREATE INDEX idx_pack_saves_user_id ON pack_saves (user_id);
CREATE INDEX idx_pack_saves_pack_id ON pack_saves (pack_id);

-- notifications (0017) gains a pack_id target so pack releases/updates
-- can fan out the same way prompt updates already do.
ALTER TABLE notifications
  ADD COLUMN pack_id UUID REFERENCES packs(id) ON DELETE CASCADE;

CREATE INDEX idx_notifications_pack_id ON notifications (pack_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE packs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_saves    ENABLE ROW LEVEL SECURITY;

-- ---- packs ----
-- Public read only once released; the creator always sees their own
-- (including drafts, for the builder's live preview).
CREATE POLICY "packs_read_published_or_own" ON packs
  FOR SELECT USING (
    status = 'published' OR creator_id = auth.uid()
  );

CREATE POLICY "packs_insert_own" ON packs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND creator_id = auth.uid()
  );

CREATE POLICY "packs_update_own" ON packs
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "packs_delete_own" ON packs
  FOR DELETE USING (creator_id = auth.uid());

-- ---- pack_items ----
CREATE POLICY "pack_items_read_published_or_own" ON pack_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM packs
      WHERE packs.id = pack_items.pack_id
        AND (packs.status = 'published' OR packs.creator_id = auth.uid())
    )
  );

CREATE POLICY "pack_items_insert_own" ON pack_items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM packs
      WHERE packs.id = pack_items.pack_id AND packs.creator_id = auth.uid()
    )
  );

CREATE POLICY "pack_items_update_own" ON pack_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM packs
      WHERE packs.id = pack_items.pack_id AND packs.creator_id = auth.uid()
    )
  );

CREATE POLICY "pack_items_delete_own" ON pack_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM packs
      WHERE packs.id = pack_items.pack_id AND packs.creator_id = auth.uid()
    )
  );

-- ---- pack_versions ----
CREATE POLICY "pack_versions_read_published_or_own" ON pack_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM packs
      WHERE packs.id = pack_versions.pack_id
        AND (packs.status = 'published' OR packs.creator_id = auth.uid())
    )
  );

CREATE POLICY "pack_versions_insert_own" ON pack_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM packs
      WHERE packs.id = pack_versions.pack_id AND packs.creator_id = auth.uid()
    )
  );

-- ---- pack_saves (owner-only, no public visibility) ----
CREATE POLICY "pack_saves_read_own" ON pack_saves
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "pack_saves_insert_own" ON pack_saves
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "pack_saves_delete_own" ON pack_saves
  FOR DELETE USING (user_id = auth.uid());

-- ---- notifications: pack-release fan-out (mirrors notifications_insert_by_prompt_author) ----
CREATE POLICY "notifications_insert_by_pack_creator" ON notifications
  FOR INSERT WITH CHECK (
    pack_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM packs
      WHERE packs.id = notifications.pack_id
        AND packs.creator_id = auth.uid()
    )
  );
