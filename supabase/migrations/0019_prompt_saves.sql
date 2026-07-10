-- ============================================================
-- Migration: 0019_prompt_saves
-- Single-prompt bookmarks — the "Singles" shelf in the user library
-- (/library). Mirrors pack_saves (0018_packs.sql) exactly: an
-- owner-only junction table, no public visibility.
-- ============================================================

CREATE TABLE prompt_saves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id  UUID NOT NULL REFERENCES prompts(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, prompt_id)
);

CREATE INDEX idx_prompt_saves_user_id   ON prompt_saves (user_id);
CREATE INDEX idx_prompt_saves_prompt_id ON prompt_saves (prompt_id);

-- ---- RLS ----
ALTER TABLE prompt_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_saves_read_own" ON prompt_saves
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "prompt_saves_insert_own" ON prompt_saves
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "prompt_saves_delete_own" ON prompt_saves
  FOR DELETE USING (user_id = auth.uid());
