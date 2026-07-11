# Handoff: prmpt site — full design-system rollout

## Overview
This package rolls the **prmpt design source-of-truth** (defined by the landing page and
the client-journey video) across the whole product: marketing landing, client onboarding,
the client library / prompt workspace, and the creator dashboard. The look is
**monochrome-first**: pure-white surfaces, near-black ink, black-as-accent, **one
typeface**, generous whitespace, flat with soft shadows, subtle motion.

## About the design files
The files in `mockups/` are **design references built in HTML** — prototypes that show the
intended look and behavior, **not production code to paste in**. Your task is to **recreate
them in the existing codebase** (Next.js App Router + Tailwind + shadcn/ui) using its
established patterns. `.dc.html` files open directly in a browser to view; the video is a
React component (`client-journey-v3.jsx` + `animations.jsx`).

Read `prmpt Design Source of Truth.md` first — it is the canonical spec. Then apply
`TOKENS-PATCH.md`, then rebuild routes.

## Fidelity
**High-fidelity.** Colors, type scale, spacing, radii, and interactions are final.
Recreate pixel-close using your shadcn components + Tailwind tokens.

---

## Implementation order (do it in this sequence)

### Step 0 — Token swap (biggest leverage, ~1 file)
Apply **`TOKENS-PATCH.md`** to `app/globals.css` + `tailwind.config.ts` + `app/layout.tsx`.
This re-skins every shadcn component to white/black/one-font at once. Verify the app still
builds and spot-check a few existing pages before rebuilding routes.

### Step 1 — Marketing landing → `app/(marketing)/…`
Reference: `mockups/PrmptKit Landing.dc.html`.
- Sticky nav: 3-column grid (logo left / centered links / actions right), lowercase
  **prmpt** wordmark, black "Get started" pill.
- Hero: giant headline "Turn comment "PROMPT" into booked clients" — the quoted keyword
  is a **typewriter** cycling PROMPT → CLAUDE → SKILL → … (types, holds ~1s, backspaces;
  no caret). Right side: a liquid-glass product panel tilted on a slight 3D angle that
  reacts to pointer (magnetic tilt + specular highlight tracking cursor).
- **Demo video band, full-bleed**, edge-to-edge (see Step 4).
- Benefits section "A prompt store sells files. prmpt books clients." — 4 numbered
  benefits + an "old way / prmpt way" contrast.
- Finale "Reach the leads your prompts earn." — light **blue↔white gradient** backdrop
  with a **frosted glass card**; scroll-reveal of children; magnetic primary button; a
  faux cursor renders *behind* the glass while the button stays clickable.

### Step 2 — Onboarding → `app/onboarding/…`
Reference: `mockups/Prmpt Client Onboarding.dc.html` (mobile-first + desktop variants).
- Runs **after** first prompt use — a welcome, not a signup; every step skippable.
- 1) Toolbox welcome (the just-used prompt already saved), 2) role + seniority chips,
  3) need chips + free-text, 4) payoff (dark "gift" screen: matched packs + creators to
  follow, "Matched to …" tokens).
- Chips: selected = solid black + white + ✓; unselected = hairline border.

### Step 3 — Client library + prompt workspace + creator nudge → `app/(app)/…`, `app/packs/…`
Reference: `mockups/PrmptKit User Screens.dc.html`.
- **Prompt workspace:** white doc, inline fill-in variable fields, black **Copy** +
  model launchers, "N of 3 fields filled" line.
- **Post-copy creator note:** calm, single light card that slides in with a human line +
  "Book 30 min" / "Keep & follow" + an × to dismiss (shown once). Not a dark takeover.
- **Library/dashboard:** sidebar (`Home / Browse / Library / Following`, active on
  `#F3F3F3`) + hairline top bar with breadcrumb + pill search; clean zones (recent runs,
  packs, presets/history, following, singles) with hairline dividers + generous gaps.
- **Creator "office hours" offer:** contained + labeled + dismissible, living inside the
  "From creators you follow" column — never blocking a prompt or a run.

### Step 4 — The client-journey video (marketing embed)
Reference: `mockups/PrmptKit Client Journey v3.dc.html`, `client-journey-v3.jsx`,
`animations.jsx`.
- It is a self-contained React timeline component. Two integration options:
  1. **Render to .mp4** (the Stage has a video-export path) and use a plain autoplaying
     `<video>` — simplest for production.
  2. **Port the component** into the app (it's React; `animations.jsx` is the engine).
- Required behaviors to preserve (see spec §4–5): floating "screen" on ambient gradient
  with all four rounded corners; camera push-ins; **typewriter** statement cards on white
  with a soft key-click; the iridescent oil-slick keyword; **scroll-to-start** (plays from
  t=0 only when ≥55% in view); **full-bleed** edge-to-edge; **minimal controls** = two
  frosted circular ghost buttons bottom-right (restart ↺ + play/pause), no scrubber chrome.
- Note: the mockups deliberately use an **original** clean white UI (not a copy of any
  product's chrome). Keep it original.

---

## Design tokens (summary — full values in `TOKENS-PATCH.md`)
- **Surfaces:** pure white `#FFFFFF`. Canvas behind floating shots: `#EDEDEC`.
- **Ink:** `#0D0D0F` · soft `#3A3A40` · muted `#8C8A93` · faint `#B7B5BC`.
- **Hairlines:** `#ECECEC` / `#E4E4E4`.
- **Accent:** black `#0D0D0F` (white on dark surfaces). **Success:** `#3F8F6B` only.
- **Gradients (backdrops only):** blue↔white
  `linear-gradient(133deg,#FFFFFF,#F1F6F9 26%,#CFE4EF 60%,#A9D0E3)`;
  purple (phone/social) `linear-gradient(155deg,#8072EC,#6E5FE0 46%,#5E50CE)`; +~10% grain.
- **Type:** one grotesque (Hanken Grotesk recommended); hierarchy via size+weight only;
  display -0.035em tracking, uppercase tracked labels.
- **Radius:** base 10px; pills for CTAs/chips.
- **Motion:** reveals = fade + translateY(12–16px) on `cubic-bezier(.2,.7,.2,1)` ~0.6s;
  typewriter (floor-stepped, no caret, key-click); scroll-to-start; magnetic button.

## Voice & copy
Product is **prmpt** (lowercase, always). Creator-first ("turn comment into booked
clients"); library is the quiet secondary door. Client gets/uses the prompt with **zero
friction**; sign-up comes after, framed as a benefit. Spare, editorial-but-technical; no
hype, no emoji, no exclamation points, real numbers only.

## Assets
- `mockups/src/logo-white.png` — the P mark (white glyph; invert for black-on-white; the
  wordmark is lowercase text "prmpt", not baked into the image).
- `mockups/src/pack-cover.png` — sample pack cover used in the video's Instagram post.
- `image-slot.js` / `support.js` — runtime for the HTML mockups only; **not** for the app.

## Files in this package
- `prmpt Design Source of Truth.md` — canonical spec (read first).
- `TOKENS-PATCH.md` — exact globals.css / tailwind / layout edits (apply first).
- `mockups/PrmptKit Landing.dc.html` — landing.
- `mockups/Prmpt Client Onboarding.dc.html` — onboarding (mobile + desktop).
- `mockups/PrmptKit User Screens.dc.html` — prompt workspace, post-copy note, library.
- `mockups/PrmptKit Client Journey v3.dc.html` (+ `client-journey-v3.jsx`,
  `animations.jsx`) — the demo video.
- `mockups/src/…`, `image-slot.js`, `support.js` — assets + mock runtime.

---

## Ready-to-run Claude Code prompt
Paste this into a Claude Code session opened **in the Pergamum repo**, with this handoff
folder available:

> Read `design_handoff_prmpt_site/prmpt Design Source of Truth.md` and
> `design_handoff_prmpt_site/TOKENS-PATCH.md`. First apply the token patch to
> `app/globals.css`, `tailwind.config.ts`, and `app/layout.tsx` (switch to one typeface),
> then run `pnpm check` and confirm the app still builds and existing pages render on the
> new white/black system. Then, one route at a time, rebuild `app/(marketing)`,
> `app/onboarding`, `app/(app)`, and `app/packs` to match the HTML mockups in
> `design_handoff_prmpt_site/mockups/` using our existing shadcn components — no inline
> hex, use the tokens. Keep the wordmark lowercase "prmpt". Show me a diff per route
> before committing; do not push until I approve each.
