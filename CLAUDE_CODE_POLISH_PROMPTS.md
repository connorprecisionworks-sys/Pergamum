# Pergamum — Final Polish Prompts for Claude Code

A paste-ready set of self-contained prompts to hand to Claude Code, one at a time, in your project root. Each prompt is scoped, grounded in real file paths, and ends with verification steps so Claude Code knows when it's "done."

**How to use:**
1. Open Claude Code in `~/Desktop/Pergamum`.
2. Pick a prompt below, copy the block between the `=====` markers, paste, and let it run.
3. Review the diff before committing.
4. Run `pnpm type-check && pnpm lint && pnpm build` after each one.

The prompts are ordered roughly by impact-per-effort. You can skip any of them.

---

## 1. Loading, error, and not-found states (high impact)

**Why:** The app currently has zero `loading.tsx`, `error.tsx`, or `not-found.tsx` files in `app/`. Every navigation feels frozen until the server responds, and any thrown error blanks the page. This is the single biggest perceived-quality win.

```
=====
You are polishing Pergamum, a Next.js 14 App Router app. Your job: add loading, error, and not-found UX across the route tree.

Scope (do exactly these, no more):

1. Create skeleton loading.tsx files that match each page's layout for:
   - app/(app)/prompts/loading.tsx (browse grid skeleton — 6 card placeholders matching components/prompts/prompt-card.tsx)
   - app/(app)/prompts/[slug]/loading.tsx (detail skeleton — title, body block, sidebar)
   - app/(app)/feed/loading.tsx
   - app/(app)/leaderboards/loading.tsx
   - app/(app)/collections/loading.tsx
   - app/(app)/dashboard/loading.tsx
   - app/(app)/u/[username]/loading.tsx
   - app/(marketing)/tools/loading.tsx

2. Create error.tsx boundaries (must be "use client") with a friendly message, the error digest in small text, and a "Try again" button calling reset():
   - app/(app)/error.tsx (covers all authed routes)
   - app/(marketing)/error.tsx
   - app/error.tsx (root fallback)

3. Create not-found.tsx pages with a clear message and a CTA back to /prompts:
   - app/not-found.tsx (root)
   - app/(app)/prompts/[slug]/not-found.tsx
   - app/(app)/u/[username]/not-found.tsx

4. In every page that fetches by slug or username and currently returns null on miss, replace the silent return with `notFound()` from `next/navigation` so the not-found.tsx files actually render.

Constraints:
- Use shadcn/ui Skeleton (create components/ui/skeleton.tsx with the standard shadcn skeleton if it doesn't exist).
- Match Pergamum's violet accent (already in tailwind.config.ts).
- No new dependencies.
- Keep skeletons under ~30 lines each — don't over-engineer.

Verify by:
- Running `pnpm dev` and slow-throttling the network to see skeletons render.
- Visiting /prompts/this-slug-definitely-does-not-exist and confirming the not-found page shows.
- Throwing a test error in a server component and confirming error.tsx catches it.

Then run `pnpm type-check && pnpm lint && pnpm build` and report any remaining issues.
=====
```

---

## 2. SEO foundation: sitemap, robots, dynamic OG images

**Why:** A community prompt library lives or dies on Google traffic. There's no `sitemap.ts`, no `robots.ts`, and no Open Graph images. Prompts shared on Twitter/LinkedIn show as bare URLs.

```
=====
Pergamum is missing its SEO foundation. Add it.

1. Create app/robots.ts that exports a MetadataRoute.Robots:
   - Allow all on /
   - Disallow /dashboard, /admin, /onboarding, /auth
   - Reference /sitemap.xml

2. Create app/sitemap.ts that exports a MetadataRoute.Sitemap. It should:
   - Include the static pages: /, /prompts, /tools, /leaderboards, /collections, /badges, /feed
   - Query Supabase for all status='published' prompts and their slugs + updated_at, output as /prompts/[slug]
   - Query for all profiles with at least one published prompt, output as /u/[username]
   - Use the server Supabase client from lib/supabase/server.ts
   - Cap at 50,000 URLs (Next.js / Google limit) — slice if exceeded
   - Use NEXT_PUBLIC_APP_URL as the base, falling back to https://pergamum.app

3. Create app/(app)/prompts/[slug]/opengraph-image.tsx using next/og's ImageResponse:
   - 1200x630, violet-to-black gradient background
   - Prompt title (truncated to ~60 chars), author handle, and the Pergamum wordmark
   - Use the size, contentType, and alt exports per Next 14 conventions
   - Add a `twitter-image.tsx` that re-exports the same component (or use the same file convention)

4. Audit app/layout.tsx metadata:
   - Set metadataBase to NEXT_PUBLIC_APP_URL (or the fallback)
   - Add openGraph (title, description, siteName, type: 'website', images)
   - Add twitter card (summary_large_image)
   - Add a default openGraph image at app/opengraph-image.tsx for the homepage

5. Add JSON-LD structured data to app/(app)/prompts/[slug]/page.tsx — a CreativeWork schema with author, datePublished, dateModified, name, description.

Constraints:
- No new dependencies (next/og is built-in).
- Don't touch existing per-page generateMetadata exports — just augment.

Verify by:
- Visiting /robots.txt and /sitemap.xml in dev.
- Hitting /prompts/[slug]/opengraph-image and confirming a PNG renders.
- Pasting a prompt URL into the Twitter card validator (https://cards-dev.twitter.com/validator) after deploy.

Run `pnpm type-check && pnpm lint && pnpm build`.
=====
```

---

## 3. Accessibility audit pass

**Why:** Auth + voting + form-heavy UIs are easy to ship a11y-broken. Get this right once and stop worrying.

```
=====
Run an accessibility audit on Pergamum and fix the findings. Stay focused — don't refactor business logic.

Audit these surfaces:
- components/prompts/vote-buttons.tsx (interactive, must have aria-pressed and aria-label)
- components/prompts/copy-button.tsx (announce success to screen readers via aria-live)
- components/prompts/variable-form.tsx (every input must have an associated <Label htmlFor>)
- components/prompts/filter-sidebar.tsx (filter group must have a proper landmark / fieldset+legend)
- components/auth/auth-form.tsx (errors must be linked to inputs via aria-describedby and aria-invalid)
- components/layout/header.tsx (mobile nav button needs aria-expanded, aria-controls; nav lands as <nav>)
- components/ui/dialog.tsx (already uses Radix — verify focus trap is not overridden)

Fix-list (do all that apply on each file):
1. Every <button> that's an icon-only button needs an aria-label or visually-hidden text.
2. Every form input has a programmatically associated label (htmlFor + id, NOT just placeholder).
3. Color contrast: open app/globals.css and tailwind.config.ts; verify body text and muted-foreground hit WCAG AA (4.5:1) on both light and dark themes. If muted-foreground is too light on muted background, bump it.
4. All clickable <div>s become <button> or get role="button" + tabIndex={0} + onKeyDown for Enter/Space.
5. Add a visible focus ring to all interactive elements (Tailwind: `focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2`). Ensure components/ui/button.tsx variants don't strip it.
6. Add a "Skip to content" link as the first child of app/layout.tsx, hidden until focused, that jumps to <main id="main">.

Constraints:
- Don't change visual design beyond focus rings and contrast adjustments.
- No new dependencies.

Verify by:
- Running `npx @axe-core/cli http://localhost:3000` against /, /prompts, /prompts/[any-slug], /submit, /auth/login. Report any remaining violations.
- Tabbing through /prompts/[slug] start-to-finish using only the keyboard. Vote, copy, and submit a comment without touching the mouse.

Run `pnpm type-check && pnpm lint && pnpm build`.
=====
```

---

## 4. Empty states everywhere

**Why:** Empty dashboards, empty collections, empty filtered browses all silently render nothing today. Empty states are the cheapest conversion lever you have.

```
=====
Add proper empty states throughout Pergamum. An empty state has: an illustration or icon (use lucide-react), a one-line headline, a one-line subheadline, and a primary CTA button.

Pages that need empty states:

1. app/(app)/prompts/page.tsx — when filters yield zero prompts: "No prompts match your filters" + "Clear filters" button (clears query string).
2. app/(app)/dashboard/page.tsx — when user has zero prompts: "Share your first prompt" + CTA to /submit.
3. app/(app)/dashboard/collections/page.tsx — when zero collections: "Save prompts to collections to organise them" + "Create your first collection".
4. app/(app)/collections/page.tsx — when no public collections exist yet: friendly placeholder.
5. app/(app)/feed/page.tsx — when user follows no one: "Follow people to see their prompts here" + CTA to /leaderboards.
6. app/(app)/u/[username]/page.tsx — when profile has zero published prompts: "[handle] hasn't published yet."
7. app/(app)/badges/page.tsx — when user has earned zero badges: encouraging message about how to earn the first one.
8. app/(app)/leaderboards/page.tsx — empty case (early users): "Be the first on the leaderboard" + CTA to /submit.
9. app/(marketing)/tools/page.tsx — when filtered to a category with no tools: "No tools in this category yet" + "Suggest a tool" CTA (link to a mailto or /submit).

Create one shared component: components/ui/empty-state.tsx with props { icon, title, description, action? }. Use it everywhere. Match the existing card styling (rounded-lg border bg-card p-12 text-center).

Constraints:
- No new dependencies.
- Use existing shadcn Button.
- Headlines under 8 words; descriptions under 18.

Verify by:
- Visiting each route while signed in as a fresh test user (create one if needed).
- Visiting /prompts?q=zzzzzzzz to trigger the filtered-empty case.

Run `pnpm type-check && pnpm lint && pnpm build`.
=====
```

---

## 5. Microcopy + toast pass

**Why:** Microcopy is the cheapest way to make an app feel premium. Half a day of work, immediately noticeable.

```
=====
Polish all user-facing copy in Pergamum. The voice: friendly, concise, lowercase-feeling but properly capitalised, no exclamation points except in genuine wins.

Pass through these surfaces and rewrite anything generic:

1. All `toast()` and `toast.error()` / `toast.success()` calls — grep for `sonner` imports across app/ and components/. Replace generic strings ("Success", "Error occurred") with action-specific ones ("Prompt published — it's live at /prompts/[slug]", "Couldn't publish — your draft is saved").
2. components/auth/auth-form.tsx — error messages from Supabase ("Invalid login credentials") become "That email and password don't match. Try again or reset your password."
3. app/(app)/submit/submit-form.tsx — labels, placeholders, helper text. Each field gets a one-sentence helper that explains *why* not *what* (e.g., for slug: "How this prompt's URL will look. We'll generate one if you leave it blank.").
4. app/(app)/prompts/[slug]/page.tsx — the copy button states: "Copy prompt" → "Copied!" → "Copy prompt" (revert after 2s). Already exists in copy-button.tsx — verify it.
5. app/auth/login/page.tsx and /signup — replace "Sign in" / "Sign up" descriptions with one-sentence value props ("Welcome back — pick up where you left off" / "Join the library — submit, vote, save prompts.").
6. Footer (components/layout/footer.tsx) — replace any "Made with ❤️" type filler with the actual project mission in one sentence.
7. 404 / not-found copy (from prompt #1 if you ran it): make it a tiny bit playful — "We couldn't find that prompt. It may have been unpublished, or the link is mistyped."
8. Onboarding (app/onboarding/) — every step's heading and subheading: be human, not corporate.

Constraints:
- Don't change any business logic or component structure.
- Don't add emoji unless one is already there.
- Stay consistent: contractions everywhere ("you'll" not "you will"), oxford comma, no exclamation points except for genuine successes.

Verify by:
- Walking the full signup → onboarding → submit-first-prompt → vote → copy flow and reading every word.
- Checking that no string starts with "Error:" — errors should be human sentences.

Run `pnpm type-check && pnpm lint && pnpm build`.
=====
```

---

## 6. Performance + Core Web Vitals

**Why:** Lighthouse scores are how landing-page conversion gets quietly murdered. Fix the obvious wins.

```
=====
Run a performance pass on Pergamum. Focus on Core Web Vitals (LCP, CLS, INP) on /, /prompts, and /prompts/[slug].

Do all of these:

1. Fonts: open app/layout.tsx. Use next/font/google for any external font (probably Inter). Set display: 'swap' and preload the subsets actually used. Don't ship the font from a CDN.

2. Images: grep for `<img ` across app/ and components/ and replace with next/image. For external avatars (Supabase storage URLs, GitHub avatars), add their domain to next.config.mjs `images.remotePatterns`. Set explicit width/height to prevent CLS.

3. Bundle audit: install @next/bundle-analyzer (devDep), wrap next.config.mjs, run `ANALYZE=true pnpm build` and report the top 5 client bundles. Lazy-import anything > 50KB that isn't used above-the-fold (likely candidates: chart libs in /leaderboards, dialog content, the markdown renderer if any).

4. Add `export const revalidate = 60` to the browse page (app/(app)/prompts/page.tsx) so it's served from cache for 60s. Add `revalidate = 300` to detail pages (app/(app)/prompts/[slug]/page.tsx). Skip authenticated personal pages (dashboard, feed) — those stay dynamic.

5. Add `export const dynamic = 'force-static'` to:
   - app/(marketing)/page.tsx
   - app/(marketing)/tools/page.tsx (if tools list is small/seeded)
   Then set per-page `revalidate` for tools so admin approvals still propagate.

6. Verify components/prompts/prompt-card.tsx is a Server Component. If it imports any "use client" component (vote-buttons, copy-button), confirm those leaf components are the only client boundaries — the card itself should not be marked client.

7. Preload the LCP image on the homepage: in app/(marketing)/page.tsx, add `<link rel="preload" as="image" ...>` for any hero asset, or pass `priority` to its next/image.

Constraints:
- No new runtime dependencies (bundle-analyzer is devDependency only).
- Don't break any existing page that depends on real-time freshness — flag those instead of caching them.

Verify by:
- Running `pnpm build` and confirming no "Dynamic server usage" errors.
- Lighthouse mobile run on / and /prompts: report scores for Performance, Accessibility, Best Practices, SEO. Target ≥ 90 each.

Run `pnpm type-check && pnpm lint && pnpm build`.
=====
```

---

## 7. Mobile polish at 375px

**Why:** Most prompt-engineering Twitter clicks come from phones. Open every page at 375px and fix what bleeds.

```
=====
Polish Pergamum's mobile experience at 375px width. iPhone SE / iPhone 13 mini is your target.

Open Chrome DevTools, set device to "iPhone SE", and walk these routes. Fix any horizontal scroll, overlapping content, or sub-44px touch targets:

- /
- /prompts
- /prompts/[slug] — including the variable form, vote buttons, copy button, and comments
- /submit
- /auth/login and /auth/signup
- /dashboard
- /u/[any-username]
- /tools
- /leaderboards
- /collections

For each issue:
1. Identify the offending file from the React DevTools breadcrumb.
2. Apply Tailwind responsive prefixes (default is mobile-first). Replace fixed widths with `w-full` + `max-w-*`. Use `flex-wrap` on nav and chip rows.
3. Ensure every tappable element is at least 44x44px (Tailwind: `min-h-11 min-w-11` or apply equivalent padding).
4. Sticky header should not eat more than 56px on mobile.
5. Filter sidebar (components/prompts/filter-sidebar.tsx) on /prompts: collapse into a Sheet/Dialog at <md breakpoint, not always-visible.
6. Tables (leaderboards) become stacked cards on mobile.

Constraints:
- Don't redesign — fix what's broken at 375px without altering desktop.
- No new dependencies.

Verify by:
- Walking all 10 routes at 375px and confirming zero horizontal scroll on any of them.
- Tapping every primary CTA on a real phone (or DevTools touch emulation).

Run `pnpm type-check && pnpm lint && pnpm build`.
=====
```

---

## 7.5 Universal moderation: every prompt reviewed (product change)

**Why:** Today, the first 2 prompts from each new user are reviewed; after that they publish instantly. At launch with zero users, universal review keeps every prompt on the site curated — every visitor's first impression of "the library" is hand-vetted content. Reversible later when volume forces a faster path.

```
=====
Pergamum currently routes the first 2 prompts from each new user through admin review, then publishes the rest instantly. Change this: every newly submitted prompt — from any user, regardless of their prompt history — goes through review before publishing.

Scope:

1. Find the moderation threshold logic. Search for "pending", "is_admin", "moderation", "status" across app/, lib/, and supabase/migrations/ to locate the gate. It's likely in a server action under app/(app)/submit/, possibly enforced by a Supabase trigger or column default.

2. Replace the gating: every new INSERT into prompts gets status='pending' regardless of the submitter's prompt count. Admins publishing via the admin panel still works the same.

3. Update user-facing copy that references the 2-prompt threshold:
   - Submit form: change to "Every prompt is reviewed before going live (usually under an hour). We'll let you know when yours is approved."
   - Any onboarding step mentioning the threshold: update or remove
   - Dashboard "pending" copy if it references it

4. Existing published prompts stay published. Edits to a published prompt do NOT re-enter review. Only new INSERTs are gated.

5. If the gate is enforced in SQL, create a new migration supabase/migrations/0007_review_all_prompts.sql. Don't edit existing migrations.

6. Update DECISIONS.md — add a "## Phase 4 — Launch Readiness" section documenting this change in one paragraph: rationale (consistency + quality at launch beats contributor-friction cost), reversion path (revert the migration and the submit-flow change to restore the 2-prompt threshold).

7. Update README.md "Features" section: replace the "first 2 prompts from new users" line with "Every prompt is reviewed before publishing."

Constraints:
- No new dependencies.
- Preserve the +10 publish reputation reward (already awarded at publish time per D-003, which still works because the admin's approval triggers it).
- Don't break the admin panel.

Verify by:
- Submitting a prompt as a user with an existing publish history; confirm it lands in /admin queue and not as published.
- Approving from /admin and confirming +10 rep awards correctly.

Run pnpm type-check && pnpm lint && pnpm build.
=====
```

---

## 8. Security + RLS sanity check

**Why:** Supabase + service-role keys + user-submitted content = exactly the surface where small mistakes leak data. Spend an hour locking it down.

```
=====
Run a security audit on Pergamum. Don't refactor — find and fix specific vulnerabilities.

Check and fix:

1. Service role key leakage:
   - Grep for `SUPABASE_SERVICE_ROLE_KEY` across app/ and components/. It must ONLY appear in server-side files (route handlers, server actions, generateMetadata, server components) — never in any "use client" file or anything imported by one.
   - If it leaks, replace those calls with the user-scoped server client from lib/supabase/server.ts.

2. RLS coverage: open supabase/migrations/0001_init.sql through 0006_v2_engagement.sql. For every table created, confirm:
   - Row Level Security is ENABLED.
   - There is at least one policy for each of SELECT / INSERT / UPDATE / DELETE that the app actually performs.
   - INSERT/UPDATE/DELETE policies validate `auth.uid() = owner_id` (or the equivalent column).
   - Public-read tables (prompts where status='published', tools where approved=true) have a SELECT policy that allows anon, but INSERT/UPDATE require auth.
   Output a table summarising each table's policies. Flag any gap.

3. User-submitted content rendering:
   - Grep for `dangerouslySetInnerHTML` across the codebase. Every occurrence must use a sanitiser (DOMPurify or similar). If any prompt body, comment, or bio is rendered as raw HTML, fix it.
   - If markdown is rendered (likely in prompt body), confirm the renderer is configured to disable raw HTML.

4. Open redirects: app/auth/callback/route.ts and any redirect handler. Confirm the redirect target is validated against an allow-list (same origin, not arbitrary URL).

5. CSRF: server actions are CSRF-protected by Next.js by default. Confirm app/api/vote/route.ts and app/api/prompts/copy/route.ts validate that the request has a session cookie (use the server Supabase client and check the user). If they currently accept anonymous requests, add the check.

6. Rate limiting: vote and copy endpoints have no rate limit. Add a simple per-user-per-minute cap using Supabase (insert into a rate_limit_events table OR use Upstash Redis if it's already configured — don't add it if not). At minimum: a SQL constraint or check that prevents the same user from voting on the same prompt more than 10 times per minute.

7. .env.local.example should list every env var the app uses, with placeholder values, but no real keys. Confirm.

Constraints:
- Don't add new infra (Redis, etc) unless already present.
- Document each finding and fix in DECISIONS.md under a new "## Phase 4 — Security Hardening" section.

Verify by:
- Running `grep -r SUPABASE_SERVICE_ROLE_KEY app components` and confirming zero hits.
- Running the supplied SQL audit against the Supabase project.

Run `pnpm type-check && pnpm lint && pnpm build`.
=====
```

---

## 9. Pre-deploy CI + checklist

**Why:** Ship breaks happen on Friday at 6pm. A 60-second CI gate prevents most of them.

```
=====
Add a minimal CI workflow and a pre-deploy checklist.

1. Create .github/workflows/ci.yml that runs on pull_request and push to main:
   - Sets up Node 18 and pnpm 9.
   - Installs deps with `pnpm install --frozen-lockfile`.
   - Runs `pnpm type-check`.
   - Runs `pnpm lint`.
   - Runs `pnpm build`.
   - Cancels in-progress runs on the same branch.
   No tests yet (none exist).

2. Add a pre-commit hook (no husky — just a simple `.git/hooks/pre-commit` script committed as scripts/pre-commit.sh and a one-line install command in README.md). It runs `pnpm type-check` and exits non-zero on failure. Make it skippable with `git commit --no-verify`.

3. Add a `pnpm check` script to package.json that runs type-check, lint, and build sequentially. Document it in README under "Scripts".

4. Update README.md with a new "## Pre-deploy Checklist" section listing:
   - All env vars present in Vercel
   - Supabase Site URL updated to production domain
   - OAuth callbacks updated (Google + GitHub)
   - First admin user has is_admin=true
   - Lighthouse mobile run shows ≥ 90 on /, /prompts, /prompts/[slug]
   - Smoke test: signup, submit, vote, copy as a fresh user
   - DNS pointed at Vercel

5. Create scripts/smoke.sh that hits /, /prompts, /tools, /robots.txt, /sitemap.xml against $URL and confirms 200s.

Constraints:
- No new runtime dependencies.
- Keep CI under 3 minutes.

Verify by:
- Pushing a branch with a deliberate type error and confirming CI fails.
- Running `bash scripts/smoke.sh http://localhost:3000` while dev server is up.

Run `pnpm check`.
=====
```

---

## 10. Onboarding funnel polish

**Why:** Signup → first prompt published is the only metric that matters early. Smooth this path obsessively.

```
=====
Polish the signup-to-first-published-prompt funnel in Pergamum.

Audit and improve:

1. app/auth/signup/page.tsx — show value props above the form (3 bullets: free forever, vote on the best prompts, build your library). Keep total above-fold height under 700px on desktop.

2. app/onboarding/ — currently a generic flow. Make each step optional with a "Skip for now" link, but pre-fill helpful defaults. After completion, redirect to /submit, not /dashboard.

3. app/(app)/submit/submit-form.tsx — first-time users see a banner at the top: "Your first 2 prompts go to a quick review queue (usually under an hour). After that, you publish instantly." Detect first-time by querying the user's prompt count.

4. app/(app)/dashboard/page.tsx — for users with zero prompts, replace the entire dashboard content with a single big "Submit your first prompt" hero card with one CTA. Hide the empty stats grid until they've published once.

5. Email confirmation friction: the Supabase email contains a default Supabase template. In SETUP.md, add a section "## Email template polish" with the exact HTML to paste into Supabase Auth → Email Templates → Confirm signup, branded for Pergamum (violet accent, plain-text fallback, signature line).

6. Add "What happens next" copy below the signup button: "We'll send a confirmation email. Click the link, and you're in."

7. Track funnel events with a simple privacy-respecting hook: create lib/analytics.ts exporting `track(event, props?)` that POSTs to /api/events (create the route handler, store in a new analytics_events table). Track: `signup_started`, `signup_completed`, `onboarding_completed`, `first_prompt_submitted`, `first_prompt_published`. No third-party SDK — just our own table. Add a 0007 migration for the table.

Constraints:
- No third-party analytics SDKs.
- Don't break existing flows for returning users.

Verify by:
- Walking through signup → onboarding → submit → publish as a fresh email and watching the events appear in Supabase.
- Confirming users with ≥ 1 prompt see the normal dashboard, not the hero card.

Run `pnpm type-check && pnpm lint && pnpm build`.
=====
```

---

## 11. Final dress rehearsal (run last)

**Why:** A single end-to-end pass with a critical eye, after everything else is in.

```
=====
Pergamum is post-polish and pre-launch. Do a final dress-rehearsal pass and write a short report — don't make changes unless the issue is a critical bug.

Check, in order:

1. Run `pnpm check` (type-check + lint + build). Report any errors.
2. Run Lighthouse mobile on /, /prompts, /prompts/[any-slug]. Report all four scores per route.
3. Run axe (`npx @axe-core/cli`) on the same three routes. Report violation counts.
4. Open the site at 375px, 768px, 1024px, 1440px. Confirm zero horizontal scroll and no overlapping elements at each breakpoint.
5. Walk this end-to-end flow as a fresh user, on mobile:
   - Land on / from a cold cache
   - Sign up with email
   - Confirm via email
   - Complete onboarding
   - Browse /prompts and use one filter
   - Open a prompt, fill a variable, copy it
   - Vote up and confirm count updates
   - Submit your own prompt
   - Confirm it lands in the moderation queue
   - Open dashboard and see your draft / pending prompt
6. Test every OAuth provider (Google, GitHub) signing in and signing out.
7. Test 404s: /prompts/zzznotreal, /u/zzznotreal. Confirm not-found.tsx renders.
8. Test error handling: temporarily break the Supabase URL in .env.local and confirm error.tsx catches it without exposing internals.
9. Open Network tab on /prompts and confirm:
   - No 4xx or 5xx responses
   - No requests to localhost or hardcoded dev URLs
   - The HTML response includes proper meta tags and og:image
10. View page source on /prompts/[slug] and confirm JSON-LD CreativeWork is present.

Output a single report at the end with:
- Lighthouse scores (table)
- axe violation counts (table)
- Pass/fail per flow step
- Any P0 bugs found (with file path)
- Any P1/P2 issues (with file path)

Do not modify code unless you find a P0 bug. P0 = blocks signup, breaks core navigation, exposes credentials, or crashes the build.
=====
```

---

## Suggested order

If you want a reasonable sequence:

1. **#1 (loading/error/not-found)** — biggest perceived-quality jump, blocks nothing
2. **#3 (a11y)** — does light visual changes; do before #5 microcopy
3. **#4 (empty states)** — uses a new shared component you can reuse
4. **#5 (microcopy)** — fastest single-digit hours of work, huge feel improvement
5. **#6 (perf)** — measurable; do before #7
6. **#7 (mobile)** — leans on perf work being done
7. **#2 (SEO)** — ship-blocker for organic but needs prod URL anyway
8. **#10 (onboarding funnel)** — needs analytics groundwork
9. **#8 (security)** — gate before any public launch
10. **#9 (CI + checklist)** — once everything is green
11. **#11 (dress rehearsal)** — the night before launch

Each prompt is independent though — run them in any order you like.

---

## Tips for handing these to Claude Code

- **Run them one at a time.** Don't paste two prompts back to back. Review the diff and commit between each.
- **If Claude Code expands scope**, paste this back: "stay strictly inside the scope I gave you — don't refactor anything else."
- **If a prompt fails halfway**, paste the error and say "continue from where you stopped, only finishing the remaining items in the scope."
- **After each prompt**, run `pnpm check` (after #9 adds it) or `pnpm type-check && pnpm lint && pnpm build` manually.
- **Keep DECISIONS.md as your audit log** — ask Claude Code to append a one-paragraph entry under a `## Phase 3 — Polish` heading after each prompt completes, summarising what changed and why.
