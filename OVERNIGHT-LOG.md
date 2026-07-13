# Overnight run log — creator money layer, phases 2-5 + hotfix

Started after Prompt 1 (`0021_hot_leads.sql` / `0022_creator_accounts.sql`) shipped green — commit `0d9db4c`, Vercel confirmed.

This file is updated after each phase completes, not just at the end, so a partial run still leaves a readable trail.

**Status: all six phases shipped, green, in order. Nothing stopped early.** No migration or schema change was needed or attempted anywhere in this run — the stop condition never triggered. Six commits total: `842872c` (hotfix), `ed033fe` (phase 2), `636b4be` (phase 3), `397c9a7` (phase 4), `03cd7c8` (phase 5) — all on top of Prompt 1's `0d9db4c`. Every commit's Vercel build is confirmed green.

**Read before doing anything else — three deliberate deviations from the prompts' literal text, each because the literal instruction would have silently broken something:**
1. Phase 2 — `postAuthDestination` and `/auth/callback` also needed the three-branch account-type check, not just the `(app)` gate the prompt named, or landing signups would skip `/welcome` entirely. (details below, "Phase 2")
2. Phase 4 — the organic-run wiring passes raw `values`, not a pre-computed `vars_filled_pct` — the RPC I built in Prompt 1 reads `values` and computes the percentage itself; passing the percentage directly would have zeroed the fill bonus for every run, forever. (details below, "Phase 4")
3. Phase 4 — the claim bundle fires four RPC calls, not the one the prompt's text describes, because the RPC only suppresses scoring for events it's explicitly told about. (details below, "Phase 4")

**Two visible product gaps, not bugs, worth your own call:**
- Step 2 of creator onboarding has no "Import" door — the spec's target for it doesn't exist in the codebase. (details below, "Phase 3")
- Organic follows (from `/u/[username]` or the onboarding payoff screen) never score — neither location has a prompt/pack in view, and the RPC throws without one, per your own note. (details below, "Phase 4")

**One thing that needs your setup before it does anything:** email is fully wired end-to-end but silently no-ops everywhere until `RESEND_API_KEY` + a verified domain are set in Vercel, exactly as planned. Consider `CRON_SECRET` too — the digest cron checks it if present but doesn't require it (details below, "Phase 5").

---

## Hotfix — thread `next` through the onboarding detour

**Commit:** `842872c`
**Files:** `lib/supabase/post-auth-redirect.ts`, `app/auth/callback/route.ts`, `app/onboarding/page.tsx`, `components/onboarding/client-onboarding-form.tsx`

Threaded a validated `next` query param through both post-auth paths (the immediate-session path via `postAuthDestination`, and the email-confirmation/OAuth path via `/auth/callback`) so a signed-out visitor claiming a pack lands back on it after onboarding instead of at a generic destination. Verified the full call chain by reading `auth-form.tsx` and `get-pack-button.tsx` end to end before touching anything, not just the four files the prompt named.

**Judgment call:** the hotfix prompt's instruction for `client-onboarding-form.tsx` said "default `/dashboard`" — but the component's actual current hardcoded payoff destination is `/library`, not `/dashboard` (confirmed by reading the file). Changing that default would be an unrequested behavior change for every onboarding completion that doesn't carry a `next` (the common case), and the hotfix explicitly says "do not change the onboarding gate itself, only stop it from eating the destination." I kept `/library` as the component's own default and only override it with the threaded `next` when one is actually present and validated — so `app/onboarding/page.tsx` computes two distinct values: `next` (falls back to `/dashboard`, used only for the already-onboarded early-exit redirect, matching that line's pre-existing hardcoded behavior) and `validatedNext` (undefined when nothing safe was threaded through, passed to the form so *its* default applies). Worth a glance to confirm this reads right.

Vercel: confirmed green.

---

## Phase 2 — Account-type routing

**Commit:** `ed033fe`
**Files:** `app/(app)/layout.tsx`, `lib/supabase/post-auth-redirect.ts`, `app/auth/callback/route.ts`, `lib/claim.ts`, `app/welcome/page.tsx` (new), `app/welcome/actions.ts` (new), `components/welcome/welcome-picker.tsx` (new), `app/(app)/dashboard/profile/actions.ts`, `app/(app)/dashboard/profile/become-creator-button.tsx` (new), `app/(app)/dashboard/profile/page.tsx`, `lib/types/database.ts` (added `AccountType` alias)

Built the three-lane gate, `/welcome` (server guard + client picker that short-circuits claimers without clearing their pending claim — `ClaimReconciler` still needs to read it later), `chooseAccountType`, the `claimPendingState` belt-and-suspenders write, and the "Turn on creator tools" settings toggle.

**Judgment call, the important one:** the prompt only named `app/(app)/layout.tsx` as needing the three-branch gate. But `postAuthDestination` (the function `AuthForm`'s login/signup submit handlers call directly, used by both the plain `/auth/signup` landing page and every pack/prompt-triggered auth dialog) and `app/auth/callback/route.ts` (the OAuth/email-confirmation path) are *separate* code paths that only ever checked `onboarding_complete`, with no idea `account_type` exists. Traced the full call chain (`auth-form.tsx` → `postAuthDestination` → `router.push`) before concluding this: left as the prompt described it, every brand-new signup — including a plain landing-page one with no claim — would have skipped `/welcome` entirely, landed straight in the client onboarding flow, and only seen the picker (confusingly, after already profiling as a client) on their *next* navigation into `(app)`. Extended both functions with the same three-branch check the gate uses, sharing the same `next`-preserving pattern the hotfix established. Worth confirming this reads right — it's the one place I went meaningfully beyond the prompt's literal file list.

**Also added:** a server-side idempotency guard inside `chooseAccountType` itself (re-checks `account_type IS NULL` before writing) rather than trusting the client-side "already set → redirect away" guard alone — the spec's "no back-door re-pick" rule should hold even against a replayed or malformed action call, not just the happy-path UI.

**Known gap until Phase 3 lands:** `/creator/onboarding` doesn't exist yet, so between this deploy and Phase 3's, a user picking "I'm here to get clients" hits a 404. Expected per `CREATOR-ONBOARDING-SPEC.md`'s own build order (Phase A ships before Phase B); Phase 3 follows immediately in this run.

Vercel: confirmed green.

---

## Phase 3 — Creator onboarding flow

**Commit:** `636b4be`
**Files:** `app/creator/onboarding/page.tsx` (new), `app/creator/onboarding/actions.ts` (new), `components/onboarding/creator-onboarding-form.tsx` (new)

Built the 5-step flow mirroring `app/onboarding` + `client-onboarding-form.tsx`'s structure and visual language exactly (same card, stepper, button treatment).

**Judgment call, spec-vs-reality gap:** Step 2's spec text describes two doors, "Build" and "Import (paste text/Doc/PDF -> the existing `/api/packs/ai-draft` path generates a fillable prompt)." I read `ai-draft`'s actual route handler before building anything: it only drafts promise-line/liner-note *copy* for a pack that already has prompts in it (`kind: "promise_line" | "liner_note"`) — there is no document-to-fillable-prompt extraction feature anywhere in the codebase (checked `/admin/import` too; that's an admin CSV/JSON bulk-importer for already-structured prompt data, unrelated). Rather than build a new AI document-extraction pipeline unattended (a real new feature, not onboarding wiring, and outside what "no schema changes" scoping implies is safe for this run) or ship a second button that silently does the same thing as the first, I shipped Step 2 with one real door ("Build a pack" -> `/dashboard/packs/new`, confirmed to be a working, param-free redirect-to-draft route) plus the "I'll do this later" skip. No "Import" button. Flagging this clearly since it's a visible deviation from the spec's described UI, not just an internal implementation choice.

**Step persistence:** used data-driven resume (server computes the furthest-completed step from `profiles.offer_headline` / a published pack existing / an `offer_slots` default row existing / a `creator_alert_settings` row existing) instead of a `?step=` param — the spec offered both as options. This means "resume at Step 3 after publishing" (the one case that actually needs to survive a real page reload, since Step 2's "Build" door navigates away to a different route) falls out of the logic naturally rather than needing round-trip plumbing through the pack builder, which I'd rather not modify mid-run.

**Also worth a look:** `saveOfferSlot` does a manual select-then-insert-or-update instead of `.upsert()` — the "one default offer slot per creator" rule from Phase 1's migration is a *partial* unique index (`WHERE prompt_id IS NULL`), and Supabase's `.upsert({...}, {onConflict: 'creator_id'})` emits a plain `ON CONFLICT (creator_id)` that doesn't match a partial index, which would have thrown at runtime the first time someone completed this step twice.

Vercel: confirmed green.

---

## Phase 4 — Hot-lead heat spine wiring + /dashboard/leads

**Commit:** `397c9a7`
**Files:** `lib/lead-events.ts` (new, shared `recordLeadEvent` helper), `lib/claim.ts`, `lib/prompt-runs.ts`, `components/prompts/preset-panel.tsx`, `components/prompts/save-prompt-button.tsx`, `components/packs/get-pack-button.tsx`, `components/onboarding/matched-item-save-button.tsx`, `app/(app)/dashboard/leads/page.tsx` (new), `app/(app)/notifications/page.tsx`, `components/layout/app-sidebar.tsx`

Wired `record_lead_event` into every real write site I could find for claim/run/preset/save (searched the whole app for every `.from("prompt_runs"|"prompt_presets"|"prompt_saves"|"pack_saves"|"follows")` call before touching anything, not just the ones the prompt named), built the ranked `/dashboard/leads` list off `get_my_leads()` + `get_lead_detail()`, rendered `hot_lead` notifications, and added a creator-only "Leads" nav entry.

**Judgment call, follow-up on the note you flagged in the last prompt:** `FollowButton` (the only place `follows` gets an organic insert) is used on `/u/[username]` and the onboarding payoff screen's creator cards — neither has a prompt or pack in view, and `record_lead_event` throws without one. Per your note, I did not wire it at all rather than guess at a fake context. This means S8 (organic follow, weight 3) never actually fires in this build — only the claim-bundled follow (which always carries a promptId) contributes anything. If you want organic follows to score, that needs either a `p_creator_id` escape hatch on the RPC (a real signature change, so a migration) or a prompt/pack id threaded into wherever a "Follow" button gets rendered on content pages, and there currently aren't any.

**Judgment call, the one that would have silently zeroed a whole scoring signal:** the prompt's instruction for the organic run path says to call `record_lead_event('prompt_run', promptId, null, { vars_filled_pct })` — i.e., compute the percentage client-side and pass the number. But `record_lead_event` (which I wrote in Prompt 1, specifically to avoid trusting a client-computed percentage) reads a `values` key out of meta and computes `vars_filled_pct` itself server-side by comparing against the prompt's variable defaults; it does not read an incoming `vars_filled_pct` at all — my own earlier design deliberately strips that key from the input and recomputes it, documented in Phase 1's migration comments. Wiring it exactly as the prompt described would have made every organic run's `meta` contain a `vars_filled_pct` key the RPC ignores, meaning the raw `values` key it actually reads would be absent, so it would always compute 0% filled and the S4 "genuinely filled" bonus (+4) would never fire for anyone, ever. Wired `logPromptRun` to pass `{ values }` instead, matching what the RPC I built actually reads.

**Also went beyond the file list:** the claim-bundle wiring in `lib/claim.ts`. The prompt's text for this step says to call `record_lead_event('claim', promptId, null, {})` once and states "the RPC suppresses the bundled run/preset/follow" — read on its own, that sounds like a single call is enough. But my Prompt-1 RPC only suppresses *scoring* for a bundled event if the caller explicitly reports it with `meta.claim_bundle: true` — it does not synthesize those events on its own from a bare claim call. Skipping the three bundled calls would silently break the ordinal bookkeeping I verified against the spec's own worked example in Prompt 1 (a claimer's first *organic* run would incorrectly score as a "first run" (+8) instead of a "repeat run" (+5), since the claim-bundled run would never be recorded to consume that slot). Added all three bundled calls (`prompt_run`, `preset_saved`, `follow` when a creator id exists) with `claim_bundle: true`, alongside the bare `claim` call — four RPC calls total, matching what the RPC I actually built expects, not the literal one-call reading of the prompt text.

**Scope note on the leads page:** "minimal ... ranked list" per Phase 1's own scoping language. Signal breakdown resolves prompt/pack titles via a follow-up query (the RPCs only return raw ids, and I can't touch the RPC without a migration this run forbids). "Lead #" handle is derived deterministically from the user id (first 6 hex chars) rather than a rank-based number, since rank changes as scores decay and a shifting label would be confusing — spec's "Lead #14" reads as illustrative, not a literal requirement for a small sequential integer.

Vercel: confirmed green.

---

## Phase 5 — Offer slot render + email

**Commit:** `03cd7c8`
**Files:** `components/prompts/offer-slot-card.tsx` (new), `components/prompts/copy-button.tsx`, `components/prompts/launch-menu.tsx`, `components/prompts/prompt-detail.tsx`, `app/(app)/prompts/[slug]/page.tsx`, `app/(app)/dashboard/offers/{page,actions,offers-manager}.tsx` (new), `app/(app)/dashboard/leads/alert-settings-panel.tsx` (new + wired into the leads page), `lib/lead-events.ts`, `lib/email/{resend,hot-lead}.ts` (new), `app/api/leads/{send-alert-email,send-digest}/route.ts` (new), `vercel.json` (new), `lib/types/database.ts` (added `OfferSlot`/`CreatorAlertSettings` aliases), `.env.local` (`NEXT_PUBLIC_APP_URL` fix), `package.json` (added `resend`).

No schema changes anywhere in this phase or any of the four before it — never hit the "seems like it needs a migration" stop condition.

**The offer card, read carefully before touching anything:** `prompt-detail.tsx` is the biggest single page in the app (`/prompts/[slug]`, ~52 kB), so I read the whole component plus `copy-button.tsx` and `launch-menu.tsx` before writing a line, to find exactly where a "successful run" already happens. Both buttons already call `logPromptRun` post-copy/post-launch (only when signed in) — added an `onSuccess` prop to both, fired unconditionally (signed in or not, since anonymous visitors are supposed to see the card too), which flips a `hasRun` state in `PromptDetail` that reveals the card below the action rail. The resolved slot itself (per-prompt override beating the creator's default) is fetched server-side in `page.tsx` and passed down as a prop — `.in()` can't match a NULL `prompt_id`, so that query uses `.or('prompt_id.eq.X,prompt_id.is.null')` instead.

**Architectural call the prompt didn't specify: how email actually gets triggered.** The spec says "sent from the app layer... when record_lead_event returns alert_fired." But `recordLeadEvent` (the Phase 4 helper) is called from both client components (browser-side `supabase.rpc()`) and one server action (`claim.ts`), and Resend can only ever run server-side — a client component can't import it, and there's no `RESEND_API_KEY` anywhere near the browser. Rather than duplicate "check alert_fired, maybe email" logic at every call site, `recordLeadEvent` now inspects the RPC's own return value and, on `alert_fired`, fires a fetch to a new `/api/leads/send-alert-email` route — one code path, works uniformly whether the caller was client or server. The route re-derives the creator from prompt/pack itself (never trusts one from the request body, same rule the RPC follows) and always returns 200 so a failure here can never surface as a user-facing error for an action that already succeeded. Building this meant `recordLeadEvent`'s fetch needs an absolute URL (`NEXT_PUBLIC_APP_URL` — a server action has no browser origin to resolve a relative path against), which is a second, independent reason that env var needed fixing this run beyond what the prompt asked for.

**Also fixed while writing the email copy:** the instant-alert template originally called `stageHeadline(stage)` with no second argument, so it could never distinguish an offer-click alert from a plain threshold-crossing one — every instant email would have said "hasn't clicked your offer yet," including the ones sent *because* they just clicked it. Threaded `triggerEventType` through from `lead-events.ts` (it already had the event type in scope) to the API route to the email function so the two payload variants from spec section 4 actually render differently.

**Digest "unsent" tracking:** there's no `emailed_at` column and this run can't add one, so the daily-digest cron treats unread `hot_lead` notifications from the last 24h as the unsent set, then marks them read after a successful send so tomorrow's digest doesn't repeat them. This reuses `read_at` for a second purpose beyond "the creator viewed /notifications" — reasonable given the constraint, but worth knowing about if `read_at` semantics matter elsewhere later.

**Security note on the cron route:** `/api/leads/send-digest` checks a `CRON_SECRET` bearer token *if one is set*, but doesn't require it to exist — matching the same "no-op/degrade gracefully when an env is absent" posture the whole phase uses for `RESEND_API_KEY`. That's a deliberately softer stance than a cron endpoint sending real email arguably deserves; set `CRON_SECRET` in Vercel alongside `RESEND_API_KEY` if you want this actually locked down rather than just discouraged.

**Lint gate note:** this repo's `.eslintrc.json` has `"no-console": "error"` with no exceptions (not even `console.error`), which I hit immediately in the email code and had to strip every log line to match — worth knowing if you add server-side logging anywhere later, since there's currently no sanctioned way to log from this codebase at all.

`vercel.json` is new (no prior file to conflict with) — one cron entry, `/api/leads/send-digest` at 14:00 UTC daily (~9am ET). No existing crons to preserve.

Vercel: confirmed green.

---

---
