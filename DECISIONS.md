# Pergamum — Architecture Decisions

Decisions made during the v2 expansion. Review these if something behaves unexpectedly.

---

## Phase 1 — Schema (migration 0006)

### D-001: `copies` is separate from `views`
`prompts.views` already existed and tracks page/detail views.
`prompts.copies` is a new column tracking explicit "copy prompt" actions via the `/api/prompts/copy` endpoint.
The reputation trigger (`record_prompt_copy`) awards +1 rep to the *original author*, not the copier.

### D-002: Reputation floor is 0
`GREATEST(0, reputation + delta)` is applied everywhere. Reputation can never go negative, even with many downvotes or a removed prompt.

### D-003: Remix rep awarded at publish time, not submit time
`+2` for the remixer and `+3` for the original author are awarded when the remixed prompt transitions to `status = 'published'`, not when it's first submitted. This is consistent with the `+10` publish reward and means pending/draft remixes award nothing.

### D-004: Remix bonus stacks with the publish reward
Publishing a remix gives the author `+10` (standard publish) `+ +2` (remix bonus) = `+12` total. The spec listed these as separate rules; they're both applied in `award_reputation_on_publish`.

### D-005: Badge check uses live DB counts, not cached profile aggregates
`check_badges_for_user` runs `SELECT COUNT(*)` queries rather than reading from `profiles.contribution_count` etc. This avoids race conditions when multiple triggers fire in sequence on the same row. Slightly slower but always correct.

### D-006: Daily comment cap counts *inserted* comments, not rep awards
The trigger counts how many comments the user has inserted today (`created_at >= CURRENT_DATE`). Rep is awarded for the first 10. This is a simple count — there's no separate "rep_comments_today" column. Farming 11+ comments per day just means comments 11+ give no rep.

### D-007: `record_prompt_copy` is an RPC function, not a DB trigger
Copy tracking originates in the application (`/api/prompts/copy`). Moving it to a trigger on a hypothetical `copy_events` table was considered but rejected — the API already has auth validation. The server action calls `supabase.rpc('record_prompt_copy', { p_prompt_id })` after verifying the user is authenticated.

### D-008: `collections.slug` is unique per owner, not globally
`UNIQUE (owner_id, slug)` — two different users can both have a collection named "favourites". Globally unique slugs would require coordination at write time and offer little user benefit.

### D-009: `featured_prompt_id` on profiles uses ON DELETE SET NULL
If an admin removes a user's featured prompt, `featured_prompt_id` silently becomes NULL rather than cascading. No notification to the user — this is acceptable for now.

### D-010: Trigger naming — `votes_award_reputation` fires alongside `votes_sync_counts`
PostgreSQL fires multiple AFTER triggers on the same table alphabetically. `votes_award_reputation` (a) fires before `votes_sync_counts` (s). Since they update different tables (`profiles` vs `prompts`) there is no dependency; order doesn't matter.

### D-011: No backfill of `lifetime_upvotes_received` / `lifetime_copies`
These aggregates start at 0 for all users. Existing vote history is not backfilled. Reputation for pre-migration activity is also not retroactively awarded. This is a clean-slate for the v2 engagement layer.

### D-012: Badge `first_remix` awarded on publish, not on fork
The badge checks `COUNT(*) FROM prompts WHERE forked_from_id IS NOT NULL AND status = 'published'`. Forking a prompt and leaving it in draft does not earn the badge.

---

## Phase 2 and Phase 3 decisions will be added here as they're built.
