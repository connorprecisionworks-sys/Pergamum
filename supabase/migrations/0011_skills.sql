-- ============================================================
-- Pergamum — Community Prompt Library
-- Migration: 0011_skills
--
-- Adds a "Claude Code Skills" directory: a unified place to share
-- helpful skills/plugins with install commands, source URLs, and
-- inline SKILL.md previews. Mirrors the prompts shape so it inherits
-- the same UX (browse, sort, vote, moderate, flag).
-- ============================================================

-- ============================================================
-- SKILLS
-- ============================================================
CREATE TABLE skills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  summary           TEXT NOT NULL,
  install_command   TEXT,                                  -- e.g. `claude plugin install ...` or `curl ... | bash`
  source_url        TEXT,                                  -- GitHub repo / marketplace listing
  readme            TEXT,                                  -- inline SKILL.md content (markdown)
  category          TEXT,                                  -- free-text bucket: 'coding', 'writing', 'agents', etc.
  runtimes          TEXT[] NOT NULL DEFAULT '{}',          -- ['claude-code', 'cowork', 'claude-api']
  tags              TEXT[] NOT NULL DEFAULT '{}',
  upvotes           INT NOT NULL DEFAULT 0,
  downvotes         INT NOT NULL DEFAULT 0,
  views             INT NOT NULL DEFAULT 0,
  copies            INT NOT NULL DEFAULT 0,                -- # of install-command copies
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('draft', 'pending', 'published', 'flagged', 'removed')),
  trending_score    FLOAT NOT NULL DEFAULT 0,
  search_vector     TSVECTOR,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at      TIMESTAMPTZ,

  -- At least one of install_command / source_url must be provided.
  CONSTRAINT skills_must_be_installable CHECK (
    (install_command IS NOT NULL AND length(trim(install_command)) > 0)
    OR (source_url IS NOT NULL AND length(trim(source_url)) > 0)
  )
);

CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEARCH VECTOR TRIGGER (mirrors prompts.search_vector behaviour)
-- ============================================================
CREATE OR REPLACE FUNCTION update_skill_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.readme, '')), 'C') ||
    setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_search_vector_sync
  BEFORE INSERT OR UPDATE OF name, summary, readme, tags
  ON skills
  FOR EACH ROW EXECUTE FUNCTION update_skill_search_vector();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_skills_search_vector    ON skills USING GIN (search_vector);
CREATE INDEX idx_skills_tags             ON skills USING GIN (tags);
CREATE INDEX idx_skills_runtimes         ON skills USING GIN (runtimes);
CREATE INDEX idx_skills_trending_score   ON skills (trending_score DESC) WHERE status = 'published';
CREATE INDEX idx_skills_published_at     ON skills (published_at DESC)   WHERE status = 'published';
CREATE INDEX idx_skills_upvotes          ON skills (upvotes DESC)        WHERE status = 'published';
CREATE INDEX idx_skills_category         ON skills (category);
CREATE INDEX idx_skills_author_id        ON skills (author_id);
CREATE INDEX idx_skills_status           ON skills (status);

-- ============================================================
-- SKILL VOTES (separate from prompts.votes for clarity)
-- ============================================================
CREATE TABLE skill_votes (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id   UUID NOT NULL REFERENCES skills(id)   ON DELETE CASCADE,
  value      SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- Keep upvotes/downvotes counters in sync on insert/update/delete.
CREATE OR REPLACE FUNCTION update_skill_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.value = 1 THEN
      UPDATE skills SET upvotes   = upvotes   + 1 WHERE id = NEW.skill_id;
    ELSE
      UPDATE skills SET downvotes = downvotes + 1 WHERE id = NEW.skill_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.value = 1 THEN
      UPDATE skills SET upvotes   = GREATEST(upvotes   - 1, 0) WHERE id = OLD.skill_id;
    ELSE
      UPDATE skills SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.skill_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.value = 1 AND NEW.value = -1 THEN
      UPDATE skills
        SET upvotes   = GREATEST(upvotes   - 1, 0),
            downvotes = downvotes + 1
        WHERE id = NEW.skill_id;
    ELSIF OLD.value = -1 AND NEW.value = 1 THEN
      UPDATE skills
        SET downvotes = GREATEST(downvotes - 1, 0),
            upvotes   = upvotes + 1
        WHERE id = NEW.skill_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER skill_votes_sync_counts
  AFTER INSERT OR UPDATE OR DELETE ON skill_votes
  FOR EACH ROW EXECUTE FUNCTION update_skill_vote_counts();

-- ============================================================
-- TRENDING SCORE (re-uses calculate_trending_score from 0001)
-- Called on read for v1, same as prompts.
-- ============================================================

-- ============================================================
-- REPORTS — extend the existing reports table to point at skills.
-- The original constraint required a prompt_id OR comment_id; we
-- now allow skill_id as a third target.
-- ============================================================
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES skills(id) ON DELETE SET NULL;

ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_target_check;

ALTER TABLE reports
  ADD CONSTRAINT reports_target_check CHECK (
    prompt_id IS NOT NULL
    OR comment_id IS NOT NULL
    OR skill_id IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_reports_skill_id ON reports (skill_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE skills      ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_votes ENABLE ROW LEVEL SECURITY;

-- ---- skills ----
-- Read: published skills are visible to everyone; author + admins see all.
CREATE POLICY "skills_read_published" ON skills
  FOR SELECT USING (
    status = 'published'
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "skills_insert_auth" ON skills
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND author_id = auth.uid()
  );

CREATE POLICY "skills_update_own_or_admin" ON skills
  FOR UPDATE USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "skills_delete_own_or_admin" ON skills
  FOR DELETE USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---- skill_votes ----
CREATE POLICY "skill_votes_read_own" ON skill_votes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "skill_votes_insert_own" ON skill_votes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "skill_votes_update_own" ON skill_votes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "skill_votes_delete_own" ON skill_votes
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- SEED — a handful of well-known starter skills so the page isn't
-- empty on first load. Author is the first admin if one exists,
-- otherwise we skip the seed silently.
-- ============================================================
DO $$
DECLARE
  seed_author UUID;
BEGIN
  SELECT id INTO seed_author FROM profiles WHERE is_admin = TRUE ORDER BY created_at ASC LIMIT 1;
  IF seed_author IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO skills (author_id, name, slug, summary, install_command, source_url, readme, category, runtimes, tags, status, published_at)
  VALUES
    (
      seed_author,
      'PDF Toolkit',
      'pdf-toolkit',
      'Read, extract, merge, split, and OCR PDF files end-to-end from a single skill.',
      '/plugin install anthropic-skills',
      'https://github.com/anthropics/skills',
      E'# PDF Toolkit\n\nComprehensive PDF manipulation: extract text/tables, create new PDFs, merge/split documents, and handle forms.\n\n**Triggers:** PDF, .pdf, form, extract, merge, split.',
      'coding',
      ARRAY['claude-code', 'cowork'],
      ARRAY['pdf', 'extraction', 'documents'],
      'published',
      NOW()
    ),
    (
      seed_author,
      'Excel Spreadsheet Handler',
      'xlsx-skill',
      'Create, edit, and analyse .xlsx files — formulas, formatting, charts, data cleaning.',
      '/plugin install anthropic-skills',
      'https://github.com/anthropics/skills',
      E'# Excel Skill\n\nFull Microsoft Excel support — formulas, formatting, data analysis, visualisation.\n\n**Triggers:** Excel, spreadsheet, .xlsx, budget, financial model, chart.',
      'data',
      ARRAY['claude-code', 'cowork'],
      ARRAY['excel', 'spreadsheet', 'data'],
      'published',
      NOW()
    ),
    (
      seed_author,
      'Word Document Skill',
      'docx-skill',
      'Generate polished .docx reports, memos, letters, and templates with proper formatting.',
      '/plugin install anthropic-skills',
      'https://github.com/anthropics/skills',
      E'# DOCX Skill\n\nProduce Word documents with tables of contents, headings, page numbers, and letterheads.\n\n**Triggers:** Word doc, .docx, report, memo, letter, template.',
      'writing',
      ARRAY['claude-code', 'cowork'],
      ARRAY['word', 'documents', 'reports'],
      'published',
      NOW()
    ),
    (
      seed_author,
      'Presentation Builder',
      'pptx-skill',
      'Build slide decks and pitch presentations end-to-end as .pptx files.',
      '/plugin install anthropic-skills',
      'https://github.com/anthropics/skills',
      E'# PPTX Skill\n\nCreate, parse, and edit PowerPoint decks — layouts, speaker notes, themes.\n\n**Triggers:** deck, slides, presentation, .pptx.',
      'writing',
      ARRAY['claude-code', 'cowork'],
      ARRAY['powerpoint', 'slides', 'deck'],
      'published',
      NOW()
    ),
    (
      seed_author,
      'Skill Creator',
      'skill-creator',
      'Bootstrap, edit, and benchmark your own Claude Code skills with evals and variance analysis.',
      '/plugin install anthropic-skills',
      'https://github.com/anthropics/skills',
      E'# Skill Creator\n\nCreate new skills from scratch, optimize descriptions for better triggering, and benchmark performance.\n\n**Triggers:** create a skill, edit a skill, optimize a skill.',
      'agents',
      ARRAY['claude-code'],
      ARRAY['meta', 'evals', 'tooling'],
      'published',
      NOW()
    );
END;
$$;
