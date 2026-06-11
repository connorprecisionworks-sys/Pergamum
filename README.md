Pergamum

A community-powered library for AI prompts. Browse, vote on, remix, and share prompts that actually work — every one human-reviewed before it goes live, free forever, no account required to read. The Library of Pergamum, on Postgres.

It started as "Product Hunt for prompts" and is growing into a curated library with reputation, remixes, and a chat-first builder for new prompts.

Principles


Open and free forever. No paywalls. No account required to browse, copy, or share — contributing is the only thing that needs sign-up.
Curation over volume. Every non-admin prompt enters review before publishing; consistent quality at the front door beats an infinite firehose.
URL-driven state. Every filter, sort, tag, and category lives in the query string, so every view is a bookmarkable, shareable link.
Postgres does the work. Voting, reputation, trending score, rate limiting, copy tracking, and badges all run as SQL functions and triggers on Supabase with RLS. The app stays a thin client over the database.


Features


Prompts. Submit prompts with auto-generated slugs, model tags (Claude / GPT / Gemini / Llama / image models), categories, and free-form tags. Every prompt has a public detail page with vote buttons, comments, copy-to-clipboard, and a one-click "Remix" to fork it under your name.
Variables. Auto-detected {{name}} tokens in the body become live inputs on the prompt page; the rendered body updates as you type. Optional metadata — descriptions, defaults — layers on top, fill it in if you want, skip it if you don't.
Browse and filter. Category, model, free-text search (Postgres FTS over title and body), three sorts: Trending (HN-style time decay), Newest, Top all-time. All filter state lives in the URL.
Reputation and engagement. Upvote/downvote with optimistic UI and one-vote-per-user-per-prompt. Publishing awards +10, remixes give +2 to the remixer and +3 to the original author, with a daily comment cap and a floor at zero. Badges and leaderboards sit on top of the rep ledger; follows surface a personalised feed.
Collections. Per-user prompt collections with their own slugs (unique per owner, not globally), public or private. Add any prompt to any collection from the detail page.
AI-assisted builder. /build walks you through a chat-first builder that drafts a prompt from a goal in five labelled blocks, then hands the assembled body off to the submit form, pre-filled. Drafts auto-save server-side so you can come back to them.
Moderation. Every non-admin prompt enters a pending queue. The admin panel shows the queue plus user reports; one click approves to published, which fires reputation, trending, and badge triggers in sequence.


Data sources (all in Supabase or the file tree)


Postgres tables: prompts, votes, comments, profiles, collections, collection_prompts, follows, badges, user_badges, reports, tools, categories, analytics_events, rate_limit_vote_log. Migrations under supabase/migrations/0001…0010_*.sql, applied with supabase db push.
Auth: Supabase Auth — email/password, Google OAuth, GitHub OAuth. Sign-up auto-creates a profile row via a database trigger.
Clients: server components fetch via lib/supabase/server.ts; a cookie-free createPublicClient() is used by sitemap.ts, robots.ts, and OG image routes so they stay statically renderable.
Analytics: first-party only — analytics_events table with RLS allowing anon + authenticated inserts and no public SELECT. No third-party trackers.
Rate limiting: vote and copy routes query rate_limit_vote_log for entries in the last 60 seconds; 10 actions per user per minute, HTTP 429 beyond.


Tech stack
Next.js 14 (App Router, React Server Components by default), TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres + Auth + RLS), react-hook-form + zod, pnpm. Light and dark theme. Vercel target.

Develop

pnpm install
pnpm dev

Pre-push gate (required, must pass before pushing):

pnpm check    # = pnpm type-check && pnpm lint && pnpm build

CI runs the same three steps on every push and PR via .github/workflows/ci.yml.

Pre-commit hook (recommended, runs pnpm type-check):

cp scripts/pre-commit.sh .git/hooks/pre-commit

Skip on a specific commit with git commit --no-verify.

Smoke test against a deployed URL:

bash scripts/smoke.sh https://your-domain.com

Setup


Node 18+, pnpm 9, Supabase CLI.
Copy .env.local.example → .env.local and fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_APP_URL.
supabase link --project-ref <ref> then supabase db push to run all 10 migrations.
Configure Google and GitHub OAuth callbacks per SETUP.md.
Set the first admin: flip is_admin = true on your profile row in the SQL editor.


Structure

pergamum/
  app/
    (marketing)/          marketing pages — home, about, the-science, tools dir
    (app)/                authed + browse pages
      prompts/[slug]/     public prompt page + OG/Twitter images
      submit/             submission form (auto-detect, variable metadata)
      build/              chat-first AI prompt builder + drafts
      dashboard/          user dashboard, collections manager, profile editor
      collections/        public collection pages
      u/[username]/       public profile
      feed/               personalised feed (follows)
      leaderboards/       reputation + activity leaderboards
      badges/             badge catalogue + earned-by-you
      admin/              moderation queue, bulk JSON import
    api/                  vote, copy, build/*, events
    auth/                 login, signup, OAuth callback
    onboarding/           first-run flow (username, bio)
  components/
    prompts/              cards, detail view, variable form, vote buttons
    collections/          collection card, add-to-collection button
    profile/              badge showcase, follow button
    brand/, layout/       marketing pieces, header + footer
    ui/                   shadcn primitives
  lib/
    supabase/             browser / server / service / public clients
    types/database.ts     hand-written Supabase types
    utils.ts              slugify, substituteVariables, trendingScore, etc.
    analytics.ts          fire-and-forget track() client
  supabase/migrations/    0001 init → 0010 prompt-drafts examples
  scripts/                pre-commit, smoke test
