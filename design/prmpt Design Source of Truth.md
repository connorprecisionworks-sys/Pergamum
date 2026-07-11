# prmpt — Design Source of Truth

**The landing page (`PrmptKit Landing.dc.html`) and the client-journey video
(`PrmptKit Client Journey v3.dc.html` / `client-journey-v3.jsx`) are the master
reference for all of useprmpt.com** — dashboard, creator tools, prompt/pack pages,
onboarding, auth, marketing. When any other surface disagrees with this document,
this document wins. Build every new page from these rules; retrofit existing ones.

The video is the purest expression of the system — clean, white, one typeface,
minimal, calm. Treat it as the north star.

---

## 0. First principles

1. **Monochrome-first.** Near-black on pure white does 95% of the work. Color is an
   event, not a texture.
2. **One typeface.** Hierarchy comes from size and weight, never from mixing families
   or colors.
3. **Calm and spare.** Generous whitespace, flat surfaces, soft shadows only where
   something truly floats. No glows, no gradients-as-decoration inside content.
4. **Show, don't shout.** Motion reveals; it doesn't perform. Value is delivered before
   anything is asked of the user.
5. **Creator-first, lowercase.** The product is always written **prmpt** (lowercase).
   Copy speaks to the creator earning from their audience.

---

## 1. Color

### Core neutral scale (use everywhere)
| Token | Hex | Use |
|---|---|---|
| Ink | `#0D0D0F` | primary text, primary buttons, the logo tile |
| Ink-soft | `#3A3A40` | secondary text, nav links |
| Muted | `#8C8A93` | labels, meta, captions |
| Faint | `#B7B5BC` | placeholders, disabled, faint meta |
| Hairline | `#ECECEC` | dividers, borders on white |
| Hairline-2 | `#E4E4E4` | input/card borders |
| Paper | `#FFFFFF` | **all content surfaces are pure white** |

### Accent — one job only
- **Ink black `#0D0D0F` is the accent.** Primary actions are a solid black pill/rect
  with white text. Do not introduce a second brand hue into content.
- **Success green `#3F8F6B`** — only for confirmed/positive state (a "Booked" tag, a
  saved tick). Never decorative.

### Ambient gradients (backdrops behind a floating "screen" only — never inside content)
- **Blue↔white** (default premium backdrop):
  `linear-gradient(133deg, #FFFFFF 0%, #F1F6F9 26%, #CFE4EF 60%, #A9D0E3 100%)`
  + a soft white top-left bloom + a faint blue bottom-right bloom + ~10% grain overlay
  (`feTurbulence` baseFrequency 0.82, `mix-blend-mode: overlay`).
- **Purple** (social / phone context only):
  `linear-gradient(155deg, #8072EC 0%, #6E5FE0 46%, #5E50CE 100%)` + grain.
- The floating white screen sits **on** the gradient; the gradient never bleeds into the
  screen's own content.

> **Landing-page reconciliation:** the landing currently uses warm paper `#F7F5F1`,
> ink `#17161A`, and slate `#34557D`/`#8FB3DC`. Migrate toward pure white `#FFFFFF`
> surfaces, ink `#0D0D0F`, and the black accent. The blue↔white gradient already
> appears in the "reach the leads" finale and the video band — extend that, retire the
> slate accent as a text/CTA color.

---

## 2. Typography

**One family, everywhere.** The video uses a Söhne-style neutral grotesque. On the web
use **Hanken Grotesk** (already loaded on the landing) as the single family for
headings, body, labels, and numerals. **Drop the serif (Newsreader) and the mono
(IBM Plex Mono).** No serif accents, no mono labels, no second font.

Hierarchy = size + weight only:

| Role | Weight | Size (desktop) | Tracking |
|---|---|---|---|
| Display / hero | 600 | 74–116px | -0.035em |
| Page title (h1) | 600 | 40–54px | -0.03em |
| Section head (h2) | 600 | 28–40px | -0.02em |
| Body | 400–500 | 15–18px | normal |
| Small label / meta | 500 | 11–14px, UPPERCASE, +0.08–0.12em | — |

Rules:
- **No two-color text**, no italic-as-accent, no gradient text — with **one exception**:
  a single hero keyword may use the washed-out **oil-slick iridescent** fill
  (`linear-gradient(100deg,#a9c7ff,#f7c9ec,#c3f0dd,#fff0bf,#dcc4ff,#a9c7ff)`, clipped to
  text, slow shimmer). Use it once per page, maximum.
- Numerals and labels that used mono now use Hanken with letter-spacing; keep them
  uppercase + tracked so they still read as "technical."

---

## 3. Shape, depth, spacing

- **Radii:** desktop app screen `26px`; phone screen `46–52px`; cards `12–16px`;
  buttons `11–12px` (or full pill `9999px` for marketing CTAs); inputs/chips `10–12px`.
- **Flat fills.** Elevation only for elements that genuinely float:
  - Floating screen on gradient: `0 2px 6px rgba(28,30,40,.06), 0 30px 60px rgba(28,30,40,.14), 0 80px 140px rgba(28,30,40,.18)`.
  - Cards/popovers: `0 12–20px 34–50px rgba(28,30,40,.12–.16)`.
- **No glows, no inner-shadow bevels, no borders-as-decoration.** A 1px hairline
  (`#ECECEC`) separates; it doesn't ornament.
- **Whitespace is the primary layout tool.** When in doubt, add space, remove lines.

### App chrome (dashboard, prompt page, builder, library)
- Left **sidebar** on white with a hairline right border: logo (P mark + lowercase
  `prmpt`), nav items (`Home / Browse / Library / Following`), active item on a light
  `#F3F3F3` fill, user chip pinned to the bottom.
- **Top bar**, 64px, hairline bottom border: breadcrumb on the left, a quiet pill search
  on the right.
- Content lives on pure white with clear zone separation (hairline dividers + generous
  gaps), never dense.

---

## 4. The "floating screen" presentation (marketing + video)

Any time we *show the product* in marketing or the film:
- Render the app inside a single rounded-corner surface with **all four corners
  visible**, floating on an ambient gradient.
- Add a slow idle **lift** (±4–6px sine) and a tiny tilt so it feels alive.
- **Camera pushes into the region that matters** (a field being filled, the Copy button,
  one dashboard row) via animated `scale` + `transform-origin`, then eases back.
- Phone contexts use the purple gradient + a real **iOS status bar** (dynamic-island
  pill, time, signal/wifi/battery).

---

## 5. Motion & interaction

- **Typewriter statements:** type on pure white, steady one-character cadence
  (use `Math.floor` on progress so it never jitters), **no blinking caret**, soft
  mechanical **key-click** sound per character. Reserve for short declarative lines.
- **Key-click sound:** low sine "thump" + bandpass noise "clack," ~0.03–0.08s, only
  when the surface is focused/visible (`document.hasFocus()` / not `document.hidden`).
- **Scroll-to-start:** embedded video/animation stays on its first frame and begins from
  `t=0` only when ≥55% in view (IntersectionObserver). It should read like an animation
  that plays as you arrive.
- **Minimal media controls:** two frosted circular ghost buttons, bottom-right —
  **restart (↺)** and **play/pause** — `62px`, `rgba(255,255,255,.72)` +
  `backdrop-filter: blur(6px)`, `1px rgba(20,24,34,.10)` border, muted-grey icons,
  `0 4px 14px rgba(28,30,40,.10)` shadow. No full scrubber chrome in-page.
- **Reveals:** fade + `translateY(12–16px)` on a `cubic-bezier(.2,.7,.2,1)` ~0.6s, small
  stagger for lists. Nothing bounces hard.
- **Magnetic primary button** (marketing): leans a few px toward the cursor, springs
  back. Optional, tasteful.

---

## 6. Components

- **Primary button:** solid Ink `#0D0D0F`, white text, weight 600; pill (`9999px`) in
  marketing, `11–12px` radius in-app. Height 44–58px.
- **Secondary:** transparent with a `#E4E4E4` hairline, ink text. Never a second color.
- **Chips (roles, needs, tags):** `10px` radius; selected = solid Ink + white; unselected
  = hairline border + ink-soft text. Multi-select, always skippable in onboarding.
- **Fill-in field (prompt variables):** inline pill; filled = white fill + `#E4E4E4`
  border + ink text; active = 2px Ink border + `rgba(13,13,15,.10)` focus ring;
  empty = dashed `#D8D8D8` + faint placeholder.
- **Cards (packs/prompts/leads):** white, hairline border, `12–16px` radius, soft shadow
  only if lifted. Metadata in muted uppercase.
- **Nudge / creator offer:** contained, labeled ("Office hours · @creator"), dismissible,
  lives where hearing from a creator is expected — never blocks the prompt or a run.

---

## 7. Voice & copy

- Product name is **prmpt**, always lowercase.
- **Creator-first**: lead with the creator's transformation ("Turn comment ‘PROMPT’ into
  booked clients"). The buyer/library is the quiet secondary door.
- **Frictionless for the client**: they get and use the prompt automatically; sign-up
  comes *after*, framed as a benefit ("save it & get new prompts free — or skip").
- Editorial-but-technical, spare. No hype adjectives, no exclamation points, no emoji in
  UI, no "marketplace"/"trending"/star-rating language.
- Real numbers only. Uppercase tracked labels for metadata.

---

## 8. Per-page application checklist

Apply §1–§7 to each surface:

- **Landing** — unify to Hanken Grotesk (done first); migrate warm paper → pure white +
  black accent; keep blue↔white gradient behind floating product shots; scroll-to-start
  video with minimal controls (done).
- **Discovery / Browse** — white, editorial, no ratings/badges; one search field; large
  category index; quiet real-number proof line.
- **Prompt page** — floating-screen treatment in marketing; in-app: white workspace,
  inline fill fields, black Copy + model launchers, post-copy creator note (calm,
  dismissible).
- **Pack page** — album-style tracklist, auto-cover, mono-style (now Hanken) metadata
  line, one black primary CTA.
- **Dashboard (creator)** — sidebar + top bar chrome; big black metric numerals; live
  leads with role/seniority/need; zoom-worthy insight rows; contained office-hours offer.
- **Library (client)** — clean zones (recent runs, packs, presets/history, following,
  singles); minimal; good empty states.
- **Onboarding** — mobile-first welcome; role/seniority/need chips; frictionless;
  payoff screen; all steps skippable.
- **Auth** — white, single field stack, black button, benefit-framed.

---

## 9. Do-not list

- ❌ A second brand color in content (retire slate as a text/CTA hue).
- ❌ Serif or monospace as a second typeface.
- ❌ Two-color or italic "accent" words (except the one hero oil-slick keyword).
- ❌ Glows, heavy gradients inside content, decorative borders, faux-3D bevels.
- ❌ Full video scrubber chrome embedded in a page (use the two minimal circles).
- ❌ Autoplaying media before it is scrolled into view.
- ❌ Capitalized "Prmpt" / "PrmptKit" wordmark.
- ❌ Emoji, exclamation points, or hype adjectives in UI copy.
