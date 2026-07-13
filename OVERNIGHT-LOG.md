# Overnight run log — creator money layer, phases 2-5 + hotfix

Started after Prompt 1 (`0021_hot_leads.sql` / `0022_creator_accounts.sql`) shipped green — commit `0d9db4c`, Vercel confirmed.

This file is updated after each phase completes, not just at the end, so a partial run still leaves a readable trail.

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

**Commit:** (pending — see below)
**Files:** `lib/lead-events.ts` (new, shared `recordLeadEvent` helper), `lib/claim.ts`, `lib/prompt-runs.ts`, `components/prompts/preset-panel.tsx`, `components/prompts/save-prompt-button.tsx`, `components/packs/get-pack-button.tsx`, `components/onboarding/matched-item-save-button.tsx`, `app/(app)/dashboard/leads/page.tsx` (new), `app/(app)/notifications/page.tsx`, `components/layout/app-sidebar.tsx`

Wired `record_lead_event` into every real write site I could find for claim/run/preset/save (searched the whole app for every `.from("prompt_runs"|"prompt_presets"|"prompt_saves"|"pack_saves"|"follows")` call before touching anything, not just the ones the prompt named), built the ranked `/dashboard/leads` list off `get_my_leads()` + `get_lead_detail()`, rendered `hot_lead` notifications, and added a creator-only "Leads" nav entry.

**Judgment call, follow-up on the note you flagged in the last prompt:** `FollowButton` (the only place `follows` gets an organic insert) is used on `/u/[username]` and the onboarding payoff screen's creator cards — neither has a prompt or pack in view, and `record_lead_event` throws without one. Per your note, I did not wire it at all rather than guess at a fake context. This means S8 (organic follow, weight 3) never actually fires in this build — only the claim-bundled follow (which always carries a promptId) contributes anything. If you want organic follows to score, that needs either a `p_creator_id` escape hatch on the RPC (a real signature change, so a migration) or a prompt/pack id threaded into wherever a "Follow" button gets rendered on content pages, and there currently aren't any.

**Judgment call, the one that would have silently zeroed a whole scoring signal:** the prompt's instruction for the organic run path says to call `record_lead_event('prompt_run', promptId, null, { vars_filled_pct })` — i.e., compute the percentage client-side and pass the number. But `record_lead_event` (which I wrote in Prompt 1, specifically to avoid trusting a client-computed percentage) reads a `values` key out of meta and computes `vars_filled_pct` itself server-side by comparing against the prompt's variable defaults; it does not read an incoming `vars_filled_pct` at all — my own earlier design deliberately strips that key from the input and recomputes it, documented in Phase 1's migration comments. Wiring it exactly as the prompt described would have made every organic run's `meta` contain a `vars_filled_pct` key the RPC ignores, meaning the raw `values` key it actually reads would be absent, so it would always compute 0% filled and the S4 "genuinely filled" bonus (+4) would never fire for anyone, ever. Wired `logPromptRun` to pass `{ values }` instead, matching what the RPC I built actually reads.

**Also went beyond the file list:** the claim-bundle wiring in `lib/claim.ts`. The prompt's text for this step says to call `record_lead_event('claim', promptId, null, {})` once and states "the RPC suppresses the bundled run/preset/follow" — read on its own, that sounds like a single call is enough. But my Prompt-1 RPC only suppresses *scoring* for a bundled event if the caller explicitly reports it with `meta.claim_bundle: true` — it does not synthesize those events on its own from a bare claim call. Skipping the three bundled calls would silently break the ordinal bookkeeping I verified against the spec's own worked example in Prompt 1 (a claimer's first *organic* run would incorrectly score as a "first run" (+8) instead of a "repeat run" (+5), since the claim-bundled run would never be recorded to consume that slot). Added all three bundled calls (`prompt_run`, `preset_saved`, `follow` when a creator id exists) with `claim_bundle: true`, alongside the bare `claim` call — four RPC calls total, matching what the RPC I actually built expects, not the literal one-call reading of the prompt text.

**Scope note on the leads page:** "minimal ... ranked list" per Phase 1's own scoping language. Signal breakdown resolves prompt/pack titles via a follow-up query (the RPCs only return raw ids, and I can't touch the RPC without a migration this run forbids). "Lead #" handle is derived deterministically from the user id (first 6 hex chars) rather than a rank-based number, since rank changes as scores decay and a shifting label would be confusing — spec's "Lead #14" reads as illustrative, not a literal requirement for a small sequential integer.

Vercel: (pending — see below)

---
