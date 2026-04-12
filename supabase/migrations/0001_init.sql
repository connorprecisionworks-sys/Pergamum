-- ============================================================
-- Pergamum — Community Prompt Library
-- Migration: 0001_init
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- GENERIC update_updated_at TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  contribution_count INT NOT NULL DEFAULT 0,
  reputation      INT NOT NULL DEFAULT 0,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT UNIQUE NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  icon        TEXT,              -- lucide-react icon name
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug, icon, description, sort_order) VALUES
  ('Writing',           'writing',           'PenLine',       'Creative writing, copywriting, storytelling, and editing prompts.',            1),
  ('Coding',            'coding',            'Code2',         'Programming, debugging, code review, and software architecture prompts.',       2),
  ('Marketing',         'marketing',         'Megaphone',     'Ad copy, brand messaging, social content, and campaign strategy.',             3),
  ('Research',          'research',          'Search',        'Literature review, synthesis, fact-checking, and knowledge gathering.',        4),
  ('Business Strategy', 'business-strategy', 'Briefcase',     'Business plans, competitive analysis, frameworks, and strategic thinking.',    5),
  ('Image Generation',  'image-generation',  'Image',         'Prompts for Midjourney, DALL·E, Stable Diffusion, Ideogram, and more.',        6),
  ('Video Scripts',     'video-scripts',     'Clapperboard',  'YouTube scripts, short-form video, documentary narration, and storyboards.',   7),
  ('Web Development',   'web-development',   'Globe',         'HTML, CSS, JavaScript, frameworks, and full-stack web prompts.',               8),
  ('Data Analysis',     'data-analysis',     'BarChart2',     'Data cleaning, visualization, SQL queries, and statistical analysis.',         9),
  ('Education',         'education',         'GraduationCap', 'Lesson plans, tutoring prompts, quiz generation, and learning resources.',    10),
  ('Productivity',      'productivity',      'Zap',           'Task management, time-boxing, summarization, and workflow optimization.',      11),
  ('Other',             'other',             'Sparkles',      'Prompts that don''t fit neatly elsewhere.',                                    12);

-- ============================================================
-- PROMPTS
-- ============================================================
CREATE TABLE prompts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  body             TEXT NOT NULL,
  description      TEXT,
  model_tags       TEXT[] NOT NULL DEFAULT '{}',
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  variables        JSONB NOT NULL DEFAULT '[]'::jsonb,
  upvotes          INT NOT NULL DEFAULT 0,
  downvotes        INT NOT NULL DEFAULT 0,
  views            INT NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published', 'flagged', 'removed')),
  trending_score   FLOAT NOT NULL DEFAULT 0,
  search_vector    TSVECTOR,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at     TIMESTAMPTZ
);

CREATE TRIGGER prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to keep search_vector in sync on insert/update
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.body, '')), 'C') ||
    setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompts_search_vector_sync
  BEFORE INSERT OR UPDATE OF title, description, body, tags
  ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Indexes
CREATE INDEX idx_prompts_search_vector    ON prompts USING GIN (search_vector);
CREATE INDEX idx_prompts_tags             ON prompts USING GIN (tags);
CREATE INDEX idx_prompts_model_tags       ON prompts USING GIN (model_tags);
CREATE INDEX idx_prompts_trending_score   ON prompts (trending_score DESC) WHERE status = 'published';
CREATE INDEX idx_prompts_published_at     ON prompts (published_at DESC)   WHERE status = 'published';
CREATE INDEX idx_prompts_upvotes          ON prompts (upvotes DESC)        WHERE status = 'published';
CREATE INDEX idx_prompts_category_id      ON prompts (category_id);
CREATE INDEX idx_prompts_author_id        ON prompts (author_id);
CREATE INDEX idx_prompts_status           ON prompts (status);

-- ============================================================
-- TRENDING SCORE FUNCTION
-- HN-style: (upvotes - 1) / pow(hours_since_published + 2, 1.8)
-- Called on read in v1 (no scheduled job needed).
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_trending_score(
  upvotes_count INT,
  published TIMESTAMPTZ
)
RETURNS FLOAT AS $$
DECLARE
  hours_since FLOAT;
BEGIN
  IF published IS NULL THEN
    RETURN 0;
  END IF;
  hours_since := EXTRACT(EPOCH FROM (NOW() - published)) / 3600.0;
  RETURN (GREATEST(upvotes_count - 1, 0)::FLOAT) / POWER(hours_since + 2.0, 1.8);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- VOTES
-- ============================================================
CREATE TABLE votes (
  user_id   UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id)   ON DELETE CASCADE,
  value     SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, prompt_id)
);

-- ============================================================
-- VOTE COUNT SYNC TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_prompt_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.value = 1 THEN
      UPDATE prompts SET upvotes   = upvotes   + 1 WHERE id = NEW.prompt_id;
    ELSE
      UPDATE prompts SET downvotes = downvotes + 1 WHERE id = NEW.prompt_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.value = 1 THEN
      UPDATE prompts SET upvotes   = GREATEST(upvotes   - 1, 0) WHERE id = OLD.prompt_id;
    ELSE
      UPDATE prompts SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.prompt_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Switching vote direction
    IF OLD.value = 1 AND NEW.value = -1 THEN
      UPDATE prompts
        SET upvotes   = GREATEST(upvotes   - 1, 0),
            downvotes = downvotes + 1
        WHERE id = NEW.prompt_id;
    ELSIF OLD.value = -1 AND NEW.value = 1 THEN
      UPDATE prompts
        SET downvotes = GREATEST(downvotes - 1, 0),
            upvotes   = upvotes + 1
        WHERE id = NEW.prompt_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER votes_sync_counts
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_prompt_vote_counts();

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id  UUID NOT NULL REFERENCES prompts(id)   ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  body       TEXT NOT NULL,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_comments_prompt_id  ON comments (prompt_id);
CREATE INDEX idx_comments_parent_id  ON comments (parent_id);

-- ============================================================
-- TOOLS
-- ============================================================
CREATE TABLE tools (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  url           TEXT NOT NULL,
  category      TEXT,
  logo_url      TEXT,
  is_free       BOOLEAN NOT NULL DEFAULT TRUE,
  pricing_note  TEXT,
  submitted_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'approved'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tools_category ON tools (category);
CREATE INDEX idx_tools_status   ON tools (status);

-- Seed ~15 well-known free AI tools
INSERT INTO tools (name, slug, description, url, category, logo_url, is_free, pricing_note, status) VALUES
  ('ChatGPT',          'chatgpt',          'OpenAI''s conversational AI assistant with a generous free tier.',               'https://chatgpt.com',                  'Chat',         NULL, TRUE,  'Free tier available; GPT-4o on paid plans.', 'approved'),
  ('Claude.ai',        'claude-ai',        'Anthropic''s Claude with a free tier for everyday tasks.',                      'https://claude.ai',                    'Chat',         NULL, TRUE,  'Free tier available; Pro plan unlocks more.', 'approved'),
  ('Gemini',           'gemini',           'Google''s multimodal AI assistant, free with a Google account.',                'https://gemini.google.com',            'Chat',         NULL, TRUE,  'Free with Google account.', 'approved'),
  ('Perplexity AI',    'perplexity',       'AI-powered search engine with cited sources and real-time web access.',         'https://perplexity.ai',                'Search',       NULL, TRUE,  'Free tier available.', 'approved'),
  ('Suno',             'suno',             'AI music generation — create full songs from a text prompt.',                   'https://suno.com',                     'Audio',        NULL, TRUE,  'Free credits daily; paid tiers for more.', 'approved'),
  ('Krea AI',          'krea-ai',          'Real-time AI image generation and enhancement canvas.',                         'https://krea.ai',                      'Image',        NULL, TRUE,  'Free tier; Pro unlocks higher resolution.', 'approved'),
  ('Ideogram',         'ideogram',         'AI image generation with exceptional text rendering in images.',                'https://ideogram.ai',                  'Image',        NULL, TRUE,  'Free credits available.', 'approved'),
  ('Hugging Face Spaces', 'hugging-face-spaces', 'Thousands of free AI demos and models hosted in one place.',             'https://huggingface.co/spaces',        'Platform',     NULL, TRUE,  'Completely free to use.', 'approved'),
  ('Ollama',           'ollama',           'Run powerful open-source LLMs locally on your own machine.',                   'https://ollama.com',                   'Local',        NULL, TRUE,  'Free and open source.', 'approved'),
  ('LM Studio',        'lm-studio',        'User-friendly desktop app to run local LLMs with a Chat UI.',                  'https://lmstudio.ai',                  'Local',        NULL, TRUE,  'Free desktop app.', 'approved'),
  ('Cursor',           'cursor',           'AI-first code editor built on VS Code with GPT-4 and Claude integration.',     'https://cursor.com',                   'Coding',       NULL, TRUE,  'Free tier available; Pro plan for heavy use.', 'approved'),
  ('Bolt.new',         'bolt-new',         'Build full-stack web apps with AI in the browser — no setup needed.',          'https://bolt.new',                     'Coding',       NULL, TRUE,  'Free tier available.', 'approved'),
  ('v0 by Vercel',     'v0-vercel',        'Generate React/shadcn UI components from text descriptions.',                  'https://v0.dev',                       'Coding',       NULL, TRUE,  'Free credits; Pro plan for teams.', 'approved'),
  ('Napkin AI',        'napkin-ai',        'Turn text into visual diagrams, charts, and infographics instantly.',          'https://napkin.ai',                    'Visuals',      NULL, TRUE,  'Free tier available.', 'approved'),
  ('NotebookLM',       'notebooklm',       'Google''s AI research assistant that grounds answers in your own documents.',  'https://notebooklm.google.com',        'Research',     NULL, TRUE,  'Free with Google account.', 'approved');

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  prompt_id   UUID REFERENCES prompts(id)   ON DELETE SET NULL,
  comment_id  UUID REFERENCES comments(id)  ON DELETE SET NULL,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reports_target_check CHECK (
    (prompt_id IS NOT NULL) OR (comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_reports_status     ON reports (status);
CREATE INDEX idx_reports_prompt_id  ON reports (prompt_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  -- Derive base username from email or provider metadata
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'user_name',   -- GitHub
    NEW.raw_user_meta_data->>'preferred_username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  -- Sanitize: lowercase, remove non-alphanumeric except underscore/hyphen
  base_username := LOWER(REGEXP_REPLACE(base_username, '[^a-zA-Z0-9_\-]', '', 'g'));
  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user' || base_username;
  END IF;
  -- Truncate to 30 chars
  base_username := SUBSTRING(base_username FROM 1 FOR 30);

  final_username := base_username;

  -- Handle collisions
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      final_username
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ---- categories (read-only for everyone) ----
CREATE POLICY "categories_read_all" ON categories
  FOR SELECT USING (TRUE);

-- ---- profiles ----
CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ---- prompts ----
CREATE POLICY "prompts_read_published" ON prompts
  FOR SELECT USING (
    status = 'published'
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "prompts_insert_auth" ON prompts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND author_id = auth.uid()
  );

CREATE POLICY "prompts_update_own_or_admin" ON prompts
  FOR UPDATE USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "prompts_delete_own_or_admin" ON prompts
  FOR DELETE USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---- votes ----
CREATE POLICY "votes_read_own" ON votes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "votes_insert_own" ON votes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "votes_update_own" ON votes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "votes_delete_own" ON votes
  FOR DELETE USING (user_id = auth.uid());

-- ---- comments ----
CREATE POLICY "comments_read_published_prompt" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts
      WHERE prompts.id = comments.prompt_id
        AND prompts.status = 'published'
    )
  );

CREATE POLICY "comments_insert_auth" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "comments_update_own_or_admin" ON comments
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "comments_delete_own_or_admin" ON comments
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---- tools ----
CREATE POLICY "tools_read_approved" ON tools
  FOR SELECT USING (
    status = 'approved'
    OR submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "tools_insert_auth" ON tools
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND submitted_by = auth.uid()
  );

CREATE POLICY "tools_update_submitter_or_admin" ON tools
  FOR UPDATE USING (
    submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "tools_delete_submitter_or_admin" ON tools
  FOR DELETE USING (
    submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---- reports ----
CREATE POLICY "reports_insert_auth" ON reports
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND reporter_id = auth.uid()
  );

CREATE POLICY "reports_read_admin" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "reports_update_admin" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
