# Token Patch — flip the whole system in one edit

Your site already uses shadcn/ui with CSS-variable tokens in `app/globals.css` +
`tailwind.config.ts`. Because every shadcn component reads these variables, updating
them **re-skins the entire app to the source-of-truth system at once** — pure white
surfaces, near-black ink, black-as-accent, one typeface. Do this **first**, before
touching any individual route.

---

## 1. `app/globals.css` — replace the `:root` (light) block

The source-of-truth is a **light** system. Map your current Ink-neutral values to these:

```css
:root {
  /* ── shadcn/ui tokens — light (prmpt source-of-truth) ── */
  --background: 0 0% 100%;          /* was 40 27% 96% (warm paper) → PURE WHITE   */
  --foreground: 240 7% 5%;          /* #0D0D0F near-black ink                      */
  --card: 0 0% 100%;                /* pure white                                  */
  --card-foreground: 240 7% 5%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 7% 5%;

  --primary: 240 7% 5%;             /* was 212 42% 35% (slate) → BLACK IS ACCENT   */
  --primary-foreground: 0 0% 100%;  /* white text on black buttons                */

  --secondary: 0 0% 96%;            /* #F3F3F3 neutral fill                        */
  --secondary-foreground: 240 7% 5%;
  --muted: 0 0% 96%;                /* #F3F3F3                                     */
  --muted-foreground: 250 4% 56%;   /* #8C8A93                                     */
  --accent: 0 0% 96%;               /* #F3F3F3 (hover fills, active nav)           */
  --accent-foreground: 240 7% 5%;

  --destructive: 4 72% 60%;
  --destructive-foreground: 0 0% 100%;
  --success: 153 39% 40%;           /* #3F8F6B — confirmed/positive only           */
  --success-foreground: 0 0% 100%;
  --warning: 39 73% 55%;
  --warning-foreground: 240 6% 8%;

  --border: 0 0% 93%;               /* #ECECEC hairline                            */
  --input: 0 0% 89%;                /* #E4E4E4 input/card border                   */
  --ring: 240 7% 5%;                /* near-black focus ring                       */
  --radius: 0.625rem;               /* was 0.25rem — bump to 10px for the softer,
                                       more "SaaS" rounding you asked for          */

  /* ── design tokens ── */
  --background-subtle: #F3F3F3;     /* was #EDEAE3 warm                            */
  --background-inset:  #EDEDEC;
  --border-strong:     #E4E4E4;
  --foreground-muted:  #3A3A40;
  --foreground-subtle: #8C8A93;
  --accent-glow:       rgba(13, 13, 15, 0.06);
  --grid-line:         rgba(20, 24, 34, 0.08);
}
```

## 2. `.dark` block — keep it, but accent-on-dark becomes WHITE

Dark mode is still used for the video CTA and the onboarding payoff "gift" screen.
Change only the accent so the primary action reads as a **white** button on black
(per the spec's "on dark surfaces, the primary is white"):

```css
.dark {
  --primary: 0 0% 100%;             /* was 212 52% 71% light-blue → WHITE          */
  --primary-foreground: 240 7% 5%;  /* near-black text on white button             */
  --ring: 0 0% 100%;
  /* leave the rest of .dark as-is */
}
```

## 3. `tailwind.config.ts` — collapse to one typeface

The single most defining rule is **one font family**. Point sans/serif/mono at the
same grotesque so hierarchy comes only from size + weight:

```ts
fontFamily: {
  sans:  ["var(--font-hanken)", "system-ui", "sans-serif"],
  serif: ["var(--font-hanken)", "system-ui", "sans-serif"],  // same family
  mono:  ["var(--font-hanken)", "system-ui", "sans-serif"],  // same family
},
```

- Swap the `next/font` wiring in `app/layout.tsx`: replace the Fraunces + JetBrains
  Mono imports with **Hanken Grotesk** (or keep Inter as the single family if you
  prefer zero new fonts — the point is *one*, not *which*). Expose it as
  `--font-hanken`.
- In `globals.css`, change `h1,h2,h3 { @apply font-serif … }` → `@apply font-sans …`.
- Keep the `.label-mono` utility (uppercase + `0.08em` tracking) — it now renders in
  the sans, which is correct. Labels stay "technical" via tracking, not a mono face.

## 4. Retire slate as a content hue

- The `brand` palette (`#34557D` family) in `tailwind.config.ts` can stay defined, but
  **stop using `brand-*` / slate for text, buttons, links, and active states** — those
  are now `primary` (near-black). Reserve any blue strictly for the **ambient gradient
  backdrops** behind floating product shots (see spec §1), never inside content.

## 5. Optional radius per component

`--radius: 0.625rem` (10px) is the new base. Where the mockups use pills (marketing
CTAs, chips) use `rounded-full`; large marketing cards can go `rounded-2xl`.

---

### Result
After steps 1–4, every shadcn `Button`, `Card`, `Input`, `Badge`, `Tabs`, etc. already
renders in the new white/black/one-font system with **no per-component edits**. Then
rebuild the specific routes (see README) to match the mockup layouts.
