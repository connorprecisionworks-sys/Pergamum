# Buddy System — Concept Proposals

Three creature concepts for the Pergamum buddy system. Each is designed as layered SVG, dark-mode first, literary in theme, and scalable from a 48px badge to a 300px profile display. No emojis. No cartoon faces. Each concept is intended to feel like a sigil, a mark, or a familiar in the older sense of the word.

---

## Concept A — The Palimpsest

### Description

The Palimpsest is a living manuscript seal — a geometric spirit that takes form when a scribe's intent crystallizes across layers of erased and rewritten text. It begins as a single circle with a barely-visible latent glyph at center, and grows through four stages into a complete instrument: concentric rings annotated like an astrolabe, a hexagram inscribed between them, and a central rune unique to its owner. It does not have eyes or limbs. It rotates slowly when idle. It feels less like a pet and more like a hallmark — a sigil that marks the quality of your work.

The name is a deliberate reference. Pergamum (the ancient city this app is named for) is the origin of parchment — pergamon — the very material that made palimpsests possible: manuscripts scraped and rewritten, the old text bleeding through beneath the new. This creature *is* that material, made animate.

### SVG Sketch — Adult, Common Rarity

```svg
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#0a0a0f"/>
  <!-- Outer decorative ring -->
  <circle cx="50" cy="50" r="43" stroke="#2d1959" stroke-width="0.75"/>
  <!-- 12 tick marks at 30° intervals, straddling the outer ring -->
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(0,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(30,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(60,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(90,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(120,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(150,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(180,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(210,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(240,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(270,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(300,50,50)"/>
  <line x1="50" y1="5" x2="50" y2="11" stroke="#c4b5e8" stroke-width="1.25" transform="rotate(330,50,50)"/>
  <!-- Middle ring -->
  <circle cx="50" cy="50" r="34" stroke="#9370db" stroke-width="0.75" opacity="0.7"/>
  <!-- Hexagram: outer r=26, inner r=13, 12 alternating points -->
  <polygon
    points="50,24 56.5,38.7 72.5,37 63,50 72.5,63 56.5,61.3 50,76 43.5,61.3 27.5,63 37,50 27.5,37 43.5,38.7"
    stroke="#9370db" stroke-width="1" fill="none"/>
  <!-- Inner hexagon from the star's 6 inner vertices -->
  <polygon
    points="56.5,38.7 63,50 56.5,61.3 43.5,61.3 37,50 43.5,38.7"
    stroke="#c4b5e8" stroke-width="0.75" fill="none" opacity="0.45"/>
  <!-- Central rune: vertical stroke -->
  <line x1="50" y1="40" x2="50" y2="58" stroke="#c4b5e8" stroke-width="1.75" stroke-linecap="round"/>
  <!-- Central rune: right arc (D-form) -->
  <path d="M50,40 C59,40 61,45 61,49 C61,53 59,57 50,57"
        stroke="#c4b5e8" stroke-width="1.75" fill="none" stroke-linecap="round"/>
  <!-- Accent binding dot below rune -->
  <circle cx="50" cy="61.5" r="1.75" fill="#9370db"/>
</svg>
```

### Growth Stages
- **Egg**: A single circle (r=43), dim, with only the center accent dot visible. No tick marks, no inner geometry. Feels like a dormant seal.
- **Nestling**: The middle ring appears. The central rune gains its vertical stroke — one line, no arc yet. 4 tick marks at 90° intervals.
- **Juvenile**: The hexagram appears between the two rings. The central rune gains the D-arc. 8 tick marks.
- **Adult**: Full form. 12 tick marks, complete hexagram, inner hexagon, complete rune, accent dot. The outer ring at this stage gains a very subtle rotation animation (CSS transform, 120s cycle, reduced-motion respecting).

### Rarity Tiers
- **Common**: Monochrome. All strokes in muted lavender (#c4b5e8). No fill anywhere. Accent dot in #9370db.
- **Uncommon**: Warm sepia shift. Tick marks and rune in #e8c98a (manuscript ink amber). Inner hexagon faintly filled with #14100f.
- **Rare**: Silver-white primary strokes (#e8e8f4). Inner hexagon has a subtle radial gradient fill (center: #1e1a30 → edge: transparent). Tick marks slightly longer.
- **Epic**: Full Pergamum violet (#9370db) on all strokes. Central rune filled solid. The outer ring has a faint ambient radial glow (SVG filter: feGaussianBlur + feComposite).
- **Legendary**: Gold primary strokes (#c9a227). A second 12-pointed star layer appears behind the hexagram at 15° rotation. Inner hexagon has a warm gold radial glow. Outer ring tick marks alternate gold/silver. The rotation animation runs at 60s (twice as fast).

---

## Concept B — The Vellum Wyrm

### Description

The Vellum Wyrm is a small serpentine dragon whose scales are individual manuscript leaves — thin vellum pages, each one a different size, overlapping like shingles on a roof. The body is sinuous and grows longer with each stage. At the egg stage it is a simple ovoid with faint scale-lines pressed against the inside of the shell. At adult stage it is a fully-realized serpent coiled around an invisible manuscript, its head crowned with a small horn made from a rolled quill, its tail tapering into a fraying scroll edge. The scales closest to the head bear fine text; the ones toward the tail are blank — the unwritten pages of work yet to come.

This concept has the strongest heraldic quality. A wyrm in medieval manuscripts was the simplest form of dragon — no legs, no wings, pure serpent — and they appear in the margins of illuminated texts as decorative guardians. The Vellum Wyrm is that creature, miniaturized and made personal.

### SVG Sketch — Adult, Common Rarity

```svg
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#0a0a0f"/>
  <!-- Body shadow/outline (slightly thicker, darker) -->
  <path d="M16,82 C24,60 30,52 50,50 C70,48 76,40 84,18"
        stroke="#1a0f35" stroke-width="12" stroke-linecap="round" fill="none"/>
  <!-- Body fill -->
  <path d="M16,82 C24,60 30,52 50,50 C70,48 76,40 84,18"
        stroke="#b8a0d8" stroke-width="9" stroke-linecap="round" fill="none"/>
  <!-- Scale marks: perpendicular lines along the body at 7 intervals -->
  <!-- Near tail (body dir ≈ -70°, mark at +20°) -->
  <line x1="22" y1="67" x2="22" y2="77" stroke="#e0d8f0" stroke-width="1"
        transform="rotate(-70,22,72)" opacity="0.7"/>
  <line x1="31" y1="57" x2="31" y2="67" stroke="#e0d8f0" stroke-width="1"
        transform="rotate(-55,31,62)" opacity="0.7"/>
  <!-- Near mid-body (body dir ≈ -30°) -->
  <line x1="40" y1="48" x2="40" y2="58" stroke="#e0d8f0" stroke-width="1"
        transform="rotate(-25,40,53)" opacity="0.7"/>
  <!-- At midpoint (body dir ≈ 0°, mark is vertical) -->
  <line x1="50" y1="45" x2="50" y2="55" stroke="#e0d8f0" stroke-width="1" opacity="0.7"/>
  <!-- Near head (body dir ≈ +30°) -->
  <line x1="62" y1="43" x2="62" y2="53" stroke="#e0d8f0" stroke-width="1"
        transform="rotate(30,62,48)" opacity="0.7"/>
  <line x1="72" y1="33" x2="72" y2="43" stroke="#e0d8f0" stroke-width="1"
        transform="rotate(55,72,38)" opacity="0.7"/>
  <line x1="80" y1="22" x2="80" y2="32" stroke="#e0d8f0" stroke-width="1"
        transform="rotate(70,80,27)" opacity="0.7"/>
  <!-- Head: angular wedge (body ends at ~85,18, pointing upper-right) -->
  <polygon points="80,16 90,16 86,28 78,24" fill="#b8a0d8"/>
  <!-- Head: back-swept frill/horn -->
  <path d="M80,16 C76,11 73,9 76,7" stroke="#9370db" stroke-width="1.5"
        fill="none" stroke-linecap="round"/>
  <!-- Head: eye slit -->
  <line x1="83" y1="19" x2="87" y2="18" stroke="#0a0a0f" stroke-width="1.5"
        stroke-linecap="round"/>
  <!-- Tail spiral -->
  <path d="M16,82 C13,87 10,90 13,91 C16,92 19,89 17,86"
        stroke="#9370db" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <!-- Belly line (central spine suggestion) -->
  <path d="M18,80 C26,60 32,52 50,50 C68,48 74,40 82,20"
        stroke="#2d1959" stroke-width="1" fill="none" opacity="0.6"/>
</svg>
```

### Growth Stages
- **Egg**: A rounded ovoid (tall ellipse). Scale-lines faintly pressed against the inside of the shell visible as a texture. A single curved line through the center suggests the coiled body within.
- **Nestling**: The wyrm is small, coiled tightly in a spiral — only about 2 full turns visible. Head barely distinguishable. Scales present but undetailed.
- **Juvenile**: The body is a clear S-curve, 3/4 of the adult length. Head clearly formed with basic frill. Tail has begun to spiral. 5-6 scale marks.
- **Adult**: Full S-curve from lower-left to upper-right. 7 scale marks. Complete head with horn and eye. Tail fully spiraled. Belly line detail.

### Rarity Tiers
- **Common**: Lavender-grey body (#b8a0d8). White-grey scale marks (#e0d8f0). Dark purple accents.
- **Uncommon**: Warm parchment body color (#d4bc8a). Scale marks in aged vellum (#ecdbb0). Eye rendered as an amber slit.
- **Rare**: Body in cool silver (#c8d4e0). Scales have a light blue-white sheen. Eye becomes a small diamond shape.
- **Epic**: Body in deep violet (#7447d1) with lavender scale marks. Faint glow on scale marks (feGaussianBlur filter). The horn/frill gains a second parallel spike.
- **Legendary**: Body in burnished gold (#c9a227) with bright gold scale marks. A fine line of text (lorem-ipsum-style path text) runs along the belly. Tail spiral gains an extra turn. Eye glows amber.

---

## Concept C — The Codex

### Description

The Codex is an ink sprite: a small entity that condensed out of the accumulated intent of a library's worth of writing. Its body is a ribbon of flowing ink that has hardened into a coherent form — torso and trailing lower body, no legs, no wings. The head is an ink drop: a rounded dome above, narrowing to a point below, which connects directly to the ribbon body. Faint lines of manuscript text run across the ribbon, like rulings on parchment. Below the ribbon, three trailing wisps fade into nothing — the evaporating excess of every draft ever abandoned.

The Codex is the most figurative of the three concepts. It reads immediately as a small person or sprite when seen at full size, but at 48px it collapses to a clean silhouette: drop head, narrow ribbon body, trailing wisps. It has minimal facial marks — two short dashes where eyes would be — just enough to imply awareness without cartoon expression.

### SVG Sketch — Adult, Common Rarity

```svg
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#0a0a0f"/>
  <!-- Head: ink-drop shape (dome top, pointed bottom) -->
  <path d="M40,22 C38,16 42,10 50,10 C58,10 62,16 60,22 L50,36 Z"
        fill="#c4b5e8"/>
  <!-- Eye marks: two short dashes (not circles) -->
  <line x1="43" y1="19" x2="46" y2="19" stroke="#0a0a0f" stroke-width="1.75"
        stroke-linecap="round"/>
  <line x1="54" y1="19" x2="57" y2="19" stroke="#0a0a0f" stroke-width="1.75"
        stroke-linecap="round"/>
  <!-- Ribbon body: filled path between two curved edges -->
  <path d="M44,36 C40,52 42,66 44,82 L56,82 C58,66 60,52 56,36 Z"
        fill="#1e1330" stroke="#9370db" stroke-width="0.75" opacity="0.9"/>
  <!-- Ribbon left highlight edge -->
  <path d="M44,36 C40,52 42,66 44,82"
        stroke="#c4b5e8" stroke-width="0.5" fill="none" opacity="0.4"/>
  <!-- Manuscript text lines across the ribbon body -->
  <line x1="44" y1="42" x2="56" y2="42" stroke="#6b4fa3" stroke-width="0.5"
        stroke-dasharray="1.5 2" opacity="0.6"/>
  <line x1="43" y1="48" x2="57" y2="48" stroke="#6b4fa3" stroke-width="0.5"
        stroke-dasharray="1.5 2" opacity="0.6"/>
  <line x1="43" y1="54" x2="57" y2="54" stroke="#6b4fa3" stroke-width="0.5"
        stroke-dasharray="1.5 2" opacity="0.6"/>
  <line x1="43" y1="60" x2="57" y2="60" stroke="#6b4fa3" stroke-width="0.5"
        stroke-dasharray="1.5 2" opacity="0.5"/>
  <line x1="43" y1="66" x2="57" y2="66" stroke="#6b4fa3" stroke-width="0.5"
        stroke-dasharray="1.5 2" opacity="0.4"/>
  <line x1="44" y1="72" x2="56" y2="72" stroke="#6b4fa3" stroke-width="0.5"
        stroke-dasharray="1.5 2" opacity="0.3"/>
  <line x1="44" y1="78" x2="56" y2="78" stroke="#6b4fa3" stroke-width="0.5"
        stroke-dasharray="1.5 2" opacity="0.2"/>
  <!-- Trailing wisps below ribbon -->
  <path d="M44,82 C41,88 38,93 35,97"
        stroke="#9370db" stroke-width="0.75" fill="none" opacity="0.55"
        stroke-linecap="round"/>
  <path d="M50,82 C50,88 49,93 50,97"
        stroke="#9370db" stroke-width="0.75" fill="none" opacity="0.4"
        stroke-linecap="round"/>
  <path d="M56,82 C59,88 62,93 65,97"
        stroke="#9370db" stroke-width="0.75" fill="none" opacity="0.25"
        stroke-linecap="round"/>
</svg>
```

### Growth Stages
- **Egg**: A simple vertical oval (tall ellipse) with three faint horizontal lines inside — manuscript rulings visible through the shell. The pointed bottom of the egg already hints at the drop-head shape to come.
- **Nestling**: The head emerges from the top of the egg but the ribbon body is very short (extends only to y≈55). No trailing wisps yet. Eyes visible. 3 text lines.
- **Juvenile**: Full head. Ribbon body extends to y≈70. One trailing wisp, faint. 5 text lines. The ribbon is narrower than the adult.
- **Adult**: Full form. Complete ink-drop head. Ribbon to y=82. Three trailing wisps at decreasing opacity. 7 text lines, fading toward the bottom.

### Rarity Tiers
- **Common**: Head in muted lavender (#c4b5e8). Ribbon outline in Pergamum violet (#9370db). Text lines in #6b4fa3. Wisps in #9370db at low opacity.
- **Uncommon**: Head in warm amber-white (#e8dbb0). Ribbon outline in amber (#c8a050). Text lines visible as actual glyph-like dashes (longer, more structured). Wisps in warm amber.
- **Rare**: Head in cool silver (#e0e8f4). Ribbon has a second, fainter parallel edge (double-outline effect). Text lines are brighter. A small glint mark on the top of the head.
- **Epic**: Head in deep violet (#9370db), filled. Ribbon fill is a radial gradient: center #3d2880 → edge #1e1330. Text lines in bright lavender. Wisps are longer (extend to y=105). A faint halo ring around the head.
- **Legendary**: Head in gold (#c9a227). Ribbon outline in gold. Text lines are golden ink. Wisps extend off-canvas and have a feathered glow effect (SVG filter). A second pair of shorter wisps at the head (upward), suggesting bidirectional flow — the creature reads and writes simultaneously.

---

## How to Decide

| Criterion | Palimpsest | Vellum Wyrm | Codex |
|---|---|---|---|
| Reads as "familiar / sigil" | Strongest | Good (heraldic) | Moderate (more sprite) |
| Works at 48px | Good (concentric rings + dot) | Moderate (head + body) | Good (drop + wisp silhouette) |
| Literary reference depth | Very deep (palimpsest, parchment, Pergamum) | Deep (illuminated margins) | Moderate (ink, manuscript) |
| Rarity tier differentiability | Excellent (color + geometry layers) | Excellent (scale detail + color) | Excellent (color + wisp length) |
| Build complexity (SVG) | Lowest (pure geometry) | Medium | Medium |
| Animation potential | High (rotation, pulsing rings) | Medium (idle sway) | High (wisp drift, text scroll) |

The three above are now locked to Common / Uncommon / Rare respectively. Phase 1a below adds Epic and Legendary.

---

## Concept D — The Illuminator (Epic)

### Description

The Illuminator is a moth whose wings are illuminated manuscript folios — divided into panels like the pages of a medieval book of hours, each panel bearing a miniature scene in the tradition of historiated initials: a rosette window, a pointed arch, a block of ruled text. The wing veins are the column rules of the manuscript; the body is the spine. Its antennae end in split quill feathers — the forked tip of a freshly cut pen nib. At rest with wings folded, it looks like a small closed book. At full display, it opens into something that should be behind glass in a scriptorium.

The Illuminator sits above the Palimpsest precisely because it contains the Palimpsest's logic — compartmentalized geometry, sacred form — but set within a living creature. The Palimpsest is pure mathematics; the Illuminator is what happens when a master illuminator spends a lifetime making mathematics beautiful. Its wing panels are the direct heir to the Palimpsest's inner hexagon, but now inhabited, figurative, warm. Where Rare is achieved through discipline, Epic is achieved through that discipline flowering into something else.

### SVG Sketch — Adult Form

```svg
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#0a0a0f"/>
  <!-- Body -->
  <path d="M47,35 C45,42 45,58 47,70 C48,73 52,73 53,70 C55,58 55,42 53,35 Z" fill="#c4b5e8"/>
  <!-- Head -->
  <circle cx="50" cy="30" r="5" fill="#c4b5e8"/>
  <!-- Upper right wing -->
  <path d="M51,40 C56,33 73,26 86,31 C94,36 92,51 83,58 C75,63 62,59 55,53 C53,51 51,48 51,40 Z"
        fill="#1e1330" stroke="#9370db" stroke-width="0.75"/>
  <!-- Upper left wing -->
  <path d="M49,40 C44,33 27,26 14,31 C6,36 8,51 17,58 C25,63 38,59 45,53 C47,51 49,48 49,40 Z"
        fill="#1e1330" stroke="#9370db" stroke-width="0.75"/>
  <!-- Panel division lines — right wing -->
  <path d="M64,28 C66,40 66,54 64,58" stroke="#6b4fa3" stroke-width="0.6"/>
  <path d="M78,33 C80,43 79,54 77,58" stroke="#6b4fa3" stroke-width="0.6"/>
  <!-- Panel division lines — left wing -->
  <path d="M36,28 C34,40 34,54 36,58" stroke="#6b4fa3" stroke-width="0.6"/>
  <path d="M22,33 C20,43 21,54 23,58" stroke="#6b4fa3" stroke-width="0.6"/>
  <!-- Right wing panel 1: rosette window -->
  <circle cx="57" cy="45" r="3.5" stroke="#c4b5e8" stroke-width="0.5" fill="none" opacity="0.55"/>
  <circle cx="57" cy="45" r="1.2" fill="#9370db" opacity="0.5"/>
  <line x1="57" y1="41.5" x2="57" y2="48.5" stroke="#c4b5e8" stroke-width="0.35" opacity="0.4"/>
  <line x1="53.5" y1="45" x2="60.5" y2="45" stroke="#c4b5e8" stroke-width="0.35" opacity="0.4"/>
  <!-- Right wing panel 2: pointed arch -->
  <path d="M70,52 L70,44 Q74,40 78,44 L78,52" stroke="#c4b5e8" stroke-width="0.5" fill="none" opacity="0.55"/>
  <!-- Right wing panel 3: ruled text lines -->
  <line x1="82" y1="43" x2="90" y2="43" stroke="#c4b5e8" stroke-width="0.5" opacity="0.4"/>
  <line x1="81" y1="46" x2="90" y2="46" stroke="#c4b5e8" stroke-width="0.5" opacity="0.35"/>
  <line x1="82" y1="49" x2="89" y2="49" stroke="#c4b5e8" stroke-width="0.5" opacity="0.3"/>
  <!-- Left wing panel 1: rosette window (mirrored) -->
  <circle cx="43" cy="45" r="3.5" stroke="#c4b5e8" stroke-width="0.5" fill="none" opacity="0.55"/>
  <circle cx="43" cy="45" r="1.2" fill="#9370db" opacity="0.5"/>
  <line x1="43" y1="41.5" x2="43" y2="48.5" stroke="#c4b5e8" stroke-width="0.35" opacity="0.4"/>
  <line x1="39.5" y1="45" x2="46.5" y2="45" stroke="#c4b5e8" stroke-width="0.35" opacity="0.4"/>
  <!-- Left wing panel 2: pointed arch (mirrored) -->
  <path d="M30,52 L30,44 Q26,40 22,44 L22,52" stroke="#c4b5e8" stroke-width="0.5" fill="none" opacity="0.55"/>
  <!-- Left wing panel 3: ruled text lines (mirrored) -->
  <line x1="18" y1="43" x2="10" y2="43" stroke="#c4b5e8" stroke-width="0.5" opacity="0.4"/>
  <line x1="19" y1="46" x2="10" y2="46" stroke="#c4b5e8" stroke-width="0.5" opacity="0.35"/>
  <line x1="18" y1="49" x2="11" y2="49" stroke="#c4b5e8" stroke-width="0.5" opacity="0.3"/>
  <!-- Wing veins (radiating from body) -->
  <path d="M51,43 L80,35" stroke="#c4b5e8" stroke-width="0.35" opacity="0.22"/>
  <path d="M51,47 L84,49" stroke="#c4b5e8" stroke-width="0.35" opacity="0.22"/>
  <path d="M49,43 L20,35" stroke="#c4b5e8" stroke-width="0.35" opacity="0.22"/>
  <path d="M49,47 L16,49" stroke="#c4b5e8" stroke-width="0.35" opacity="0.22"/>
  <!-- Lower right wing -->
  <path d="M51,54 C55,57 68,61 72,70 C74,76 67,79 59,76 C54,74 51,68 51,60 Z"
        fill="#160f28" stroke="#9370db" stroke-width="0.75"/>
  <!-- Lower left wing -->
  <path d="M49,54 C45,57 32,61 28,70 C26,76 33,79 41,76 C46,74 49,68 49,60 Z"
        fill="#160f28" stroke="#9370db" stroke-width="0.75"/>
  <!-- Lower wing eyespot (right) -->
  <circle cx="63" cy="67" r="2.5" stroke="#c4b5e8" stroke-width="0.5" fill="none" opacity="0.4"/>
  <circle cx="63" cy="67" r="1" fill="#9370db" opacity="0.35"/>
  <!-- Lower wing eyespot (left) -->
  <circle cx="37" cy="67" r="2.5" stroke="#c4b5e8" stroke-width="0.5" fill="none" opacity="0.4"/>
  <circle cx="37" cy="67" r="1" fill="#9370db" opacity="0.35"/>
  <!-- Antennae with split quill tips -->
  <path d="M52,26 C56,21 62,17 66,13" stroke="#c4b5e8" stroke-width="0.75" stroke-linecap="round" fill="none"/>
  <path d="M66,13 C68,11 71,12 69,15" stroke="#c4b5e8" stroke-width="0.5" fill="none"/>
  <path d="M66,13 C69,11 71,13 70,16" stroke="#c4b5e8" stroke-width="0.5" fill="none"/>
  <path d="M48,26 C44,21 38,17 34,13" stroke="#c4b5e8" stroke-width="0.75" stroke-linecap="round" fill="none"/>
  <path d="M34,13 C32,11 29,12 31,15" stroke="#c4b5e8" stroke-width="0.5" fill="none"/>
  <path d="M34,13 C31,11 29,13 30,16" stroke="#c4b5e8" stroke-width="0.5" fill="none"/>
</svg>
```

### Growth Stages

- **Egg**: A single leaf — a manuscript page curled lengthwise into a tube, the way a moth lays eggs inside a rolled leaf. One faint ruled line visible on its surface. The curl creates an implied oval. No creature visible, just the wrapped potential.
- **Nestling**: A cocoon of overlapping manuscript page-strips wound tightly into an oval. The strips are visible as stacked horizontal bands, like a barrel made of paper. Angular protrusions at each side hint at the future wing attachment points. Antennae not yet present.
- **Juvenile**: Wings partially unfurled from the cocoon, slightly crumpled at the trailing edges. Only 2 wing panels visible per side, no panel details yet — just the division lines and the bare wing-fill. Antennae present but short, no split-quill tips yet.
- **Adult**: Full display. 3 panels per upper wing with miniature scenes. Lower wings with eyespots. Complete antennae with forked quill tips. Wing veins visible.

### What Distinguishes It From Rare (Palimpsest)

The Palimpsest is purely geometric: mathematical forms, no organic life, no warmth. It is the achievement of perfect discipline. The Illuminator is what discipline becomes when it is applied to making something beautiful for its own sake — it contains the Palimpsest's compartmented geometry (the wing panels mirror the hexagram's inner structure) but presses that geometry into the service of image-making. The Palimpsest is a theorem. The Illuminator is a theorem that became a painting.

---

## Concept E — The Librarian (Legendary)

### Description

The Librarian is a robed figure with no face — not obscured, not hidden, simply absent. Where a face would be, the hood contains only the same darkness as the space beyond the page. It holds a small lantern in one sleeve-fold, and inside that lantern is a miniature orrery: a central orb surrounded by four orbiting glyphs that rotate slowly, each a different rune. The robes fall in deep parallel folds, the hem barely visible at the bottom of the frame. There are no feet. There is no suggestion that it needs any.

The Librarian is the only one of the five characters that implies a human form without being one. It is the library made briefly personal — the accumulated weight of cataloguing, preserving, and handing down, given enough presence to hold a light. It is what you become in the eyes of a library after you have given enough of yourself to it. This is why it is admin-granted: you don't finish 10 milestones to earn it. You earn it by having become part of what Pergamum is.

### SVG Sketch — Adult Form

```svg
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#0a0a0f"/>
  <!-- Faint ambient glow at robe base -->
  <ellipse cx="50" cy="82" rx="28" ry="9" fill="#9370db" opacity="0.05"/>
  <!-- Robe main form -->
  <path d="M20,97 C20,74 26,54 30,46 L37,27 C40,19 60,19 63,27 L70,46 C74,54 80,74 80,97 Z"
        fill="#1a1030" stroke="#9370db" stroke-width="0.75"/>
  <!-- Robe fold lines (drapery) -->
  <path d="M32,97 C32,72 33,54 34,46" stroke="#2d1959" stroke-width="0.6" opacity="0.9"/>
  <path d="M40,97 C40,74 40,56 40,46" stroke="#2d1959" stroke-width="0.6" opacity="0.9"/>
  <path d="M50,97 C50,72 50,54 50,46" stroke="#2d1959" stroke-width="0.5" opacity="0.7"/>
  <path d="M60,97 C60,74 60,56 60,46" stroke="#2d1959" stroke-width="0.6" opacity="0.9"/>
  <path d="M68,97 C68,72 67,54 66,46" stroke="#2d1959" stroke-width="0.6" opacity="0.9"/>
  <!-- Face void (deeper than background — the absence of a face) -->
  <ellipse cx="50" cy="30" rx="11" ry="9" fill="#05040a"/>
  <!-- Hood rim -->
  <path d="M37,27 C40,19 60,19 63,27" stroke="#c4b5e8" stroke-width="0.5" fill="none" opacity="0.35"/>
  <!-- Left sleeve fold (arm at rest) -->
  <path d="M27,58 C24,55 22,58 24,62 C26,66 30,65 32,60 Z" fill="#1a1030" stroke="#9370db" stroke-width="0.5"/>
  <!-- Right sleeve fold (holding lantern) -->
  <path d="M67,57 C70,54 74,55 74,59 C74,63 70,64 67,61 Z" fill="#1a1030" stroke="#9370db" stroke-width="0.5"/>
  <!-- Lantern frame -->
  <rect x="71" y="46" width="14" height="18" rx="2" stroke="#c4b5e8" stroke-width="0.75" fill="#08061a"/>
  <!-- Lantern cross-bar -->
  <line x1="71" y1="55" x2="85" y2="55" stroke="#c4b5e8" stroke-width="0.5" opacity="0.35"/>
  <!-- Lantern corner braces -->
  <path d="M71,46 L74,49" stroke="#c4b5e8" stroke-width="0.5" opacity="0.45"/>
  <path d="M85,46 L82,49" stroke="#c4b5e8" stroke-width="0.5" opacity="0.45"/>
  <path d="M71,64 L74,61" stroke="#c4b5e8" stroke-width="0.5" opacity="0.45"/>
  <path d="M85,64 L82,61" stroke="#c4b5e8" stroke-width="0.5" opacity="0.45"/>
  <!-- Lantern interior glow -->
  <ellipse cx="78" cy="55" rx="5" ry="6" fill="#9370db" opacity="0.18"/>
  <!-- Central orb -->
  <circle cx="78" cy="55" r="2" fill="#c4b5e8" opacity="0.9"/>
  <!-- Orbiting glyph 1: top — vertical tick -->
  <line x1="78" y1="48" x2="78" y2="51" stroke="#c4b5e8" stroke-width="0.75" stroke-linecap="round" opacity="0.75"/>
  <!-- Orbiting glyph 2: right — small angle bracket -->
  <path d="M83,52 L81.5,55 L83,58" stroke="#c4b5e8" stroke-width="0.5" fill="none" opacity="0.65"/>
  <!-- Orbiting glyph 3: bottom — horizontal dash -->
  <line x1="76" y1="61" x2="80" y2="61" stroke="#c4b5e8" stroke-width="0.75" stroke-linecap="round" opacity="0.75"/>
  <!-- Orbiting glyph 4: left — accent dot -->
  <circle cx="73" cy="54" r="0.9" fill="#9370db" opacity="0.7"/>
  <!-- Lantern chain/handle -->
  <line x1="78" y1="46" x2="78" y2="42" stroke="#c4b5e8" stroke-width="0.6" opacity="0.5"/>
  <path d="M75,42 Q78,40 81,42" stroke="#c4b5e8" stroke-width="0.6" fill="none" opacity="0.5"/>
  <!-- Hem line (faint lower edge) -->
  <path d="M20,97 Q50,99 80,97" stroke="#c4b5e8" stroke-width="0.4" fill="none" opacity="0.2"/>
</svg>
```

### Growth Stages

- **Egg**: A wax seal — a circular disc with a single pressed rune at center, surrounded by a plain border. The wax has the slightly uneven edge of a real seal: not a perfect circle, not a polygon, but the organic ring left by a signet. The rune inside is the same one that will appear in the Librarian's lantern. Nothing else is visible.
- **Nestling**: The seal has cracked down the center and the robes are just emerging — a small dark hooded form, barely taller than wide. The robe has only 2 fold lines. The lantern is present, held at the side, but unlit. The face void is already clearly empty.
- **Juvenile**: Full robe silhouette established. 4 fold lines. The lantern glows, with the central orb visible, but only 2 orbiting glyphs present. The sleeve folds are visible. Hem detail absent.
- **Adult**: Complete form. 5 fold lines. Lantern with all 4 orbiting glyphs. Lantern chain/handle visible. Both sleeve folds present. Hem detail visible. Faint ambient glow at the robe base.

### What Distinguishes It From Epic (Illuminator)

The Illuminator is still fundamentally a creature. It has a body, wings, antennae; it exists in biological space. It can be admired and even caught. The Librarian has none of that. It is presence without anatomy — a shape that carries cultural weight (robed, standing, holding a light) but refuses biological specificity. Where the Illuminator achieves Epic through mastery and production, the Librarian achieves Legendary through becoming indistinguishable from the institution itself. The Illuminator makes beautiful things. The Librarian is what remains when the person who made beautiful things has been in the library long enough to belong to it.

The visual tells this directly: the Illuminator is a creature you look at. The Librarian is a figure you look toward.

---

## Full Roster

| Tier | Character | Form | Theme |
|---|---|---|---|
| Common | The Codex | Ink sprite, ribbon body | Ink, writing, the act of drafting |
| Uncommon | The Vellum Wyrm | Serpent with manuscript-page scales | Illuminated margins, heraldic creatures |
| Rare | The Palimpsest | Geometric sigil, concentric rings | Parchment, layered text, Pergamum itself |
| Epic | The Illuminator | Moth with illuminated folio wings | Book illumination, historiated initials |
| Legendary | The Librarian | Robed faceless figure, glyph lantern | Custodianship, the library as entity |

Approve or request changes to Concept D and/or Concept E before Phase 2 begins.
