-- ============================================================
-- Migration: 0006_v2_engagement
-- Adds rich profiles, reputation/badges, collections, follows,
-- remix lineage, and engagement engine for Pergamum v2.
--
-- Safe to run multiple times — uses IF NOT EXISTS and
-- DROP … IF EXISTS throughout.
-- ============================================================


-- ============================================================
-- SECTION 1: EXTEND EXISTING TABLES
-- ============================================================

-- profiles: social links + aggregate counters
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS website                   TEXT,
  ADD COLUMN IF NOT EXISTS twitter                   TEXT,
  ADD COLUMN IF NOT EXISTS github                    TEXT,
  ADD COLUMN IF NOT EXISTS location                  TEXT,
  ADD COLUMN IF NOT EXISTS featured_prompt_id        UUID REFERENCES prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lifetime_copies           INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_upvotes_received INT NOT NULL DEFAULT 0;
  -- bio, reputation already exist from migration 0001

-- prompts: remix lineage + explicit copy counter
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS forked_from_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS copies         INT NOT NULL DEFAULT 0;
  -- views already exists; copies is an explicit "copy prompt" action counter


-- ============================================================
-- SECTION 2: NEW TABLES
-- ============================================================

-- badges: master catalogue of all earnable badges
CREATE TABLE IF NOT EXISTS badges (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT    UNIQUE NOT NULL,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  icon        TEXT    NOT NULL DEFAULT 'Award',  -- lucide-react icon name
  tier        TEXT    NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  criteria    JSONB   NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_badges: junction table — which users have earned which badges
CREATE TABLE IF NOT EXISTS user_badges (
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id  UUID NOT NULL REFERENCES badges(id)   ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- collections: curated lists of prompts
CREATE TABLE IF NOT EXISTS collections (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  slug        TEXT    NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  cover_color TEXT    NOT NULL DEFAULT 'zinc',  -- e.g. 'zinc', 'pergamum', 'amber'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, slug)
);

CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- collection_prompts: ordered prompts within a collection
CREATE TABLE IF NOT EXISTS collection_prompts (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  prompt_id     UUID NOT NULL REFERENCES prompts(id)     ON DELETE CASCADE,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sort_order    INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, prompt_id)
);

-- follows: user → user follow relationships
CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- comments: already exists from migration 0001 — CREATE IF NOT EXISTS is a no-op
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id  UUID NOT NULL REFERENCES prompts(id)   ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  body       TEXT NOT NULL,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SECTION 3: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id     ON user_badges  (user_id);
CREATE INDEX IF NOT EXISTS idx_collections_owner_id    ON collections  (owner_id);
CREATE INDEX IF NOT EXISTS idx_collections_slug        ON collections  (slug);
CREATE INDEX IF NOT EXISTS idx_collection_prompts_coll ON collection_prompts (collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_prompts_prmp ON collection_prompts (prompt_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower        ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following       ON follows (following_id);
CREATE INDEX IF NOT EXISTS idx_prompts_forked_from     ON prompts (forked_from_id);


-- ============================================================
-- SECTION 4: REPUTATION RULES
-- (documented here; enforced by triggers below)
--
-- +5   Your prompt receives an upvote
-- −2   Your prompt receives a downvote
-- −5   An upvote you received is removed
-- +2   A downvote you received is removed
-- +10  Your prompt is published (approved or direct publish)
-- +2   You publish a remix of someone else's prompt
-- +3   Someone remixes your prompt (awarded to original author at remix publish)
-- +1   You copy someone's prompt (action via /api/prompts/copy)
--      (this is +1 to the ORIGINAL author, not the copier)
-- +1   You leave a comment (capped at 10/day to prevent farming)
-- −15  Admin removes your prompt
-- +25  Your prompt is featured by admin (reserved — triggered by admin action)
--
-- Reputation floor: 0 (never goes negative)
-- ============================================================


-- ============================================================
-- SECTION 5: FUNCTIONS
-- ============================================================

-- ----------------------------------------------------------
-- 5a. check_badges_for_user
-- Re-evaluates all badge criteria for a user and inserts
-- any newly-earned badges. Called from reputation triggers.
-- Uses direct DB counts (not cached profile aggregates) to
-- avoid race conditions when multiple triggers fire together.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION check_badges_for_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prompt_count    BIGINT;
  v_upvotes_recv    INT;
  v_copies_recv     INT;
  v_collection_cnt  BIGINT;
  v_follower_cnt    BIGINT;
  v_remix_count     BIGINT;
  v_reputation      INT;
  v_badge           RECORD;
  v_threshold       INT;
  v_type            TEXT;
BEGIN
  -- Pull live stats
  SELECT
    COALESCE(lifetime_upvotes_received, 0),
    COALESCE(lifetime_copies,           0),
    COALESCE(reputation,                0)
  INTO v_upvotes_recv, v_copies_recv, v_reputation
  FROM profiles WHERE id = p_user_id;

  SELECT COUNT(*) INTO v_prompt_count
  FROM prompts WHERE author_id = p_user_id AND status = 'published';

  SELECT COUNT(*) INTO v_collection_cnt
  FROM collections WHERE owner_id = p_user_id;

  SELECT COUNT(*) INTO v_follower_cnt
  FROM follows WHERE following_id = p_user_id;

  SELECT COUNT(*) INTO v_remix_count
  FROM prompts
  WHERE author_id = p_user_id
    AND forked_from_id IS NOT NULL
    AND status = 'published';

  -- Walk every badge and award if criteria met and not yet earned
  FOR v_badge IN SELECT id, slug, criteria FROM badges LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM user_badges
      WHERE user_id = p_user_id AND badge_id = v_badge.id
    );

    v_type      := v_badge.criteria->>'type';
    v_threshold := (v_badge.criteria->>'threshold')::INT;

    IF (v_type = 'prompt_count'     AND v_prompt_count    >= v_threshold) OR
       (v_type = 'upvotes_received' AND v_upvotes_recv    >= v_threshold) OR
       (v_type = 'copies_received'  AND v_copies_recv     >= v_threshold) OR
       (v_type = 'collection_count' AND v_collection_cnt  >= v_threshold) OR
       (v_type = 'follower_count'   AND v_follower_cnt    >= v_threshold) OR
       (v_type = 'remix_count'      AND v_remix_count     >= v_threshold) OR
       (v_type = 'reputation'       AND v_reputation      >= v_threshold)
    THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, v_badge.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;


-- ----------------------------------------------------------
-- 5b. award_reputation_on_vote
-- Fires AFTER INSERT/UPDATE/DELETE on votes.
-- Adjusts the prompt author's reputation and
-- lifetime_upvotes_received aggregate.
-- Self-votes are skipped.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION award_reputation_on_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_author_id  UUID;
  v_rep_delta  INT := 0;
  v_upv_delta  INT := 0;
BEGIN
  -- Identify the prompt author
  IF TG_OP = 'DELETE' THEN
    SELECT author_id INTO v_author_id FROM prompts WHERE id = OLD.prompt_id;
  ELSE
    SELECT author_id INTO v_author_id FROM prompts WHERE id = NEW.prompt_id;
  END IF;

  IF v_author_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Skip self-votes
    IF v_author_id = NEW.user_id THEN RETURN NEW; END IF;
    IF    NEW.value =  1 THEN v_rep_delta :=  5; v_upv_delta :=  1;
    ELSIF NEW.value = -1 THEN v_rep_delta := -2;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF v_author_id = NEW.user_id THEN RETURN NEW; END IF;
    -- Reverse previous value
    IF    OLD.value =  1 THEN v_rep_delta := -5; v_upv_delta := -1;
    ELSIF OLD.value = -1 THEN v_rep_delta :=  2;
    END IF;
    -- Apply new value
    IF    NEW.value =  1 THEN v_rep_delta := v_rep_delta + 5; v_upv_delta := v_upv_delta + 1;
    ELSIF NEW.value = -1 THEN v_rep_delta := v_rep_delta - 2;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF v_author_id = OLD.user_id THEN RETURN OLD; END IF;
    IF    OLD.value =  1 THEN v_rep_delta := -5; v_upv_delta := -1;
    ELSIF OLD.value = -1 THEN v_rep_delta :=  2;
    END IF;
  END IF;

  IF v_rep_delta <> 0 OR v_upv_delta <> 0 THEN
    UPDATE profiles
    SET
      reputation                 = GREATEST(0, reputation                 + v_rep_delta),
      lifetime_upvotes_received  = GREATEST(0, lifetime_upvotes_received  + v_upv_delta)
    WHERE id = v_author_id;

    PERFORM check_badges_for_user(v_author_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


-- ----------------------------------------------------------
-- 5c. award_reputation_on_publish
-- Fires AFTER UPDATE on prompts.
-- • status  → 'published': +10 to author; remix bonuses if forked
-- • status  → 'removed':   −15 to author
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION award_reputation_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_original_author UUID;
BEGIN
  -- Transition INTO 'published'
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    -- Base publish reward
    UPDATE profiles
    SET reputation = reputation + 10
    WHERE id = NEW.author_id;

    -- Remix bonus: +2 for remixer, +3 for original author
    IF NEW.forked_from_id IS NOT NULL THEN
      SELECT author_id INTO v_original_author
      FROM prompts WHERE id = NEW.forked_from_id;

      IF v_original_author IS NOT NULL AND v_original_author <> NEW.author_id THEN
        UPDATE profiles SET reputation = reputation + 2 WHERE id = NEW.author_id;
        UPDATE profiles SET reputation = reputation + 3 WHERE id = v_original_author;
        PERFORM check_badges_for_user(v_original_author);
      END IF;
    END IF;

    PERFORM check_badges_for_user(NEW.author_id);
  END IF;

  -- Transition INTO 'removed' (admin moderation penalty)
  IF NEW.status = 'removed' AND OLD.status IS DISTINCT FROM 'removed' THEN
    UPDATE profiles
    SET reputation = GREATEST(0, reputation - 15)
    WHERE id = NEW.author_id;
  END IF;

  RETURN NEW;
END;
$$;


-- ----------------------------------------------------------
-- 5d. award_reputation_on_comment
-- Fires AFTER INSERT on comments.
-- +1 rep per comment, capped at 10 rep-earning comments/day.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION award_reputation_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today_rep_comments INT;
BEGIN
  -- Count comments this user has posted today that earned rep
  -- (all of today's comments; the cap is on the rep gain, not the comments)
  SELECT COUNT(*) INTO v_today_rep_comments
  FROM comments
  WHERE user_id    = NEW.user_id
    AND created_at >= CURRENT_DATE
    AND created_at <  CURRENT_DATE + INTERVAL '1 day'
    AND id         <> NEW.id;  -- exclude the row just inserted

  IF v_today_rep_comments < 10 THEN
    UPDATE profiles
    SET reputation = reputation + 1
    WHERE id = NEW.user_id;

    PERFORM check_badges_for_user(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$;


-- ----------------------------------------------------------
-- 5e. record_prompt_copy(prompt_id)
-- Called from /api/prompts/copy via Supabase RPC.
-- Increments prompts.copies, awards +1 rep to the author,
-- and updates the author's lifetime_copies aggregate.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION record_prompt_copy(p_prompt_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_author_id UUID;
BEGIN
  SELECT author_id INTO v_author_id FROM prompts WHERE id = p_prompt_id;

  IF v_author_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE prompts SET copies = copies + 1 WHERE id = p_prompt_id;

  UPDATE profiles
  SET
    lifetime_copies = lifetime_copies + 1,
    reputation      = reputation + 1
  WHERE id = v_author_id;

  PERFORM check_badges_for_user(v_author_id);
END;
$$;

-- Allow authenticated users to call record_prompt_copy via RPC
GRANT EXECUTE ON FUNCTION record_prompt_copy(UUID) TO authenticated;


-- ============================================================
-- SECTION 6: TRIGGERS
-- ============================================================

-- votes → reputation
DROP TRIGGER IF EXISTS votes_award_reputation ON votes;
CREATE TRIGGER votes_award_reputation
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION award_reputation_on_vote();

-- prompts → reputation on publish/remove
DROP TRIGGER IF EXISTS prompts_award_reputation ON prompts;
CREATE TRIGGER prompts_award_reputation
  AFTER UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION award_reputation_on_publish();

-- comments → reputation
DROP TRIGGER IF EXISTS comments_award_reputation ON comments;
CREATE TRIGGER comments_award_reputation
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION award_reputation_on_comment();


-- ============================================================
-- SECTION 7: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE badges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows            ENABLE ROW LEVEL SECURITY;

-- ---- badges (public catalogue, immutable by end-users) ----
DROP POLICY IF EXISTS "badges_read_all"   ON badges;
CREATE POLICY "badges_read_all" ON badges
  FOR SELECT USING (TRUE);

-- ---- user_badges (public — social proof) ----
DROP POLICY IF EXISTS "user_badges_read_all" ON user_badges;
CREATE POLICY "user_badges_read_all" ON user_badges
  FOR SELECT USING (TRUE);
-- No direct INSERT/UPDATE/DELETE — only trigger functions (SECURITY DEFINER) write here.

-- ---- collections ----
DROP POLICY IF EXISTS "collections_read_public_or_owner" ON collections;
CREATE POLICY "collections_read_public_or_owner" ON collections
  FOR SELECT USING (
    is_public = TRUE
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "collections_insert_owner" ON collections;
CREATE POLICY "collections_insert_owner" ON collections
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "collections_update_owner" ON collections;
CREATE POLICY "collections_update_owner" ON collections
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "collections_delete_owner" ON collections;
CREATE POLICY "collections_delete_owner" ON collections
  FOR DELETE USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ---- collection_prompts ----
DROP POLICY IF EXISTS "collection_prompts_read" ON collection_prompts;
CREATE POLICY "collection_prompts_read" ON collection_prompts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id
        AND (c.is_public = TRUE OR c.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "collection_prompts_insert_owner" ON collection_prompts;
CREATE POLICY "collection_prompts_insert_owner" ON collection_prompts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "collection_prompts_delete_owner" ON collection_prompts;
CREATE POLICY "collection_prompts_delete_owner" ON collection_prompts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "collection_prompts_update_owner" ON collection_prompts;
CREATE POLICY "collection_prompts_update_owner" ON collection_prompts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.owner_id = auth.uid()
    )
  );

-- ---- follows ----
DROP POLICY IF EXISTS "follows_read_all" ON follows;
CREATE POLICY "follows_read_all" ON follows
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND follower_id = auth.uid()
  );

DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_delete_own" ON follows
  FOR DELETE USING (follower_id = auth.uid());


-- ============================================================
-- SECTION 8: BADGE SEEDS
-- (idempotent — ON CONFLICT (slug) DO NOTHING)
-- ============================================================

INSERT INTO badges (slug, name, description, icon, tier, criteria) VALUES
  -- Authorship
  ('first_prompt',     'First Steps',        'Published your first prompt',             'FileText',   'bronze', '{"type":"prompt_count","threshold":1}'),
  ('ten_prompts',      'Prolific Author',     'Published 10 prompts',                   'Library',    'silver', '{"type":"prompt_count","threshold":10}'),
  ('fifty_prompts',    'Master Scribe',       'Published 50 prompts',                   'BookOpen',   'gold',   '{"type":"prompt_count","threshold":50}'),
  -- Upvotes
  ('first_upvote',     'First Applause',      'Received your first upvote',             'ArrowUp',    'bronze', '{"type":"upvotes_received","threshold":1}'),
  ('hundred_upvotes',  'Well Received',       'Received 100 total upvotes',             'ThumbsUp',   'silver', '{"type":"upvotes_received","threshold":100}'),
  ('thousand_upvotes', 'Community Favourite', 'Received 1,000 total upvotes',           'Trophy',     'gold',   '{"type":"upvotes_received","threshold":1000}'),
  -- Copies
  ('first_copy',       'Worth Keeping',       'A prompt of yours was copied',           'Copy',       'bronze', '{"type":"copies_received","threshold":1}'),
  ('hundred_copies',   'Template Master',     'Your prompts were copied 100 times',     'Files',      'silver', '{"type":"copies_received","threshold":100}'),
  -- Collections
  ('first_collection', 'First Collection',    'Created your first collection',          'Bookmark',   'bronze', '{"type":"collection_count","threshold":1}'),
  -- Social
  ('first_follower',   'First Follower',      'Gained your first follower',             'Users',      'bronze', '{"type":"follower_count","threshold":1}'),
  -- Remixes
  ('first_remix',      'Remixer',             'Published a remix of someone''s prompt', 'GitFork',    'bronze', '{"type":"remix_count","threshold":1}'),
  -- Reputation milestones
  ('curator',          'Curator',             'Reached 500 reputation',                 'Star',       'silver', '{"type":"reputation","threshold":500}'),
  ('librarian',        'Librarian',           'Reached 2,000 reputation',               'Crown',      'gold',   '{"type":"reputation","threshold":2000}')
ON CONFLICT (slug) DO NOTHING;
