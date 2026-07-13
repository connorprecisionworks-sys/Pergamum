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

**Commit:** (pending — see below)
**Files:** `app/(app)/layout.tsx`, `lib/supabase/post-auth-redirect.ts`, `app/auth/callback/route.ts`, `lib/claim.ts`, `app/welcome/page.tsx` (new), `app/welcome/actions.ts` (new), `components/welcome/welcome-picker.tsx` (new), `app/(app)/dashboard/profile/actions.ts`, `app/(app)/dashboard/profile/become-creator-button.tsx` (new), `app/(app)/dashboard/profile/page.tsx`, `lib/types/database.ts` (added `AccountType` alias)

Built the three-lane gate, `/welcome` (server guard + client picker that short-circuits claimers without clearing their pending claim — `ClaimReconciler` still needs to read it later), `chooseAccountType`, the `claimPendingState` belt-and-suspenders write, and the "Turn on creator tools" settings toggle.

**Judgment call, the important one:** the prompt only named `app/(app)/layout.tsx` as needing the three-branch gate. But `postAuthDestination` (the function `AuthForm`'s login/signup submit handlers call directly, used by both the plain `/auth/signup` landing page and every pack/prompt-triggered auth dialog) and `app/auth/callback/route.ts` (the OAuth/email-confirmation path) are *separate* code paths that only ever checked `onboarding_complete`, with no idea `account_type` exists. Traced the full call chain (`auth-form.tsx` → `postAuthDestination` → `router.push`) before concluding this: left as the prompt described it, every brand-new signup — including a plain landing-page one with no claim — would have skipped `/welcome` entirely, landed straight in the client onboarding flow, and only seen the picker (confusingly, after already profiling as a client) on their *next* navigation into `(app)`. Extended both functions with the same three-branch check the gate uses, sharing the same `next`-preserving pattern the hotfix established. Worth confirming this reads right — it's the one place I went meaningfully beyond the prompt's literal file list.

**Also added:** a server-side idempotency guard inside `chooseAccountType` itself (re-checks `account_type IS NULL` before writing) rather than trusting the client-side "already set → redirect away" guard alone — the spec's "no back-door re-pick" rule should hold even against a replayed or malformed action call, not just the happy-path UI.

**Known gap until Phase 3 lands:** `/creator/onboarding` doesn't exist yet, so between this deploy and Phase 3's, a user picking "I'm here to get clients" hits a 404. Expected per `CREATOR-ONBOARDING-SPEC.md`'s own build order (Phase A ships before Phase B); Phase 3 follows immediately in this run.

Vercel: (pending — see below)

---
