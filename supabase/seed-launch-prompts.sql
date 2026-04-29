-- ════════════════════════════════════════════════════════════════════
--  Pergamum — launch seed prompts (20 high-quality starters)
-- ════════════════════════════════════════════════════════════════════
--
--  HOW TO USE:
--    1. Find your admin user's UUID:
--         SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL';
--    2. Replace 'PASTE_YOUR_USER_UUID_HERE' on the line marked below
--       with the UUID from step 1.
--    3. Paste this whole file into Supabase → SQL Editor → New query.
--    4. Click Run.
--
--  Each prompt is published immediately (status='published') so they
--  appear on the homepage and in /prompts as soon as you run this.
-- ════════════════════════════════════════════════════════════════════

WITH author AS (
  -- ▼▼▼  REPLACE THIS UUID  ▼▼▼
  SELECT 'PASTE_YOUR_USER_UUID_HERE'::uuid AS id
  -- ▲▲▲  REPLACE THIS UUID  ▲▲▲
),
cats AS (
  SELECT id, slug FROM categories
),
fallback_cat AS (
  SELECT id FROM categories ORDER BY sort_order LIMIT 1
)
INSERT INTO prompts (
  author_id, title, slug, body, description,
  category_id, model_tags, tags, variables,
  status, published_at, created_at
)
SELECT
  (SELECT id FROM author),
  p.title,
  p.slug,
  p.body,
  p.description,
  COALESCE((SELECT id FROM cats WHERE slug = p.cat_slug LIMIT 1), (SELECT id FROM fallback_cat)),
  p.models,
  p.tag_list,
  p.vars::jsonb,
  'published',
  NOW(),
  NOW()
FROM (VALUES

-- ─────────────────────────────────────────────────────────────────────
-- 1. Code reviewer (TypeScript)
-- ─────────────────────────────────────────────────────────────────────
(
  'Code reviewer (TypeScript)',
  'code-reviewer-typescript',
  $body$You are a senior TypeScript engineer doing a code review. The code is below.

Review it for:

1. Correctness — bugs, edge cases, race conditions, off-by-one errors
2. Type safety — uses of `any`, missing types, unsafe casts, narrowing gaps
3. Performance — O(n²) where O(n) is possible, unnecessary re-renders, blocking I/O
4. Readability — naming, structure, where a comment would actually help

Output as a markdown list. Be specific: cite line numbers, suggest the actual fix in code, not just "this is bad." Skip nitpicks unless they affect correctness or readability significantly.

If the code is genuinely fine, say so — don't manufacture issues.

Code:
{{code}}$body$,
  'A senior-engineer-style code review. Cites line numbers, suggests concrete fixes, skips nitpicks unless they matter.',
  'coding',
  ARRAY['claude','gpt-4'],
  ARRAY['typescript','code-review','engineering'],
  '[{"name":"code","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 2. PR description from a diff
-- ─────────────────────────────────────────────────────────────────────
(
  'PR description from a diff',
  'pr-description-from-a-diff',
  $body$You are writing the description for a pull request. The diff is below.

Output a markdown PR description with these sections:

## What
One sentence, plain language, what this PR does.

## Why
The problem this solves. If linked to an issue, reference it.

## How
Bullet list of the key changes. Skip mechanical changes (formatting, imports). Focus on logic and intent.

## Testing
What you did to verify this works. Be honest — "I ran it locally and tried X, Y, Z" is fine if that's all.

## Risk
What could break, who might be affected. "Low risk" only if it actually is.

Tone: matter-of-fact. No emojis. No "I'm thrilled to introduce." No padding.

Diff:
{{diff}}$body$,
  'Turns a git diff into a structured PR description. Plain, honest, no fluff.',
  'coding',
  ARRAY['claude','gpt-4'],
  ARRAY['pull-request','git','engineering'],
  '[{"name":"diff","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 3. SQL query optimizer
-- ─────────────────────────────────────────────────────────────────────
(
  'SQL query optimizer',
  'sql-query-optimizer',
  $body$You are a senior database engineer. Below is a SQL query and the schema of the relevant tables.

Do three things:

1. Explain in plain English what this query does. One paragraph.

2. Identify performance issues — missing indexes, full table scans, redundant subqueries, suboptimal joins, N+1 patterns. Be specific.

3. Rewrite the query for {{database}} (or note if the optimization is database-agnostic). Show before/after with a one-line comment on what changed.

If the query is already good, say so — don't manufacture optimizations.

Schema:
{{schema}}

Query:
{{query}}$body$,
  'Explains a SQL query in plain English, identifies real performance issues, and rewrites it for your database.',
  'coding',
  ARRAY['claude','gpt-4'],
  ARRAY['sql','performance','database'],
  '[{"name":"database","type":"text"},{"name":"schema","type":"text"},{"name":"query","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 4. API endpoint scaffolder
-- ─────────────────────────────────────────────────────────────────────
(
  'API endpoint scaffolder',
  'api-endpoint-scaffolder',
  $body$You are a senior backend engineer. I need a {{method}} endpoint at {{path}} for a {{framework}} app.

Generate the complete endpoint with:

1. Input validation — use the framework's idiomatic approach (Zod for Express/Next, Pydantic for FastAPI, etc.)
2. Authentication and authorization checks where they make sense
3. Proper error handling with meaningful status codes (400 client error, 401 auth, 403 forbidden, 404 not-found, 500 only for genuinely unexpected)
4. TypeScript types or Python type hints
5. A short top comment explaining what this endpoint does

Behavior I need:
{{behavior}}

Output the full file content, ready to paste in. Add a one-line comment above any non-obvious choice.$body$,
  'Generates a production-ready API endpoint with validation, auth, error handling, and types — ready to paste in.',
  'coding',
  ARRAY['claude','gpt-4'],
  ARRAY['api','backend','scaffolding'],
  '[{"name":"method","type":"text"},{"name":"path","type":"text"},{"name":"framework","type":"text"},{"name":"behavior","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 5. Bug report triage
-- ─────────────────────────────────────────────────────────────────────
(
  'Bug report triage',
  'bug-report-triage',
  $body$You are a senior engineer triaging a bug report. The report is below — it might be from a user, a Slack message, a support ticket, or stream-of-consciousness from a teammate.

Output:

**Repro steps** — numbered, minimal. If the steps aren't given, list the questions that would get them.

**Expected behavior** — what should happen.

**Actual behavior** — what's happening instead.

**Severity** — P0 (production down), P1 (major feature broken for many), P2 (annoying but workaround exists), P3 (cosmetic). Justify the level in one sentence.

**Likely cause** — your honest guess at where to start looking. Speculation is fine — mark it as such.

If the report is too vague to triage, list the specific questions to ask. Don't invent details.

Report:
{{report}}$body$,
  'Turns a vague bug report into a triaged ticket with repro steps, severity, and a starting guess at the cause.',
  'productivity',
  ARRAY['claude','gpt-4'],
  ARRAY['bugs','triage','support'],
  '[{"name":"report","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 6. Customer interview synthesizer
-- ─────────────────────────────────────────────────────────────────────
(
  'Customer interview synthesizer',
  'customer-interview-synthesizer',
  $body$You are a senior product researcher. Below are notes from a customer interview.

Output:

**Top three pain points**, in priority order. For each: one-sentence statement of the pain, plus the direct quote (or paraphrase) from the notes that supports it.

**Surprising things** — anything the customer said that contradicts your assumptions about this segment, or that you wouldn't have expected. Skip if nothing notable came up.

**One concrete {{deliverable}}** — based on the strongest pain point. Be specific.

**Open questions** — things you'd want to ask in a follow-up. Don't pad — only list questions you genuinely couldn't answer from these notes.

Tone: {{tone}}.

Notes:
{{notes}}$body$,
  'Turns raw interview notes into prioritized pain points, surprises, and one concrete next action.',
  'research',
  ARRAY['claude'],
  ARRAY['user-research','interviews','product'],
  '[{"name":"deliverable","type":"text"},{"name":"tone","type":"text"},{"name":"notes","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 7. Meeting notes to action items
-- ─────────────────────────────────────────────────────────────────────
(
  'Meeting notes to action items',
  'meeting-notes-to-action-items',
  $body$You are a chief of staff turning raw meeting notes into a clean follow-up.

Output:

**Decisions made** — bullet list, each one a single sentence. Skip topics that were discussed but not decided.

**Action items** — table format: who, what, by when. If owner or deadline isn't clear, mark it [TBD] — don't invent.

**Open questions** — things that came up but weren't resolved. These are work for the next meeting.

**For the record** — important context shared in the meeting that future-you would want to remember. Skip if nothing notable.

Tone: matter-of-fact. No play-by-play of who said what unless it's load-bearing.

Notes:
{{notes}}$body$,
  'Strips a messy meeting note into clean decisions, owned action items, and open questions.',
  'productivity',
  ARRAY['claude','gpt-4'],
  ARRAY['meetings','productivity','action-items'],
  '[{"name":"notes","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 8. Marketing email opener (5 variations)
-- ─────────────────────────────────────────────────────────────────────
(
  'Marketing email opener — 5 variations',
  'marketing-email-opener-5-variations',
  $body$You are a marketing copywriter. Write five variations of an opening line for an email about {{product_or_topic}}.

Constraints:
- Each opener is a single sentence, max 18 words.
- Each one uses a different angle: a stat, a question, a contrarian take, a story setup, a direct value prop.
- No "I hope this email finds you well." No "In today's fast-paced world." No greetings — assume the subject line and salutation are separate.
- Audience: {{audience}}.

Output as a numbered list with the angle in brackets after each line.$body$,
  'Five different opening lines for a marketing email — five different angles, no clichés, each under 18 words.',
  'marketing',
  ARRAY['claude','gpt-4'],
  ARRAY['email','marketing','copywriting'],
  '[{"name":"product_or_topic","type":"text"},{"name":"audience","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 9. Cold email first line
-- ─────────────────────────────────────────────────────────────────────
(
  'Cold email first line — personalized',
  'cold-email-first-line-personalized',
  $body$You are a B2B salesperson writing a personalized first line for a cold email. The recipient's LinkedIn or website excerpt is below.

Write three first-line options that:

1. Show you actually read the source — reference something specific (a project, a post, a milestone)
2. Are not flattery — pick something concrete, not "loved your post!"
3. Lead naturally into a value prop for {{my_product}}, without being pushy

Each option is a single sentence, max 25 words. Output as a numbered list with a one-sentence note on why each one would work.

If the source is too thin to personalize from, say so — don't manufacture details.

Source:
{{source}}$body$,
  'Three personalized cold-email openers based on a real LinkedIn or website excerpt. No flattery, no fabrications.',
  'sales',
  ARRAY['claude','gpt-4'],
  ARRAY['cold-email','sales','outreach'],
  '[{"name":"my_product","type":"text"},{"name":"source","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 10. Product spec from a one-liner
-- ─────────────────────────────────────────────────────────────────────
(
  'Product spec from a one-liner',
  'product-spec-from-a-one-liner',
  $body$You are a senior PM. Turn the following one-liner into a structured product spec.

Output:

**What we're building** — restate the one-liner in two sentences, more concrete.

**Who it's for** — primary user. Be specific: not "users", but "Series A founders managing a 15-person team."

**The problem** — what's broken today, why existing solutions don't solve it.

**Success metric** — one concrete number we'd watch to know this worked.

**MVP scope** — bullet list of the smallest version that could ship. Lean toward fewer.

**Out of scope (for v1)** — things that are tempting but skip-for-now. Important to name them so they don't creep in.

**Open questions** — what we don't know yet that we'd need to answer before building.

If the one-liner is too vague to spec, list the questions you'd ask. Don't invent details.

One-liner:
{{idea}}$body$,
  'Turns a one-line product idea into a real spec — user, problem, MVP scope, and what to skip for v1.',
  'product',
  ARRAY['claude','gpt-4'],
  ARRAY['product','spec','pm'],
  '[{"name":"idea","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 11. Release notes from commits
-- ─────────────────────────────────────────────────────────────────────
(
  'Release notes from commits',
  'release-notes-from-commits',
  $body$You are a developer relations engineer writing release notes. The git log is below.

Output release notes for {{audience}} at version {{version}}.

Sections (skip any that don't apply):

**Highlights** — 1-3 things users will notice. Lead with the biggest. Skip mechanical things.

**New** — added features. Each one a single sentence.

**Improved** — performance, UX, copy improvements. One sentence each.

**Fixed** — bug fixes. Group similar ones. Don't list every commit.

**Breaking changes** — anything users have to adapt to. Be specific.

Tone: {{tone}}. No emojis. No "we're excited to announce." Just say what changed.

Git log:
{{git_log}}$body$,
  'Turns a git log into clean release notes — highlights, new, improved, fixed, breaking. No "we are thrilled."',
  'coding',
  ARRAY['claude','gpt-4'],
  ARRAY['release-notes','devrel','changelog'],
  '[{"name":"audience","type":"text"},{"name":"version","type":"text"},{"name":"tone","type":"text"},{"name":"git_log","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 12. Tweet thread from a blog post
-- ─────────────────────────────────────────────────────────────────────
(
  'Tweet thread from a blog post',
  'tweet-thread-from-a-blog-post',
  $body$You are a writer turning a blog post into an X (Twitter) thread.

Output a {{length}}-tweet thread that:

1. The first tweet earns the click — a hook that's specific, not "I learned X today, here's what I learned."
2. Each subsequent tweet stands alone but invites the next.
3. Include the strongest 1-2 quotes from the post verbatim, with attribution to the post.
4. The last tweet links back to the full post.

Each tweet stays under 280 chars (ideally 200-250). No emojis unless the post uses them. No "🧵" — assume people know it's a thread.

Post:
{{post}}$body$,
  'Turns a long-form blog post into a tight X thread that earns the click and invites the read.',
  'marketing',
  ARRAY['claude','gpt-4'],
  ARRAY['twitter','content','marketing'],
  '[{"name":"length","type":"text"},{"name":"post","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 13. Brand voice rewriter
-- ─────────────────────────────────────────────────────────────────────
(
  'Brand voice rewriter',
  'brand-voice-rewriter',
  $body$You are a copy editor. Rewrite the following text in our brand voice.

Our voice is: {{voice_description}}

Rules:
- Preserve the meaning exactly. Don't add or remove information.
- Don't use phrases that are clichéd in our industry. Avoid "leverage", "synergy", "best-in-class", "enterprise-grade", "next-generation."
- Match the original's length within 15%. Don't pad.
- Active voice over passive.

Output the rewritten version only. After it, add a single line: "Changes:" followed by 2-3 bullets describing what shifted (tone, structure, word choice).

Original:
{{text}}$body$,
  'Rewrites text in your brand voice without padding, without clichés, and without changing the meaning.',
  'writing',
  ARRAY['claude','gpt-4'],
  ARRAY['copy-editing','brand','writing'],
  '[{"name":"voice_description","type":"text"},{"name":"text","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 14. OKR drafter
-- ─────────────────────────────────────────────────────────────────────
(
  'OKR drafter',
  'okr-drafter',
  $body$You are a senior leader turning a goal into measurable OKRs.

Goal: {{goal}}
Time period: {{period}}
Team: {{team}}

Draft:

**Objective** — one sentence, qualitative, ambitious. Should describe a destination, not a metric.

**Key Results** — 3 to 4. Each one is a number you can measure. Each one has a baseline and a target. Each one would tell you, on its own, whether you got closer to the objective.

For each KR also list:
- Data source — where you'd track it from
- Leading indicator — one signal you could watch weekly
- Most likely failure mode — the metric goes up but the objective doesn't

If the goal is too vague to OKR, list the questions you'd ask first. Don't invent.$body$,
  'Turns a goal into proper OKRs — one ambitious objective, 3-4 measurable key results, with leading indicators.',
  'productivity',
  ARRAY['claude','gpt-4'],
  ARRAY['okrs','leadership','planning'],
  '[{"name":"goal","type":"text"},{"name":"period","type":"text"},{"name":"team","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 15. ADR (Architecture Decision Record)
-- ─────────────────────────────────────────────────────────────────────
(
  'Architecture Decision Record (ADR)',
  'architecture-decision-record-adr',
  $body$You are a senior engineer writing an Architecture Decision Record (ADR) for the following decision.

Format (markdown):

# ADR-{{number}}: {{title}}

**Status**: Proposed | Accepted | Superseded by ADR-NNN

**Context**: What's the situation forcing a decision? What constraints exist? Be specific. 2-4 paragraphs.

**Decision**: What did we choose? State it directly. One paragraph.

**Alternatives considered**: At least 2-3. For each: what it was, why we didn't pick it. One sentence each.

**Consequences**: What becomes easier? What becomes harder? Be honest about the downsides.

**Open questions**: Things we still don't know. Mark them clearly.

Decision input:
{{description}}$body$,
  'Writes a full Architecture Decision Record — context, decision, alternatives, consequences, open questions.',
  'coding',
  ARRAY['claude','gpt-4'],
  ARRAY['architecture','adr','engineering'],
  '[{"name":"number","type":"text"},{"name":"title","type":"text"},{"name":"description","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 16. Performance review writer
-- ─────────────────────────────────────────────────────────────────────
(
  'Performance review — peer or report',
  'performance-review-peer-or-report',
  $body$You are writing a performance review for a peer or report. Below are the raw observations.

Output a structured review:

**Strengths (specific):** 2-3 things this person did well, with at least one concrete example each. "Strong communicator" doesn't count — show me the moment.

**Growth areas (specific):** 1-2 things to work on. Concrete, behavioral, fixable. Avoid personality criticism. Avoid "needs to be more proactive" — show me the situation.

**Outsized contributions:** Anything they did clearly above their level or scope. Skip if nothing applies.

**Calibration note:** Where does this person sit relative to their level? Meeting / exceeding / needs improvement. One sentence.

Tone: honest, specific, supportive. Avoid corporate hedging. If something was bad, say it was bad and how to fix it.

Observations:
{{observations}}$body$,
  'Turns raw observations into a structured perf review — specific strengths, fixable growth areas, real calibration.',
  'productivity',
  ARRAY['claude','gpt-4'],
  ARRAY['performance-review','leadership','feedback'],
  '[{"name":"observations","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 17. Job description writer
-- ─────────────────────────────────────────────────────────────────────
(
  'Job description writer',
  'job-description-writer',
  $body$You are an experienced hiring manager. Write a job description for a {{seniority}} {{role}} on a {{team_type}} team.

Output:

**Title** — exact, no fluff. No "Ninja", "Rockstar", "Wizard."

**About the role (3-4 sentences)** — what this person will actually do day-to-day. Lead with the work, not the company.

**You'll** — 5-7 specific things they'll be doing. Each starts with a verb. Skip "wear many hats."

**You probably** — required-ish skills. Use "probably" and "likely" rather than hard requirements unless they really are. Cap at 6.

**Bonus** — nice-to-haves. Cap at 4. Skip if not needed.

**Compensation** — placeholder bracket: $[low] – $[high] + equity if applicable. Tell the reader what's negotiable.

**How to apply** — specific instructions.

Skip "we are an equal opportunity employer" boilerplate. Skip the company values section unless it's genuinely differentiating.

Context:
{{context}}$body$,
  'Writes a real job description — concrete responsibilities, soft requirements, transparent comp. No "Ninja" titles.',
  'productivity',
  ARRAY['claude','gpt-4'],
  ARRAY['hiring','recruiting','job-description'],
  '[{"name":"seniority","type":"text"},{"name":"role","type":"text"},{"name":"team_type","type":"text"},{"name":"context","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 18. Documentation writer (function/API)
-- ─────────────────────────────────────────────────────────────────────
(
  'Documentation writer — function or API',
  'documentation-writer-function-or-api',
  $body$You are a developer writing documentation for the following function or API endpoint. The implementation is below.

Output documentation as a markdown block:

**Summary** — one sentence, what it does. Lead with the verb.

**When to use it** — typical scenarios. 2-3 short bullets. Skip if obvious.

**Parameters** — table: name, type, required, description, example value. Don't pad — every column must have content.

**Returns** — type and what it represents. If error states are possible, list them with what causes each.

**Example** — minimal working example. A second one if there's a simple case and an advanced case.

**Gotchas** — anything non-obvious. Skip if nothing applies. Don't manufacture warnings.

Implementation:
{{implementation}}$body$,
  'Writes proper docs for a function or API endpoint — summary, params, returns, examples, real gotchas.',
  'coding',
  ARRAY['claude','gpt-4'],
  ARRAY['documentation','api-docs','technical-writing'],
  '[{"name":"implementation","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 19. Content brief from a topic
-- ─────────────────────────────────────────────────────────────────────
(
  'Content brief from a topic',
  'content-brief-from-a-topic',
  $body$You are a content strategist. Turn the topic below into a brief that a writer could actually use.

Topic: {{topic}}
Target audience: {{audience}}
Word count target: {{word_count}}
Format: {{format}}

Output:

**Working title** — 3 options.

**Hook (the why-now)** — why this topic matters this quarter, this year, or in the current moment.

**Reader takeaway** — one sentence answering "what does the reader walk away knowing or doing?"

**Outline** — H2-level sections with 1-2 sentence summaries. Should support the takeaway, not list "Background / Body / Conclusion."

**Sources to consult** — papers, books, people, datasets. Include if you know specific ones; otherwise list types of sources to find. Don't fabricate citations.

**Distinctive angle** — what makes this piece different from the other 100 articles on this topic. If you can't think of one, say so — that's a sign the piece needs a sharper angle before writing.$body$,
  'Turns a topic into a real content brief — title options, hook, outline, sources, and the distinctive angle.',
  'writing',
  ARRAY['claude','gpt-4'],
  ARRAY['content','briefs','strategy'],
  '[{"name":"topic","type":"text"},{"name":"audience","type":"text"},{"name":"word_count","type":"text"},{"name":"format","type":"text"}]'
),

-- ─────────────────────────────────────────────────────────────────────
-- 20. Refactor planner
-- ─────────────────────────────────────────────────────────────────────
(
  'Refactor planner',
  'refactor-planner',
  $body$You are a senior engineer planning a refactor. The code is below, along with the constraint we're refactoring against.

Constraint: {{constraint}}
(Examples: "needs to support pagination", "needs to be testable in isolation", "needs to handle 10x the volume")

Output:

**Diagnosis** — what's making this hard right now. Be specific: cite line numbers or function names.

**Refactor plan** — numbered steps. Each step:
- Is small enough to ship as one PR
- Leaves the system working at every step (no big-bang rewrites)
- States what changes and why

**Order of operations** — which step unlocks which. Identify dependencies.

**Risks** — what could break, what tests would catch it.

**What I'd skip** — tempting changes that don't serve the constraint. Naming them upfront prevents scope creep.

Code:
{{code}}$body$,
  'Plans a refactor against a specific constraint — small reviewable steps, real dependencies, what to skip.',
  'coding',
  ARRAY['claude','gpt-4'],
  ARRAY['refactoring','engineering','code-quality'],
  '[{"name":"constraint","type":"text"},{"name":"code","type":"text"}]'
)

) AS p(title, slug, body, description, cat_slug, models, tag_list, vars);

-- ════════════════════════════════════════════════════════════════════
--  After running, refresh https://pergamum.net/prompts to see them.
--  Your contribution_count, reputation, and stats will reflect the new
--  prompts on the next page load.
-- ════════════════════════════════════════════════════════════════════
