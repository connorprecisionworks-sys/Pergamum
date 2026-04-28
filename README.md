# Pergamum — Community Prompt Library

A free, community-driven web app where anyone can browse, contribute, and vote on AI prompts. Think Product Hunt meets a prompt marketplace, but open and free forever.

**Live target:** Vercel  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase · pnpm

---

## Features

- **Auth** — Email/password, Google OAuth, GitHub OAuth. Signing up auto-creates a profile.
- **Prompt CRUD** — Submit, edit, publish, delete. Auto-generated slugs with collision handling.
- **Variable templating** — `{{variable_name}}` placeholders become live inputs on the detail page; preview updates as you type.
- **Copy to clipboard** — One-click copy with visual feedback; increments the view count.
- **Voting** — Upvote/downvote with optimistic UI. One vote per user per prompt. Toggle to remove; switch direction to flip.
- **Browse & filter** — Filter by category, model tag, free-text search (Postgres FTS). Sort by trending / newest / top all-time. All filters are URL-driven (shareable links).
- **Model badges** — Visual chips for Claude, GPT-4, Gemini, Llama, Mistral, etc. on every card.
- **Tools directory** — ~15 seeded free AI tools. Filterable by category. Auth users can submit; admins approve.
- **Moderation** — Every prompt is reviewed before publishing. Flag button on every prompt. Admin panel shows queue + reports.
- **Public profiles** — `/u/[username]` with bio, stats, and published prompts.
- **Responsive** — Mobile-first, tested at sm/md/lg breakpoints.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14, App Router, React Server Components |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Auth | Supabase Auth — email/password + Google + GitHub |
| Forms | react-hook-form + zod |
| Package manager | pnpm |
| Hosting target | Vercel |
| Icons | lucide-react |
| Toasts | sonner |

---

## Setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm` or via the [official installer](https://pnpm.io/installation))
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for running migrations)

### 1. Clone & install

```bash
git clone <your-repo-url> pergamum
cd pergamum
pnpm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the migration

Using Supabase CLI (recommended):

```bash
supabase link --project-ref your-project-ref
supabase db push
```

Or paste `supabase/migrations/0001_init.sql` directly into the Supabase SQL editor.

### 4. Configure OAuth providers

See [SETUP.md](./SETUP.md) for step-by-step OAuth provider setup.

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── (marketing)/          # Public landing page + tools directory
├── (app)/                # Authenticated & browse pages
│   ├── prompts/          # Browse page + detail page
│   ├── submit/           # Prompt submission form
│   ├── dashboard/        # User dashboard
│   ├── u/[username]/     # Public profile
│   └── admin/            # Moderation queue (admin only)
├── auth/                 # Login, signup, OAuth callback
└── api/                  # vote + copy count endpoints
components/
├── ui/                   # shadcn/ui components
├── prompts/              # Prompt-specific components
├── tools/                # Tool card
├── layout/               # Header + Footer
└── auth/                 # Auth form
lib/
├── supabase/             # Browser, server, middleware clients
├── types/database.ts     # Hand-written Supabase types
└── utils.ts              # Helpers (slugify, substituteVariables, etc.)
supabase/
└── migrations/0001_init.sql
```

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server at http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm type-check` | TypeScript (`tsc --noEmit`) |
| `pnpm check` | Run type-check → lint → build sequentially (same as CI) |

**Install the pre-commit hook** (runs `pnpm type-check` before every commit):

```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
```

Skip the hook on a specific commit with `git commit --no-verify`.

---

## Pre-deploy Checklist

Run through this before every production deployment.

- [ ] All env vars present in Vercel project settings (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`)
- [ ] Supabase **Site URL** updated to the production domain
- [ ] Supabase **Redirect URLs** include the production callback: `https://your-domain.com/auth/callback`
- [ ] Google OAuth callback URL updated in GCP console
- [ ] GitHub OAuth callback URL updated in GitHub app settings
- [ ] First admin user has `is_admin = true` in the `profiles` table
- [ ] All migrations run (`supabase db push`)
- [ ] `pnpm check` passes cleanly (zero type errors, zero lint warnings, clean build)
- [ ] Lighthouse mobile score ≥ 90 on `/`, `/prompts`, `/prompts/[any-slug]`
- [ ] Smoke test passes: `bash scripts/smoke.sh https://your-domain.com`
- [ ] End-to-end smoke: sign up → confirm email → complete onboarding → submit prompt → vote on a prompt → copy a prompt — all as a fresh user

---

## Contribution Guidelines

1. Fork the repo and create a feature branch.
2. Keep PRs focused — one feature or fix per PR.
3. TypeScript strict mode — no `any`, no `console.log`.
4. Server Components by default; use `"use client"` only when interactivity requires it.
5. Validate all form input with zod schemas shared between client and server.
6. Test your changes at sm/md/lg breakpoints before opening a PR.

---

## Decisions Made

| Decision | Rationale |
|---|---|
| **Trending score computed on read** | Eliminates a scheduled job for v1. The `calculate_trending_score` SQL function exists; calling it from a Supabase cron job (or pg_cron) is a one-liner upgrade path. At scale, run it on a scheduled job and store the result in `trending_score`. |
| **Violet accent color** | Chosen over blue (overused), emerald (too "money"), amber (too warm). Violet reads as "creative/technical" — well-matched to prompt engineering. |
| **Hand-written database types** | `supabase gen types typescript` requires a live project to run. The hand-written types are 100% consistent with the migration. Once you link a project, run `supabase gen types typescript --local > lib/types/database.ts` to replace them. |
| **Universal moderation gate** | Every prompt enters review before publishing, ensuring consistent quality at launch. Revert to the 2-prompt threshold by restoring `const needsReview = !isAdmin && contributionCount < 2` in `submit-form.tsx` and re-adding the `contributionCount` prop. |
| **URL-driven filters** | All browse filters are stored in the URL query string, making every filtered view bookmarkable and shareable. No client-side filter state needed. |
| **No caching headers set** | Deferred to Vercel's defaults for v1. Add `revalidate` or ISR to browse/detail pages for production traffic. |

---

## Manual Checklist (post-build)

See [SETUP.md](./SETUP.md) for the complete setup checklist you need to perform manually.
