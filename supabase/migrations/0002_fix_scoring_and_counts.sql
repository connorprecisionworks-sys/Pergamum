-- ============================================================
-- Migration: 0002_fix_scoring_and_counts
-- Fixes:
--   1. trending_score never updated after publish / vote
--   2. contribution_count never incremented on publish
-- ============================================================

-- ============================================================
-- 1. TRENDING SCORE — recalculate on publish or vote change
-- ============================================================

-- Trigger function: recalculate trending_score for one prompt row
CREATE OR REPLACE FUNCTION refresh_trending_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate for published prompts
  IF NEW.status = 'published' AND NEW.published_at IS NOT NULL THEN
    NEW.trending_score := calculate_trending_score(NEW.upvotes, NEW.published_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fire on INSERT and on UPDATE when status, upvotes, or published_at changes
CREATE TRIGGER prompts_refresh_trending
  BEFORE INSERT OR UPDATE OF status, upvotes, downvotes, published_at
  ON prompts
  FOR EACH ROW EXECUTE FUNCTION refresh_trending_score();

-- Back-fill any existing published rows (safe to run; no rows in fresh DB)
UPDATE prompts
SET trending_score = calculate_trending_score(upvotes, published_at)
WHERE status = 'published' AND published_at IS NOT NULL;

-- ============================================================
-- 2. CONTRIBUTION COUNT — increment when a prompt is published
-- ============================================================

CREATE OR REPLACE FUNCTION update_contribution_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Prompt newly published (status changed TO 'published')
  IF TG_OP = 'UPDATE'
     AND OLD.status <> 'published'
     AND NEW.status = 'published' THEN
    UPDATE profiles
    SET contribution_count = contribution_count + 1
    WHERE id = NEW.author_id;
  END IF;

  -- Prompt inserted directly as published (admin / established user)
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE profiles
    SET contribution_count = contribution_count + 1
    WHERE id = NEW.author_id;
  END IF;

  -- Prompt un-published (removed / flagged) — decrement, floor at 0
  IF TG_OP = 'UPDATE'
     AND OLD.status = 'published'
     AND NEW.status <> 'published' THEN
    UPDATE profiles
    SET contribution_count = GREATEST(contribution_count - 1, 0)
    WHERE id = NEW.author_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prompts_contribution_count
  AFTER INSERT OR UPDATE OF status
  ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_contribution_count();
