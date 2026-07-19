Prmpt

A living library of prompts — and a distribution platform for the creators who write them. Browse, remix, and use prompts and Claude Code skills that actually work, free forever, no account required to read. Creators get their own page, packs to bundle and gate their work, and a lead/CRM layer that turns audience engagement into a pipeline.

Formerly built and shipped under the name "Pergamum" (community-voted "Product Hunt for prompts"); the codebase and repo still carry that name in places, but the live product is Prmpt (useprmpt.com). See PROMPTKIT-PIVOT.md for the reframe rationale and STATUS.md for current build state.

Principles


Open and free forever to browse. No paywalls, no account required to browse, copy, or use — signing up is only required to contribute, save, or build an audience as a creator.
Two account types, one app. On first login, /welcome routes people to a client account (use prompts/skills, save to a library) or a creator account (publish, bundle into packs, build an audience). Community-ranking mechanics (voting, trending, leaderboards, badges) still exist in the schema but are demoted from primary nav — a creator sending someone to their own page shouldn't compete with a global leaderboard.
URL-driven state. Every filter, sort, tag, and category lives in the query string, so every view is a bookmarkable, shareable link.
Postgres does the work. Reputation, trending score, rate limiting, copy tracking, lead scoring, and badges all run as SQL functions and triggers on Supabase with RLS. The app stays a thin client over the database.


Features


Prompts and skills. Two content types: prompts (auto-generated slugs, model tags, categories, free-form tags, {{variable}} auto-detection with live fill-in inputs) and skills (Claude Code / Claude API skill packages — categories like agents, coding, writing, data, research; runtimes claude-code, cowork, claude-api). Every item has a public detail page with copy-to-clipboard and a one-click "Remix" to fork it.
Packs. A creator-owned bundle of prompts and/or skills, published under the creator's own URL (/packs/[username]/[slug]), with a liner note and optional entitlement gating on individual items.
Creator leads and money dashboard. When someone uses a creator's prompt, skill, or pack, that activity generates a scored "lead" (heat score, staged e.g. hot, driven by events like offer clicks) surfaced in a pipeline dashboard — KPIs, a conversion funnel, engagement charts, and a lead detail view. Creators can send an offer or message to a lead, mark leads as booked, and get hot-lead email alerts/digests.
Creator onboarding and offer slots. /creator/onboarding sets up a creator's page, offer slot (headline, description, CTA, image/link), and alert thresholds, gated behind creator_onboarding_complete.
Library. A personal, logged-in view of your own history — prompt runs, saved presets, saved packs, saved prompts, and follows — distinct from /prompts, the public browse/discovery catalog.
Browse and filter. Category, model, free-text search (Postgres FTS over title and body), three sorts: Trending (HN-style time decay), Newest, Top all-time. All filter state lives in the URL.
Reputation and engagement (schema intact, off primary nav). Upvote/downvote with optimistic UI and one-vote-per-user-per-item. Publishing awards +10, remixes give +2 to the remixer and +3 to the original author, with a daily comment cap and a floor at zero. Badges and leaderboards sit on top of the rep ledger; follows surface a personalised feed.
Collections. Per-user prompt collections with their own slugs (unique per owner, not globally), public or private. Add any prompt to any collection from the detail page.
AI-assisted builder. /build walks you through a chat-first builder that drafts a prompt from a goal in five labelled blocks, then hands the assembled body off to the submit form, pre-filled. Drafts auto-save server-side so you can come back to them.
Notifications. In-app notifications for hot_lead events, creator_message, and pack_updated / pack-released.
Moderation. Every non-admin prompt enters a pending queue. The admin panel shows the queue plus user reports; one click approves to published, which fires reputation, trending, and badge triggers in sequence.


Data sources (all in Supabase or the file tree)


Postgres tables: prompts, skills, packs, votes/skill_votes, comments, profiles, collections, collection_prompts, follows, badges, user_badges, reports, tools, categories, analytics_events, rate_limit_vote_log, plus the creator/lead layer (leads, lead events, offers, notifications) and prompt drafts/presets/runs. Migrations under supabase/migrations/0001…0030_*.sql, applied with supabase db push.
Auth: Supabase Auth — email/password, Google OAuth, GitHub OAuth. Sign-up auto-creates a profile row via a database trigger; account_type (client / creator) is set on /welcome.
Clients: server components fetch via lib/supabase/server.ts; a cookie-free createPublicClient() is used by sitemap.ts, robots.ts, and OG image routes so they stay statically renderable.
Analytics: first-party only — analytics_events table with RLS allowing anon + authenticated inserts and no public SELECT. No third-party trackers.
Rate limiting: vote and copy routes query rate_limit_vote_log for entries in the last 60 seconds; 10 actions per user per minute, HTTP 429 beyond.
Email: transactional + digest email (hot-lead alerts, offer notifications) sent via Resend on the useprmpt.com domain.


Tech stack
Next.js 14 (App Router, React Server Components by default), TypeScript, Tailwind CSS, shadcn/ui + Radix primitives, Supabase (Postgres + Auth + RLS), react-hook-form + zod, recharts (dashboard charts), @dnd-kit (drag-and-drop), framer-motion, Resend (email), pnpm. Light and dark theme. Vercel target.

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
supabase link --project-ref <ref> then supabase db push to run all 30 migrations.
Configure Google and GitHub OAuth callbacks per SETUP.md.
Set the first admin: flip is_admin = true on your profile row in the SQL editor.


Structure

app/
  (marketing)/            marketing pages — home, about, the-science, tools dir
  (app)/                  authed + browse pages
    prompts/[slug]/       public prompt page + OG/Twitter images
    skills/                skill catalogue + submit
    submit/                 prompt submission form (auto-detect, variable metadata)
    build/                  chat-first AI prompt builder + drafts
    dashboard/              user dashboard, leads/money pipeline, collections manager, profile editor
    collections/            public collection pages
    library/                personal history — runs, saved presets/packs/prompts, follows
    u/[username]/           public profile
    feed/                   personalised feed (follows)
    leaderboards/           reputation + activity leaderboards (schema intact, off primary nav)
    badges/                 badge catalogue + earned-by-you (schema intact, off primary nav)
    notifications/          hot_lead, creator_message, pack_updated
    admin/                  moderation queue, bulk JSON import
  packs/[username]/[slug]/ public pack pages (bundle of prompts/skills, gated items)
  creator/                creator onboarding (page setup, offer slot, alert thresholds)
  welcome/                account-type routing (client vs. creator) after auth
  onboarding/             client first-run flow (username, bio, role/industry/goals)
  api/                    vote, copy, build/*, events, leads/*, packs/*, skills/*
  auth/                   login, signup, OAuth callback
components/
  prompts/                cards, detail view, variable form, vote buttons
  collections/            collection card, add-to-collection button
  profile/                badge showcase, follow button
  brand/, layout/         marketing pieces, header + footer, app sidebar
  ui/                     shadcn primitives
lib/
  supabase/               browser / server / service / public clients
  types/database.ts       hand-written Supabase types
  utils.ts                slugify, substituteVariables, trendingScore, etc.
  analytics.ts            fire-and-forget track() client
  lead-events.ts, email/  lead scoring events, hot-lead + digest email
supabase/migrations/      0001 init → 0030 identity_tier
scripts/                  pre-commit, smoke test
