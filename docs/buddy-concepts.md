# Buddy Concepts — Animal Roster

Five characters, one per rarity tier. All rendered in medieval bestiary style: line-work first, warm ink palette on the Pergamum dark background, ornamental marginalia flourishes, dignified posture. No gradients on the creatures; gradients allowed only for glow effects and background elements.

Palette used throughout:
- Outline ink: `#1a1208`
- Faded cream: `#e8dbb0`
- Aged parchment: `#c4b5a0`
- Deep red: `#8a3a3a`
- Manuscript gold: `#c9a227`
- Violet accent (glow only, Phoenix tier): `#9370db`

---

## Silhouette Test

Five adult silhouettes, pure black fill on white. Verify all five are distinct before reviewing the full art. Each slot is 110px wide in a 550×120 container.

<svg viewBox="0 0 550 120" width="550" height="120" xmlns="http://www.w3.org/2000/svg" style="background:white;display:block;">

  <!-- CAT — slot 0–110 -->
  <g transform="translate(5,5)">
    <ellipse cx="50" cy="68" rx="18" ry="19" fill="black"/>
    <circle cx="50" cy="34" r="16" fill="black"/>
    <polygon points="35,27 33,7 47,23" fill="black"/>
    <polygon points="65,27 67,7 53,23" fill="black"/>
    <!-- tail -->
    <path d="M67,70 C88,57 93,78 77,88 C67,93 57,89 58,85 Q62,83 68,77 Q80,65 68,68 Z" fill="black"/>
    <ellipse cx="42" cy="87" rx="6.5" ry="3.5" fill="black"/>
    <ellipse cx="58" cy="87" rx="6.5" ry="3.5" fill="black"/>
    <!-- label -->
    <text x="50" y="112" font-family="monospace" font-size="8" fill="#555" text-anchor="middle">CAT</text>
  </g>

  <!-- FENNEC — slot 110–220 -->
  <g transform="translate(115,5)">
    <ellipse cx="50" cy="74" rx="14" ry="13" fill="black"/>
    <circle cx="50" cy="54" r="12" fill="black"/>
    <!-- huge left ear -->
    <path d="M38,48 C30,34 20,10 28,4 C36,-1 48,28 50,46 Z" fill="black"/>
    <!-- huge right ear -->
    <path d="M62,48 C70,34 80,10 72,4 C64,-1 52,28 50,46 Z" fill="black"/>
    <!-- tail tip -->
    <ellipse cx="68" cy="80" rx="7" ry="5" fill="black"/>
    <ellipse cx="42" cy="86" rx="5" ry="3" fill="black"/>
    <ellipse cx="58" cy="86" rx="5" ry="3" fill="black"/>
    <text x="50" y="112" font-family="monospace" font-size="8" fill="#555" text-anchor="middle">FENNEC</text>
  </g>

  <!-- OWL — slot 220–330 -->
  <g transform="translate(225,5)">
    <rect x="14" y="84" width="72" height="6" rx="3" fill="black"/>
    <ellipse cx="50" cy="63" rx="18" ry="22" fill="black"/>
    <!-- wing bumps -->
    <path d="M32,58 C27,62 27,74 32,78 Z" fill="black"/>
    <path d="M68,58 C73,62 73,74 68,78 Z" fill="black"/>
    <circle cx="50" cy="30" r="21" fill="black"/>
    <!-- talons -->
    <path d="M34,84 L30,79 L34,74 M34,84 L30,84" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M66,84 L70,79 L66,74 M66,84 L70,84" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <text x="50" y="112" font-family="monospace" font-size="8" fill="#555" text-anchor="middle">OWL</text>
  </g>

  <!-- AXOLOTL — slot 330–440 -->
  <g transform="translate(335,5)">
    <ellipse cx="50" cy="70" rx="15" ry="17" fill="black"/>
    <!-- tail fin -->
    <path d="M35,82 C30,88 32,96 38,95 L50,88 L62,95 C68,96 70,88 65,82 Z" fill="black"/>
    <!-- wide flat head -->
    <ellipse cx="50" cy="50" rx="26" ry="14" fill="black"/>
    <!-- front legs -->
    <path d="M26,68 C19,72 18,78 22,80 C26,79 28,74 34,70 Z" fill="black"/>
    <path d="M74,68 C81,72 82,78 78,80 C74,79 72,74 66,70 Z" fill="black"/>
    <!-- LEFT gill frills (3 stalks with branches) -->
    <path d="M24,46 C18,36 14,22 16,10 M20,40 C12,36 6,28 7,20 M17,30 C10,26 5,20 6,14" stroke="black" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- RIGHT gill frills (mirror) -->
    <path d="M76,46 C82,36 86,22 84,10 M80,40 C88,36 94,28 93,20 M83,30 C90,26 95,20 94,14" stroke="black" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="50" y="112" font-family="monospace" font-size="8" fill="#555" text-anchor="middle">AXOLOTL</text>
  </g>

  <!-- PHOENIX — slot 440–550 -->
  <g transform="translate(445,5)">
    <rect x="20" y="88" width="60" height="5" rx="2" fill="black"/>
    <!-- left wing -->
    <path d="M36,65 C18,52 6,36 10,20 C16,12 26,22 32,32 C36,22 34,10 40,7 C44,14 42,28 44,38" fill="black"/>
    <!-- right wing -->
    <path d="M64,65 C82,52 94,36 90,20 C84,12 74,22 68,32 C64,22 66,10 60,7 C56,14 58,28 56,38" fill="black"/>
    <ellipse cx="50" cy="62" rx="13" ry="15" fill="black"/>
    <circle cx="50" cy="30" r="12" fill="black"/>
    <!-- crest plumes -->
    <path d="M50,18 C50,12 50,6 50,2 M46,19 C42,12 38,6 36,3 M54,19 C58,12 62,6 64,3" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <!-- tail plumes -->
    <path d="M44,78 C38,86 28,94 22,99 M47,79 C44,88 40,95 37,99 M50,80 C50,88 50,96 50,100 M53,79 C56,88 60,95 63,99 M56,78 C62,86 72,94 78,99" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <text x="50" y="112" font-family="monospace" font-size="8" fill="#555" text-anchor="middle">PHOENIX</text>
  </g>

</svg>

If the five silhouettes above are visually indistinguishable, the designs are failing. Expected read: cat = sitting quad with small triangular ears and side-swept tail; fennec = same body shape but ears consume half the total height; owl = no ears, perfectly round head, barrel body on a branch; axolotl = wide flat head with candelabra frills erupting from both sides; phoenix = spread wings, swept crest plumes above, tail plumes below.

---

## Concept A — Library Cat

**Slug:** `cat` | **Tier:** Common

**Why this animal:** The library cat is the mascot of every bookish space in history — from the cats of the British Library to the famous feline residents of the New York Public Library stacks. Common because everyone begins here; beloved because no one is disappointed to receive one.

**Description:** A medium-sized cat seated upright in the formal posture of Egyptian statuary — weight centered, tail coiled around the base, forepaws together. Coloration is a warm aged-parchment tabby, with three arcing stripe marks drawn across the flank in deep red ink, as if the stripes themselves were ruled with a quill. The forehead carries the faint M-mark of the tabby in the same manuscript hand. The eyes are rendered as simple dark ovals with a single cream highlight dot — no whites, no sparkle, no expression lines beyond the closed-curve mouth. At 48px the silhouette reads instantly: sitting cat, two pointed ears, curl of tail to the right.

**Adult SVG:**

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">

  <!-- BODY -->
  <ellipse cx="50" cy="67" rx="18" ry="19" fill="#c4b5a0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>

  <!-- NECK FILL -->
  <path d="M38,51 Q50,47 62,51 L60,57 Q50,54 40,57 Z" fill="#c4b5a0" stroke="#1a1208" stroke-width="1"/>

  <!-- HEAD -->
  <circle cx="50" cy="34" r="16" fill="#e8dbb0" stroke="#1a1208" stroke-width="1.5"/>

  <!-- LEFT EAR outer -->
  <polygon points="35,26 33,7 47,22" fill="#c4b5a0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- LEFT EAR inner -->
  <polygon points="36,24 35,11 45,21" fill="#8a3a3a" stroke="none"/>

  <!-- RIGHT EAR outer -->
  <polygon points="65,26 67,7 53,22" fill="#c4b5a0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- RIGHT EAR inner -->
  <polygon points="64,24 65,11 55,21" fill="#8a3a3a" stroke="none"/>

  <!-- FOREHEAD TABBY M -->
  <path d="M42,23 Q44,20 46,23" fill="none" stroke="#8a3a3a" stroke-width="0.9" opacity="0.6"/>
  <path d="M47,22 L50,19 L53,22" fill="none" stroke="#8a3a3a" stroke-width="0.9" opacity="0.6"/>
  <path d="M54,23 Q56,20 58,23" fill="none" stroke="#8a3a3a" stroke-width="0.9" opacity="0.6"/>

  <!-- LEFT EYE -->
  <ellipse cx="42" cy="33" rx="3.5" ry="3" fill="#1a1208" stroke="none"/>
  <circle cx="43.2" cy="31.8" r="1.1" fill="#e8dbb0" stroke="none"/>

  <!-- RIGHT EYE -->
  <ellipse cx="58" cy="33" rx="3.5" ry="3" fill="#1a1208" stroke="none"/>
  <circle cx="59.2" cy="31.8" r="1.1" fill="#e8dbb0" stroke="none"/>

  <!-- NOSE -->
  <polygon points="50,41 47.5,44 52.5,44" fill="#8a3a3a" stroke="none"/>

  <!-- PHILTRUM -->
  <line x1="50" y1="44" x2="50" y2="46" stroke="#1a1208" stroke-width="0.8"/>

  <!-- MOUTH -->
  <path d="M47,46.5 Q50,49.5 53,46.5" fill="none" stroke="#1a1208" stroke-width="0.9" stroke-linecap="round"/>

  <!-- WHISKERS LEFT -->
  <line x1="20" y1="41" x2="41" y2="43" stroke="#1a1208" stroke-width="0.75" opacity="0.65"/>
  <line x1="20" y1="44.5" x2="41" y2="44.5" stroke="#1a1208" stroke-width="0.75" opacity="0.65"/>
  <line x1="20" y1="48" x2="41" y2="46.5" stroke="#1a1208" stroke-width="0.75" opacity="0.55"/>

  <!-- WHISKERS RIGHT -->
  <line x1="80" y1="41" x2="59" y2="43" stroke="#1a1208" stroke-width="0.75" opacity="0.65"/>
  <line x1="80" y1="44.5" x2="59" y2="44.5" stroke="#1a1208" stroke-width="0.75" opacity="0.65"/>
  <line x1="80" y1="48" x2="59" y2="46.5" stroke="#1a1208" stroke-width="0.75" opacity="0.55"/>

  <!-- CHEST TUFT -->
  <path d="M43,56 Q50,52 57,56" fill="none" stroke="#1a1208" stroke-width="1" stroke-linecap="round"/>

  <!-- BODY STRIPE MARKS (3 arcing quill lines) -->
  <path d="M35,62 Q50,57 65,62" fill="none" stroke="#8a3a3a" stroke-width="1.1" opacity="0.5"/>
  <path d="M33,69 Q50,64 67,69" fill="none" stroke="#8a3a3a" stroke-width="1" opacity="0.4"/>
  <path d="M35,76 Q50,71 65,76" fill="none" stroke="#8a3a3a" stroke-width="0.9" opacity="0.3"/>

  <!-- TAIL main fill stroke -->
  <path d="M67,70 C86,58 92,78 77,88 C68,93 57,89 58,85"
        fill="none" stroke="#c4b5a0" stroke-width="6" stroke-linecap="round"/>
  <!-- TAIL outline -->
  <path d="M67,70 C86,58 92,78 77,88 C68,93 57,89 58,85"
        fill="none" stroke="#1a1208" stroke-width="1.8" stroke-linecap="round"/>
  <!-- TAIL ring marks -->
  <path d="M80,70 C85,68 89,72 87,77" fill="none" stroke="#8a3a3a" stroke-width="0.9" opacity="0.45"/>
  <path d="M74,84 C72,87 67,90 64,88" fill="none" stroke="#8a3a3a" stroke-width="0.9" opacity="0.35"/>

  <!-- LEFT PAW -->
  <ellipse cx="42" cy="86" rx="6.5" ry="4" fill="#c4b5a0" stroke="#1a1208" stroke-width="1.2"/>
  <line x1="38.5" y1="85" x2="39" y2="88.5" stroke="#1a1208" stroke-width="0.8"/>
  <line x1="42" y1="84.5" x2="42" y2="88.5" stroke="#1a1208" stroke-width="0.8"/>
  <line x1="45.5" y1="85" x2="45" y2="88.5" stroke="#1a1208" stroke-width="0.8"/>

  <!-- RIGHT PAW -->
  <ellipse cx="58" cy="86" rx="6.5" ry="4" fill="#c4b5a0" stroke="#1a1208" stroke-width="1.2"/>
  <line x1="54.5" y1="85" x2="55" y2="88.5" stroke="#1a1208" stroke-width="0.8"/>
  <line x1="58" y1="84.5" x2="58" y2="88.5" stroke="#1a1208" stroke-width="0.8"/>
  <line x1="61.5" y1="85" x2="61" y2="88.5" stroke="#1a1208" stroke-width="0.8"/>

  <!-- ORNAMENTAL DOTS — manuscript gold, top corners -->
  <circle cx="7" cy="8" r="1.8" fill="#c9a227" stroke="none"/>
  <circle cx="11" cy="5" r="1.2" fill="#c9a227" stroke="none"/>
  <circle cx="5" cy="12" r="1" fill="#c9a227" stroke="none"/>
  <circle cx="93" cy="8" r="1.8" fill="#c9a227" stroke="none"/>
  <circle cx="89" cy="5" r="1.2" fill="#c9a227" stroke="none"/>
  <circle cx="95" cy="12" r="1" fill="#c9a227" stroke="none"/>
  <!-- bottom side dots -->
  <circle cx="8" cy="85" r="1.4" fill="#c9a227" stroke="none"/>
  <circle cx="92" cy="85" r="1.4" fill="#c9a227" stroke="none"/>
  <!-- leaf curl ornaments at shoulders -->
  <path d="M8,28 C6,22 12,20 10,26" fill="none" stroke="#c9a227" stroke-width="1" opacity="0.7"/>
  <path d="M92,28 C94,22 88,20 90,26" fill="none" stroke="#c9a227" stroke-width="1" opacity="0.7"/>

</svg>
```

**Growth Stages:**

- **Egg:** A smooth oval egg the color of aged parchment (#c4b5a0). Three dark-red ink dots arranged on the top forming a paw-pad shape — two small upper dots, one larger lower dot — as if pressed there by a tiny foot. No other markings.
- **Nestling:** A tiny round head with enormous ears relative to the body, set on a bead-shaped torso with no visible neck. Eyes are wide dark circles. No stripes yet. Tail is a thin wisp. Looks freshly emerged and uncertain.
- **Juvenile:** Recognizable as a young cat but with proportions still slightly off — head slightly too large, tail slightly too thin. Two of the three body stripes are visible. Paws are blocky, not yet refined. Whiskers present but sparse.
- **Adult:** Full sitting posture, three stripe marks, complete tail curl, all six whiskers, ornamental margin dots. The M-mark on the forehead is now clear.

**Ornamental Flourish Notes:** Four gold dot clusters at the corners and two small leaf-curl strokes at mid-height on each side. Restrained. The cat earns no elaborate border — the simplicity is the point for Common tier.

---

## Concept B — Fennec Fox

**Slug:** `fennec` | **Tier:** Uncommon

**Why this animal:** The fennec fox's ears are so disproportionately large they read as a silhouette from across a room. Desert creature, nocturnal hunter, feels exotic without requiring mythology. One tier above the cat in rarity; one tier above in visual complexity.

**Description:** A small fennec seated upright, weight back on haunches, ears erect and angled slightly outward. The ears consume approximately half the total vertical height of the drawing — they are the character. Each ear interior is rendered with three radiating vein-lines in deep red, giving the impression of manuscript marginalia leaf veins. The body is the warm cream of bleached papyrus. A thick, bushy tail curves behind and to the right, its tip a slightly paler oval. The muzzle projects slightly — more pointed than the cat, less extreme than a full fox — with the nose rendered as a small dark ellipse at the tip. Two gold dot-clusters flank the ear bases; a small curl ornament hangs below each ear like a punctuation mark.

**Adult SVG:**

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">

  <!-- LEFT EAR outer shape (tall, sweeping) -->
  <path d="M38,48 C30,36 20,14 26,5 C31,-1 46,26 48,44 Z"
        fill="#e8dbb0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- LEFT EAR inner fill -->
  <path d="M39,46 C33,36 26,18 30,8 C34,4 44,28 46,42 Z"
        fill="#c4b5a0" stroke="none"/>
  <!-- LEFT EAR vein lines -->
  <path d="M39,44 C35,34 30,20 30,10" fill="none" stroke="#8a3a3a" stroke-width="0.75" opacity="0.55"/>
  <path d="M41,43 C38,33 36,22 34,14" fill="none" stroke="#8a3a3a" stroke-width="0.65" opacity="0.45"/>
  <path d="M43,42 C41,33 40,24 38,17" fill="none" stroke="#8a3a3a" stroke-width="0.6" opacity="0.4"/>

  <!-- RIGHT EAR outer shape -->
  <path d="M62,48 C70,36 80,14 74,5 C69,-1 54,26 52,44 Z"
        fill="#e8dbb0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- RIGHT EAR inner fill -->
  <path d="M61,46 C67,36 74,18 70,8 C66,4 56,28 54,42 Z"
        fill="#c4b5a0" stroke="none"/>
  <!-- RIGHT EAR vein lines -->
  <path d="M61,44 C65,34 70,20 70,10" fill="none" stroke="#8a3a3a" stroke-width="0.75" opacity="0.55"/>
  <path d="M59,43 C62,33 64,22 66,14" fill="none" stroke="#8a3a3a" stroke-width="0.65" opacity="0.45"/>
  <path d="M57,42 C59,33 60,24 62,17" fill="none" stroke="#8a3a3a" stroke-width="0.6" opacity="0.4"/>

  <!-- BODY -->
  <ellipse cx="50" cy="74" rx="15" ry="14" fill="#c4b5a0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>

  <!-- HEAD -->
  <circle cx="50" cy="53" r="13" fill="#e8dbb0" stroke="#1a1208" stroke-width="1.5"/>

  <!-- MUZZLE protrusion -->
  <ellipse cx="50" cy="59" rx="5.5" ry="4" fill="#e8dbb0" stroke="#1a1208" stroke-width="1"/>

  <!-- LEFT EYE -->
  <ellipse cx="43" cy="51" rx="4" ry="3.5" fill="#1a1208" stroke="none"/>
  <circle cx="44.4" cy="49.6" r="1.2" fill="#e8dbb0" stroke="none"/>

  <!-- RIGHT EYE -->
  <ellipse cx="57" cy="51" rx="4" ry="3.5" fill="#1a1208" stroke="none"/>
  <circle cx="58.4" cy="49.6" r="1.2" fill="#e8dbb0" stroke="none"/>

  <!-- NOSE -->
  <ellipse cx="50" cy="61" rx="2.5" ry="1.6" fill="#8a3a3a" stroke="none"/>

  <!-- WHISKERS LEFT -->
  <line x1="20" y1="58" x2="42" y2="59" stroke="#1a1208" stroke-width="0.75" opacity="0.6"/>
  <line x1="20" y1="61.5" x2="42" y2="61" stroke="#1a1208" stroke-width="0.75" opacity="0.6"/>
  <line x1="20" y1="65" x2="42" y2="63" stroke="#1a1208" stroke-width="0.7" opacity="0.5"/>

  <!-- WHISKERS RIGHT -->
  <line x1="80" y1="58" x2="58" y2="59" stroke="#1a1208" stroke-width="0.75" opacity="0.6"/>
  <line x1="80" y1="61.5" x2="58" y2="61" stroke="#1a1208" stroke-width="0.75" opacity="0.6"/>
  <line x1="80" y1="65" x2="58" y2="63" stroke="#1a1208" stroke-width="0.7" opacity="0.5"/>

  <!-- CHEST FUR LINES -->
  <path d="M39,65 Q50,61 61,65" fill="none" stroke="#8a3a3a" stroke-width="0.7" opacity="0.4"/>
  <path d="M40,69 Q50,66 60,69" fill="none" stroke="#8a3a3a" stroke-width="0.7" opacity="0.35"/>

  <!-- TAIL (fluffy, right side) — fill layers -->
  <path d="M63,76 C79,68 90,74 87,83 C84,90 73,90 68,85"
        fill="none" stroke="#e8dbb0" stroke-width="9" stroke-linecap="round"/>
  <path d="M63,76 C79,68 90,74 87,83 C84,90 73,90 68,85"
        fill="none" stroke="#c4b5a0" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M63,76 C79,68 90,74 87,83 C84,90 73,90 68,85"
        fill="none" stroke="#1a1208" stroke-width="1.5" stroke-linecap="round"/>
  <!-- TAIL white tip -->
  <circle cx="68" cy="85" r="4" fill="#e8dbb0" stroke="#1a1208" stroke-width="1"/>

  <!-- LEFT PAW -->
  <ellipse cx="42" cy="87" rx="5.5" ry="3.5" fill="#e8dbb0" stroke="#1a1208" stroke-width="1.2"/>
  <line x1="39" y1="86" x2="39.5" y2="89" stroke="#1a1208" stroke-width="0.8"/>
  <line x1="42" y1="85.5" x2="42" y2="89" stroke="#1a1208" stroke-width="0.8"/>
  <line x1="45" y1="86" x2="44.5" y2="89" stroke="#1a1208" stroke-width="0.8"/>

  <!-- RIGHT PAW -->
  <ellipse cx="58" cy="87" rx="5.5" ry="3.5" fill="#e8dbb0" stroke="#1a1208" stroke-width="1.2"/>
  <line x1="55" y1="86" x2="55.5" y2="89" stroke="#1a1208" stroke-width="0.8"/>
  <line x1="58" y1="85.5" x2="58" y2="89" stroke="#1a1208" stroke-width="0.8"/>
  <line x1="61" y1="86" x2="60.5" y2="89" stroke="#1a1208" stroke-width="0.8"/>

  <!-- ORNAMENTAL FLOURISHES -->
  <!-- corner dot clusters -->
  <circle cx="7" cy="6" r="2" fill="#c9a227" stroke="none"/>
  <circle cx="11" cy="4" r="1.2" fill="#c9a227" stroke="none"/>
  <circle cx="4" cy="10" r="1" fill="#c9a227" stroke="none"/>
  <circle cx="93" cy="6" r="2" fill="#c9a227" stroke="none"/>
  <circle cx="89" cy="4" r="1.2" fill="#c9a227" stroke="none"/>
  <circle cx="96" cy="10" r="1" fill="#c9a227" stroke="none"/>
  <!-- ear base dots -->
  <circle cx="29" cy="48" r="1.6" fill="#c9a227" stroke="none"/>
  <circle cx="71" cy="48" r="1.6" fill="#c9a227" stroke="none"/>
  <!-- small curl below each ear -->
  <path d="M24,50 C21,55 26,59 30,56" fill="none" stroke="#c9a227" stroke-width="1" opacity="0.65"/>
  <path d="M76,50 C79,55 74,59 70,56" fill="none" stroke="#c9a227" stroke-width="1" opacity="0.65"/>
  <!-- bottom corner dots -->
  <circle cx="8" cy="88" r="1.4" fill="#c9a227" stroke="none"/>
  <circle cx="92" cy="88" r="1.4" fill="#c9a227" stroke="none"/>

</svg>
```

**Growth Stages:**

- **Egg:** A sandy-cream egg with two large rounded teardrop markings on opposite sides of the upper half — silhouette hints of the oversized ears. The markings are outlined in faint deep red.
- **Nestling:** A tiny round-bodied kit with ears already at adult proportion — comically oversized relative to the body, flopped slightly outward. Eyes are large dark circles. No vein detail in ears yet.
- **Juvenile:** Ears have straightened and grown, inner vein lines appear but are faint. Muzzle beginning to project. Tail visible but not yet fluffy. Proportions still a little soft.
- **Adult:** Full ear height, three inner vein lines per ear, complete muzzle projection, full fluffy tail with pale tip, all six whiskers. Ornamental flourishes at ear base.

**Ornamental Flourish Notes:** Gold dot at the base of each ear, a small scroll-curl below each ear, corner clusters at all four corners, and two dots at the bottom edge. More elements than the cat; the ears themselves function as the dominant decorative feature.

---

## Concept C — Snowy Owl

**Slug:** `owl` | **Tier:** Rare

**Description:** A snowy owl perched on a simple branch bar, facing directly forward. Round head — no ear tufts, which is correct for the species and crucial for the silhouette's distinctiveness from other tier characters. The body is a compact barrel, almost as wide as it is tall, suggesting the owl's dense arctic plumage. The plumage is rendered in the faded cream of old vellum, marked across both head and body with small dark chevrons (V-shapes pointing upward) and scattered elliptical spots in deep red — the standard snowy owl barring, reinterpreted as manuscript ink marks. The most striking feature at 96px and above: the eyes. Each is rendered with three concentric rings — an outer gold ring, a dark iris, and a cream highlight dot — giving them unusual weight for so small a face. A short hooked beak juts downward between them. The facial disc is implied by a subtle arc of fine dashed marks on each side.

**Adult SVG:**

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">

  <!-- BRANCH -->
  <rect x="12" y="87" width="76" height="4" rx="2" fill="#8a3a3a" stroke="#1a1208" stroke-width="1"/>
  <!-- bark texture -->
  <line x1="22" y1="87" x2="25" y2="91" stroke="#1a1208" stroke-width="0.7" opacity="0.4"/>
  <line x1="36" y1="87" x2="39" y2="91" stroke="#1a1208" stroke-width="0.7" opacity="0.4"/>
  <line x1="50" y1="87" x2="53" y2="91" stroke="#1a1208" stroke-width="0.7" opacity="0.4"/>
  <line x1="64" y1="87" x2="67" y2="91" stroke="#1a1208" stroke-width="0.7" opacity="0.4"/>
  <line x1="78" y1="87" x2="81" y2="91" stroke="#1a1208" stroke-width="0.7" opacity="0.4"/>

  <!-- LEFT TALON -->
  <path d="M34,87 L29,82 M34,87 L30,87 M34,87 L34,83 L32,79"
        fill="none" stroke="#1a1208" stroke-width="1.3" stroke-linecap="round"/>
  <!-- RIGHT TALON -->
  <path d="M66,87 L71,82 M66,87 L70,87 M66,87 L66,83 L68,79"
        fill="none" stroke="#1a1208" stroke-width="1.3" stroke-linecap="round"/>

  <!-- BODY -->
  <ellipse cx="50" cy="64" rx="18" ry="21" fill="#e8dbb0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>

  <!-- LEFT WING EDGE (folded, feather tips peeking) -->
  <path d="M33,60 C28,65 27,74 32,80 C34,75 34,66 36,62 Z"
        fill="#c4b5a0" stroke="#1a1208" stroke-width="1" stroke-linejoin="round"/>
  <!-- RIGHT WING EDGE -->
  <path d="M67,60 C72,65 73,74 68,80 C66,75 66,66 64,62 Z"
        fill="#c4b5a0" stroke="#1a1208" stroke-width="1" stroke-linejoin="round"/>

  <!-- BODY CHEVRONS — 12 chevrons across 4 rows -->
  <path d="M37,54 L41,50 L45,54" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linejoin="round" opacity="0.7"/>
  <path d="M45,54 L49,50 L53,54" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linejoin="round" opacity="0.7"/>
  <path d="M53,54 L57,50 L61,54" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linejoin="round" opacity="0.65"/>
  <path d="M36,62 L40,58 L44,62" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linejoin="round" opacity="0.6"/>
  <path d="M44,62 L48,58 L52,62" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linejoin="round" opacity="0.6"/>
  <path d="M52,62 L56,58 L60,62" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linejoin="round" opacity="0.55"/>
  <path d="M37,70 L41,66 L45,70" fill="none" stroke="#8a3a3a" stroke-width="0.8" stroke-linejoin="round" opacity="0.5"/>
  <path d="M45,70 L49,66 L53,70" fill="none" stroke="#8a3a3a" stroke-width="0.8" stroke-linejoin="round" opacity="0.5"/>
  <path d="M53,70 L57,66 L61,70" fill="none" stroke="#8a3a3a" stroke-width="0.8" stroke-linejoin="round" opacity="0.45"/>
  <path d="M38,78 L42,74 L46,78" fill="none" stroke="#8a3a3a" stroke-width="0.75" stroke-linejoin="round" opacity="0.4"/>
  <path d="M46,78 L50,74 L54,78" fill="none" stroke="#8a3a3a" stroke-width="0.75" stroke-linejoin="round" opacity="0.4"/>
  <path d="M54,78 L58,74 L62,78" fill="none" stroke="#8a3a3a" stroke-width="0.75" stroke-linejoin="round" opacity="0.35"/>

  <!-- HEAD (large, perfectly round) -->
  <circle cx="50" cy="31" r="21" fill="#e8dbb0" stroke="#1a1208" stroke-width="1.5"/>

  <!-- HEAD SPOTS (snowy owl barring) -->
  <ellipse cx="38" cy="20" rx="2.2" ry="1.3" fill="#8a3a3a" opacity="0.5" transform="rotate(-20,38,20)"/>
  <ellipse cx="44" cy="16" rx="2" ry="1.2" fill="#8a3a3a" opacity="0.45" transform="rotate(-10,44,16)"/>
  <ellipse cx="50" cy="14" rx="2.2" ry="1.3" fill="#8a3a3a" opacity="0.4"/>
  <ellipse cx="56" cy="16" rx="2" ry="1.2" fill="#8a3a3a" opacity="0.45" transform="rotate(10,56,16)"/>
  <ellipse cx="62" cy="20" rx="2.2" ry="1.3" fill="#8a3a3a" opacity="0.5" transform="rotate(20,62,20)"/>
  <ellipse cx="33" cy="28" rx="1.7" ry="1" fill="#8a3a3a" opacity="0.4"/>
  <ellipse cx="67" cy="28" rx="1.7" ry="1" fill="#8a3a3a" opacity="0.4"/>
  <ellipse cx="35" cy="38" rx="1.5" ry="0.9" fill="#8a3a3a" opacity="0.35"/>
  <ellipse cx="65" cy="38" rx="1.5" ry="0.9" fill="#8a3a3a" opacity="0.35"/>

  <!-- FACIAL DISC arcs (dashed) -->
  <path d="M36,22 Q24,31 36,42" fill="none" stroke="#8a3a3a" stroke-width="0.7" stroke-dasharray="1.5,2.2" opacity="0.5"/>
  <path d="M64,22 Q76,31 64,42" fill="none" stroke="#8a3a3a" stroke-width="0.7" stroke-dasharray="1.5,2.2" opacity="0.5"/>

  <!-- LEFT EYE (three rings: gold outer, dark iris, cream dot) -->
  <circle cx="42" cy="33" r="5.5" fill="#c9a227" stroke="#1a1208" stroke-width="1.2"/>
  <circle cx="42" cy="33" r="3.8" fill="#1a1208" stroke="none"/>
  <circle cx="43.4" cy="31.6" r="1.3" fill="#e8dbb0" stroke="none"/>

  <!-- RIGHT EYE -->
  <circle cx="58" cy="33" r="5.5" fill="#c9a227" stroke="#1a1208" stroke-width="1.2"/>
  <circle cx="58" cy="33" r="3.8" fill="#1a1208" stroke="none"/>
  <circle cx="59.4" cy="31.6" r="1.3" fill="#e8dbb0" stroke="none"/>

  <!-- BEAK (short hooked triangle) -->
  <path d="M47,40 L50,37 L53,40 L50,45 Z" fill="#c9a227" stroke="#1a1208" stroke-width="0.9" stroke-linejoin="round"/>

  <!-- ORNAMENTAL FLOURISHES -->
  <circle cx="5" cy="5" r="2.2" fill="#c9a227" stroke="none"/>
  <circle cx="9" cy="3" r="1.4" fill="#c9a227" stroke="none"/>
  <circle cx="3" cy="9" r="1.4" fill="#c9a227" stroke="none"/>
  <circle cx="7" cy="13" r="0.9" fill="#c9a227" stroke="none"/>
  <circle cx="95" cy="5" r="2.2" fill="#c9a227" stroke="none"/>
  <circle cx="91" cy="3" r="1.4" fill="#c9a227" stroke="none"/>
  <circle cx="97" cy="9" r="1.4" fill="#c9a227" stroke="none"/>
  <circle cx="93" cy="13" r="0.9" fill="#c9a227" stroke="none"/>
  <!-- mid-side leaf curls -->
  <path d="M5,44 C3,38 9,34 8,40" fill="none" stroke="#c9a227" stroke-width="1.1" opacity="0.65"/>
  <path d="M95,44 C97,38 91,34 92,40" fill="none" stroke="#c9a227" stroke-width="1.1" opacity="0.65"/>
  <!-- bottom dots -->
  <circle cx="7" cy="94" r="1.5" fill="#c9a227" stroke="none"/>
  <circle cx="11" cy="96" r="1" fill="#c9a227" stroke="none"/>
  <circle cx="93" cy="94" r="1.5" fill="#c9a227" stroke="none"/>
  <circle cx="89" cy="96" r="1" fill="#c9a227" stroke="none"/>

</svg>
```

**Growth Stages:**

- **Egg:** A rounded egg with scattered brown-ink speckles — a loose pattern replicating the actual appearance of a snowy owl egg. The speckles are denser around the equator, sparser at the poles.
- **Nestling:** A white powder-puff ball, almost entirely head, with two enormous dark eye-circles that take up a third of the face. The beak is a tiny hooked bump. No chevron markings yet; pure white-cream.
- **Juvenile:** Body beginning to elongate into the barrel shape. First chevron rows appearing on upper body. Eyes still prominent but more in proportion. Talons visible, branch beginning to show.
- **Adult:** Full barrel body, complete chevron pattern, golden-ringed eyes, full branch with talon grip, facial disc arcs, all ornamental elements.

**Ornamental Flourish Notes:** Four-dot corner clusters plus a tenth dot below, mid-side leaf curls, and bottom edge dots. More elements than the fennec, establishing the escalating richness toward the upper tiers.

---

## Concept D — Axolotl

**Slug:** `axolotl` | **Tier:** Epic

**Why this animal:** The axolotl's external gill frills are unlike any other vertebrate feature in the animal kingdom — branching tree-like structures erupting from the sides of the head, biologically remarkable (they retain juvenile traits into adulthood, they can regenerate limbs), and visually extraordinary. At manuscript scale, three branching gill stalks on each side look exactly like filigree candelabra ornamentation. Critically endangered in the wild; mythologically present in Aztec culture as the avatar of Xolotl. Earns Epic tier by being genuinely singular.

**Description:** A wide-headed axolotl seen from directly in front, floating. The defining feature is the gill frills: three branching stalks erupting from each side of the head, each main stalk rendered in manuscript gold with two or three side branches terminating in small dot florettes in deep red and gold. The frills suggest ornate candlestick holders or illuminated manuscript border trees. The head itself is wide and flat, the characteristic axolotl shape — so broad relative to the body that it seems to extend beyond the body's edge. The famous upward-curving mouth is rendered as a single ink arc, giving the impression of a calm, permanent half-smile. Four stubby legs are visible, two at each side, each with three short toe lines. The tail is a paddle fin. The body carries a scatter of dark-red circular spots.

**Adult SVG:**

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">

  <!-- TAIL FIN (behind body) -->
  <path d="M36,86 C30,92 32,98 38,97 L50,90 L62,97 C68,98 70,92 64,86 Z"
        fill="#c4b5a0" stroke="#1a1208" stroke-width="1.2" stroke-linejoin="round"/>

  <!-- BODY -->
  <ellipse cx="50" cy="72" rx="16" ry="17" fill="#c4b5a0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>

  <!-- BODY SPOTS -->
  <circle cx="44" cy="66" r="2.5" fill="#8a3a3a" opacity="0.35" stroke="none"/>
  <circle cx="56" cy="66" r="2.5" fill="#8a3a3a" opacity="0.35" stroke="none"/>
  <circle cx="42" cy="74" r="2" fill="#8a3a3a" opacity="0.3" stroke="none"/>
  <circle cx="58" cy="74" r="2" fill="#8a3a3a" opacity="0.3" stroke="none"/>
  <circle cx="50" cy="70" r="2.5" fill="#8a3a3a" opacity="0.25" stroke="none"/>
  <circle cx="45" cy="80" r="1.8" fill="#8a3a3a" opacity="0.28" stroke="none"/>
  <circle cx="55" cy="80" r="1.8" fill="#8a3a3a" opacity="0.28" stroke="none"/>

  <!-- HEAD (wide and flat) -->
  <ellipse cx="50" cy="50" rx="27" ry="15" fill="#e8dbb0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>

  <!-- LEFT EYE -->
  <circle cx="30" cy="47" r="3.2" fill="#1a1208" stroke="#1a1208" stroke-width="0.8"/>
  <circle cx="31.2" cy="45.8" r="1" fill="#e8dbb0" stroke="none"/>

  <!-- RIGHT EYE -->
  <circle cx="70" cy="47" r="3.2" fill="#1a1208" stroke="#1a1208" stroke-width="0.8"/>
  <circle cx="71.2" cy="45.8" r="1" fill="#e8dbb0" stroke="none"/>

  <!-- NOSTRIL DOTS -->
  <circle cx="47" cy="52" r="1.3" fill="#8a3a3a" opacity="0.6" stroke="none"/>
  <circle cx="53" cy="52" r="1.3" fill="#8a3a3a" opacity="0.6" stroke="none"/>

  <!-- SMILE (axolotl upward curve) -->
  <path d="M42,58 Q50,64 58,58" fill="none" stroke="#1a1208" stroke-width="1.3" stroke-linecap="round"/>

  <!-- FRONT LEGS -->
  <path d="M34,67 C26,69 22,74 24,78 C27,80 30,78 33,73 L35,70"
        fill="#c4b5a0" stroke="#1a1208" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22,79 L20,84 M24,78 L23,84 M27,79 L27,84"
        fill="none" stroke="#1a1208" stroke-width="0.9" stroke-linecap="round"/>
  <path d="M66,67 C74,69 78,74 76,78 C73,80 70,78 67,73 L65,70"
        fill="#c4b5a0" stroke="#1a1208" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M78,79 L80,84 M76,78 L77,84 M73,79 L73,84"
        fill="none" stroke="#1a1208" stroke-width="0.9" stroke-linecap="round"/>

  <!-- LEFT GILL FRILLS (3 filigree stalks) -->

  <!-- L-Frill 1 (forward, short-medium) -->
  <path d="M24,44 C20,34 18,24 20,14" fill="none" stroke="#c9a227" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M22,38 C16,34 10,30 9,25" fill="none" stroke="#c9a227" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M20,28 C14,26 8,23 8,17" fill="none" stroke="#c9a227" stroke-width="1" stroke-linecap="round"/>
  <circle cx="20" cy="14" r="1.6" fill="#c9a227" stroke="none"/>
  <circle cx="9" cy="25" r="1.2" fill="#8a3a3a" stroke="none"/>
  <circle cx="8" cy="17" r="1.2" fill="#8a3a3a" stroke="none"/>

  <!-- L-Frill 2 (center, tallest) -->
  <path d="M19,44 C15,32 12,18 13,7" fill="none" stroke="#c9a227" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M17,36 C10,32 4,26 4,20" fill="none" stroke="#c9a227" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M15,26 C8,22 3,16 4,10" fill="none" stroke="#c9a227" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M14,17 C10,12 9,6 11,3" fill="none" stroke="#c9a227" stroke-width="0.9" stroke-linecap="round"/>
  <circle cx="13" cy="7" r="1.9" fill="#c9a227" stroke="none"/>
  <circle cx="4" cy="20" r="1.2" fill="#8a3a3a" stroke="none"/>
  <circle cx="4" cy="10" r="1.2" fill="#8a3a3a" stroke="none"/>
  <circle cx="11" cy="3" r="1.5" fill="#c9a227" stroke="none"/>

  <!-- L-Frill 3 (rear, medium) -->
  <path d="M21,48 C18,38 17,26 19,16" fill="none" stroke="#c9a227" stroke-width="1.9" stroke-linecap="round"/>
  <path d="M19,40 C13,36 7,32 7,26" fill="none" stroke="#c9a227" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M19,30 C13,28 8,24 9,18" fill="none" stroke="#c9a227" stroke-width="1" stroke-linecap="round"/>
  <circle cx="19" cy="16" r="1.5" fill="#c9a227" stroke="none"/>
  <circle cx="7" cy="26" r="1.1" fill="#8a3a3a" stroke="none"/>
  <circle cx="9" cy="18" r="1.1" fill="#8a3a3a" stroke="none"/>

  <!-- RIGHT GILL FRILLS (mirror) -->

  <!-- R-Frill 1 -->
  <path d="M76,44 C80,34 82,24 80,14" fill="none" stroke="#c9a227" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M78,38 C84,34 90,30 91,25" fill="none" stroke="#c9a227" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M80,28 C86,26 92,23 92,17" fill="none" stroke="#c9a227" stroke-width="1" stroke-linecap="round"/>
  <circle cx="80" cy="14" r="1.6" fill="#c9a227" stroke="none"/>
  <circle cx="91" cy="25" r="1.2" fill="#8a3a3a" stroke="none"/>
  <circle cx="92" cy="17" r="1.2" fill="#8a3a3a" stroke="none"/>

  <!-- R-Frill 2 -->
  <path d="M81,44 C85,32 88,18 87,7" fill="none" stroke="#c9a227" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M83,36 C90,32 96,26 96,20" fill="none" stroke="#c9a227" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M85,26 C92,22 97,16 96,10" fill="none" stroke="#c9a227" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M86,17 C90,12 91,6 89,3" fill="none" stroke="#c9a227" stroke-width="0.9" stroke-linecap="round"/>
  <circle cx="87" cy="7" r="1.9" fill="#c9a227" stroke="none"/>
  <circle cx="96" cy="20" r="1.2" fill="#8a3a3a" stroke="none"/>
  <circle cx="96" cy="10" r="1.2" fill="#8a3a3a" stroke="none"/>
  <circle cx="89" cy="3" r="1.5" fill="#c9a227" stroke="none"/>

  <!-- R-Frill 3 -->
  <path d="M79,48 C82,38 83,26 81,16" fill="none" stroke="#c9a227" stroke-width="1.9" stroke-linecap="round"/>
  <path d="M81,40 C87,36 93,32 93,26" fill="none" stroke="#c9a227" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M81,30 C87,28 92,24 91,18" fill="none" stroke="#c9a227" stroke-width="1" stroke-linecap="round"/>
  <circle cx="81" cy="16" r="1.5" fill="#c9a227" stroke="none"/>
  <circle cx="93" cy="26" r="1.1" fill="#8a3a3a" stroke="none"/>
  <circle cx="91" cy="18" r="1.1" fill="#8a3a3a" stroke="none"/>

  <!-- ORNAMENTAL FLOURISHES (many, Epic tier) -->
  <circle cx="5" cy="54" r="2.2" fill="#c9a227" stroke="none"/>
  <circle cx="5" cy="60" r="1.4" fill="#c9a227" stroke="none"/>
  <circle cx="5" cy="66" r="1" fill="#c9a227" stroke="none"/>
  <circle cx="95" cy="54" r="2.2" fill="#c9a227" stroke="none"/>
  <circle cx="95" cy="60" r="1.4" fill="#c9a227" stroke="none"/>
  <circle cx="95" cy="66" r="1" fill="#c9a227" stroke="none"/>
  <!-- bottom edge dots -->
  <circle cx="20" cy="97" r="1.4" fill="#c9a227" stroke="none"/>
  <circle cx="50" cy="98" r="1.6" fill="#c9a227" stroke="none"/>
  <circle cx="80" cy="97" r="1.4" fill="#c9a227" stroke="none"/>

</svg>
```

**Growth Stages:**

- **Egg:** A translucent pale-cream egg. Visible through the shell surface as faint inner lines: the suggestion of three branching gill stalks in embryonic form, rendered as thin gold strokes at low opacity. The only bestiary buddy whose egg content is visible before hatching.
- **Nestling:** A tiny flat-headed form with small, simple gill frills — just single stalks with no branching yet. The smile is already present. Body is a simple oval. Legs are stubby stubs.
- **Juvenile:** Gill frills have their first side branches (one branch each, not yet two or three). Body spots have appeared. Legs are more defined with visible toes. Tail fin shape is recognizable.
- **Adult:** Full three-stalk frills on each side, each with multiple branches and tip florettes in gold and red. Complete body spot scatter. Paddle tail. All four legs with toe marks. Elaborate side flourishes.

**Ornamental Flourish Notes:** The gill frills themselves function as the primary ornamental element — they take the place of the border decorations other characters rely on. Additional gold dot columns at mid-height on each side, plus three dots along the bottom edge. No corner clusters — the frills reach into those corners already.

---

## Concept E — Phoenix

**Slug:** `phoenix` | **Tier:** Legendary

**Why this animal:** Born from eggs in ashes, mythologically tied to renewal and rarity, recognizable across every culture. Gold and crimson plumage reads instantly as the most valuable tier. Admin-granted only — users never roll a Phoenix through normal progression. It must look like something worth waiting for.

**Description:** A phoenix perched on a decorative bar, wings raised in a half-spread posture — neither fully folded nor fully extended, implying potential energy. The plumage is the richest element: the wings show three tiers of feathers, each tier rendered as layered arcs with individual feather lines in deep red on parchment ground. Wing tips and primary feather ends carry small flame-tip shapes in manuscript gold. Five tail plumes stream downward from the base, each terminating in a pointed flame shape in gold. The crest: five sweeping plumes rising from the crown, the central three in gold, the outer two in deep red. The beak is a hooked curve. A single eye faces forward, rendered with a gold iris ring. Around the wings, a subtle dashed ellipse in violet — the only use of the Pergamum accent color in the entire buddy roster, reserved for this tier alone.

**Adult SVG:**

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">

  <!-- PERCH BAR -->
  <rect x="16" y="89" width="68" height="4" rx="2" fill="#8a3a3a" stroke="#1a1208" stroke-width="1"/>
  <line x1="26" y1="89" x2="29" y2="93" stroke="#1a1208" stroke-width="0.8" opacity="0.5"/>
  <line x1="42" y1="89" x2="45" y2="93" stroke="#1a1208" stroke-width="0.8" opacity="0.5"/>
  <line x1="58" y1="89" x2="61" y2="93" stroke="#1a1208" stroke-width="0.8" opacity="0.5"/>
  <line x1="74" y1="89" x2="77" y2="93" stroke="#1a1208" stroke-width="0.8" opacity="0.5"/>

  <!-- TAIL PLUMES (5, streaming downward) -->
  <path d="M44,82 C38,87 28,94 21,99" fill="none" stroke="#8a3a3a" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M20,99 C17,97 19,93 21,91 C23,94 23,98 20,99 Z" fill="#c9a227" stroke="none"/>
  <path d="M47,83 C44,90 40,96 36,100" fill="none" stroke="#8a3a3a" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M35,100 C32,98 34,94 36,92 C38,95 38,99 35,100 Z" fill="#c9a227" stroke="none"/>
  <path d="M50,84 C50,91 50,98 50,103" fill="none" stroke="#8a3a3a" stroke-width="3" stroke-linecap="round"/>
  <path d="M50,103 C47,101 48,97 50,95 C52,97 53,101 50,103 Z" fill="#c9a227" stroke="none"/>
  <path d="M53,83 C56,90 60,96 64,100" fill="none" stroke="#8a3a3a" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M65,100 C68,98 66,94 64,92 C62,95 62,99 65,100 Z" fill="#c9a227" stroke="none"/>
  <path d="M56,82 C62,87 72,94 79,99" fill="none" stroke="#8a3a3a" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M80,99 C83,97 81,93 79,91 C77,94 77,98 80,99 Z" fill="#c9a227" stroke="none"/>

  <!-- LEFT TALON -->
  <path d="M34,89 L29,84 M34,89 L29,89 M34,89 L33,85 L31,81"
        fill="none" stroke="#1a1208" stroke-width="1.3" stroke-linecap="round"/>
  <!-- RIGHT TALON -->
  <path d="M66,89 L71,84 M66,89 L71,89 M66,89 L67,85 L69,81"
        fill="none" stroke="#1a1208" stroke-width="1.3" stroke-linecap="round"/>

  <!-- LEFT WING (raised, three feather tiers visible) -->
  <path d="M38,66 C20,56 8,40 10,24 C14,16 23,26 30,34 C33,24 31,12 38,8 C42,16 40,28 42,38 C46,28 47,16 53,14 C54,22 51,34 50,42"
        fill="#c4b5a0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- left wing primary feathers (tier 1) -->
  <path d="M10,24 C13,20 19,21 24,26" fill="none" stroke="#8a3a3a" stroke-width="0.95" stroke-linecap="round"/>
  <path d="M16,18 C19,14 25,15 28,20" fill="none" stroke="#8a3a3a" stroke-width="0.95" stroke-linecap="round"/>
  <path d="M24,13 C27,9 33,10 35,15" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linecap="round"/>
  <path d="M34,10 C36,6 41,7 41,12" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linecap="round"/>
  <!-- left wing covert feathers (tier 2) -->
  <path d="M22,34 C26,30 32,31 34,36" fill="none" stroke="#8a3a3a" stroke-width="0.75" stroke-linecap="round" opacity="0.65"/>
  <path d="M30,40 C34,36 40,38 40,43" fill="none" stroke="#8a3a3a" stroke-width="0.75" stroke-linecap="round" opacity="0.65"/>
  <!-- left wing flame tips -->
  <path d="M9,23 C6,20 8,16 10,18 C12,15 12,20 9,23 Z" fill="#c9a227" stroke="none" opacity="0.9"/>
  <path d="M15,16 C12,13 14,9 16,11 C18,9 17,13 15,16 Z" fill="#c9a227" stroke="none" opacity="0.8"/>

  <!-- RIGHT WING (mirror) -->
  <path d="M62,66 C80,56 92,40 90,24 C86,16 77,26 70,34 C67,24 69,12 62,8 C58,16 60,28 58,38 C54,28 53,16 47,14 C46,22 49,34 50,42"
        fill="#c4b5a0" stroke="#1a1208" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- right wing primary feathers -->
  <path d="M90,24 C87,20 81,21 76,26" fill="none" stroke="#8a3a3a" stroke-width="0.95" stroke-linecap="round"/>
  <path d="M84,18 C81,14 75,15 72,20" fill="none" stroke="#8a3a3a" stroke-width="0.95" stroke-linecap="round"/>
  <path d="M76,13 C73,9 67,10 65,15" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linecap="round"/>
  <path d="M66,10 C64,6 59,7 59,12" fill="none" stroke="#8a3a3a" stroke-width="0.9" stroke-linecap="round"/>
  <!-- right wing coverts -->
  <path d="M78,34 C74,30 68,31 66,36" fill="none" stroke="#8a3a3a" stroke-width="0.75" stroke-linecap="round" opacity="0.65"/>
  <path d="M70,40 C66,36 60,38 60,43" fill="none" stroke="#8a3a3a" stroke-width="0.75" stroke-linecap="round" opacity="0.65"/>
  <!-- right wing flame tips -->
  <path d="M91,23 C94,20 92,16 90,18 C88,15 88,20 91,23 Z" fill="#c9a227" stroke="none" opacity="0.9"/>
  <path d="M85,16 C88,13 86,9 84,11 C82,9 83,13 85,16 Z" fill="#c9a227" stroke="none" opacity="0.8"/>

  <!-- VIOLET GLOW AURA (Legendary only) -->
  <ellipse cx="50" cy="44" rx="28" ry="16" fill="none" stroke="#9370db" stroke-width="0.8" opacity="0.28" stroke-dasharray="2.5,3.5"/>

  <!-- BODY -->
  <ellipse cx="50" cy="63" rx="13" ry="15" fill="#c4b5a0" stroke="#1a1208" stroke-width="1.5"/>
  <!-- body feather scale rows -->
  <path d="M41,57 Q46,54 50,57 Q54,54 59,57" fill="none" stroke="#8a3a3a" stroke-width="0.85" opacity="0.55"/>
  <path d="M39,63 Q44,60 50,63 Q56,60 61,63" fill="none" stroke="#8a3a3a" stroke-width="0.85" opacity="0.5"/>
  <path d="M41,69 Q46,66 50,69 Q54,66 59,69" fill="none" stroke="#8a3a3a" stroke-width="0.8" opacity="0.45"/>
  <path d="M42,75 Q46,72 50,75 Q54,72 58,75" fill="none" stroke="#8a3a3a" stroke-width="0.75" opacity="0.4"/>

  <!-- NECK -->
  <path d="M44,50 Q50,46 56,50 L54,56 Q50,53 46,56 Z" fill="#c4b5a0" stroke="#1a1208" stroke-width="1.2"/>

  <!-- HEAD -->
  <circle cx="50" cy="31" r="13" fill="#e8dbb0" stroke="#1a1208" stroke-width="1.5"/>
  <!-- head feather marks -->
  <path d="M40,26 Q43,22 46,26" fill="none" stroke="#8a3a3a" stroke-width="0.75" opacity="0.45"/>
  <path d="M54,26 Q57,22 60,26" fill="none" stroke="#8a3a3a" stroke-width="0.75" opacity="0.45"/>

  <!-- CREST PLUMES (5, rising from crown) -->
  <path d="M50,18 C50,12 50,6 50,2" fill="none" stroke="#c9a227" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M50,2 C48,0 52,0 50,2 Z" fill="#c9a227" stroke="none"/>
  <path d="M46,19 C42,12 38,7 36,3" fill="none" stroke="#c9a227" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M35,3 C33,1 38,0 36,3 Z" fill="#c9a227" stroke="none"/>
  <path d="M54,19 C58,12 62,7 64,3" fill="none" stroke="#c9a227" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M65,3 C67,1 62,0 64,3 Z" fill="#c9a227" stroke="none"/>
  <path d="M44,20 C38,15 32,11 30,7" fill="none" stroke="#8a3a3a" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M29,7 C27,5 32,3 30,7 Z" fill="#8a3a3a" stroke="none"/>
  <path d="M56,20 C62,15 68,11 70,7" fill="none" stroke="#8a3a3a" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M71,7 C73,5 68,3 70,7 Z" fill="#8a3a3a" stroke="none"/>

  <!-- BEAK (hooked) -->
  <path d="M47,36 C46,32 50,29 54,33 C52,38 48,40 47,36 Z" fill="#c9a227" stroke="#1a1208" stroke-width="0.9"/>

  <!-- EYE (gold iris, dark pupil) -->
  <circle cx="44" cy="29" r="4.5" fill="#c9a227" stroke="#1a1208" stroke-width="1.1"/>
  <circle cx="44" cy="29" r="2.8" fill="#1a1208" stroke="none"/>
  <circle cx="45.1" cy="27.9" r="1" fill="#e8dbb0" stroke="none"/>

  <!-- ORNAMENTAL FLOURISHES (maximum, Legendary) -->
  <!-- all four corner clusters, larger -->
  <circle cx="5" cy="5" r="2.4" fill="#c9a227" stroke="none"/>
  <circle cx="9" cy="3" r="1.5" fill="#c9a227" stroke="none"/>
  <circle cx="3" cy="9" r="1.5" fill="#c9a227" stroke="none"/>
  <circle cx="7" cy="13" r="1" fill="#c9a227" stroke="none"/>
  <path d="M7,6 C5,3 9,1 9,5" fill="none" stroke="#c9a227" stroke-width="1" opacity="0.7"/>
  <circle cx="95" cy="5" r="2.4" fill="#c9a227" stroke="none"/>
  <circle cx="91" cy="3" r="1.5" fill="#c9a227" stroke="none"/>
  <circle cx="97" cy="9" r="1.5" fill="#c9a227" stroke="none"/>
  <circle cx="93" cy="13" r="1" fill="#c9a227" stroke="none"/>
  <path d="M93,6 C95,3 91,1 91,5" fill="none" stroke="#c9a227" stroke-width="1" opacity="0.7"/>
  <!-- side curl chains -->
  <path d="M4,38 C2,32 8,28 7,34" fill="none" stroke="#c9a227" stroke-width="1.1" opacity="0.7"/>
  <path d="M4,44 C2,40 7,38 7,42" fill="none" stroke="#c9a227" stroke-width="1" opacity="0.6"/>
  <path d="M4,50 C3,46 7,45 7,49" fill="none" stroke="#c9a227" stroke-width="0.9" opacity="0.55"/>
  <path d="M96,38 C98,32 92,28 93,34" fill="none" stroke="#c9a227" stroke-width="1.1" opacity="0.7"/>
  <path d="M96,44 C98,40 93,38 93,42" fill="none" stroke="#c9a227" stroke-width="1" opacity="0.6"/>
  <path d="M96,50 C97,46 93,45 93,49" fill="none" stroke="#c9a227" stroke-width="0.9" opacity="0.55"/>
  <!-- bottom spark dots -->
  <circle cx="8" cy="80" r="1.6" fill="#c9a227" stroke="none"/>
  <circle cx="92" cy="80" r="1.6" fill="#c9a227" stroke="none"/>
  <circle cx="6" cy="86" r="1" fill="#8a3a3a" stroke="none" opacity="0.7"/>
  <circle cx="94" cy="86" r="1" fill="#8a3a3a" stroke="none" opacity="0.7"/>

</svg>
```

**Growth Stages:**

- **Egg:** A dark charcoal-grey egg wrapped in a suggestion of ash: faint wisp-lines radiating outward from the base, rendered in the deep red ink, as if the egg sits in dying embers. A faint gold shimmer ring in manuscript gold circles the equator.
- **Nestling:** A small gold-tinted chick with a disproportionately large beak. Three small crest nubs visible but not yet plumes. Wing stubs suggested. Tail feathers are simple short spikes, not yet streaming. Eyes are open, alert.
- **Juvenile:** Crest plumes extending, first two tail plumes appearing. Wing feathers showing their first tier. The gold coloring becomes more prominent. The beak is fully curved. The violet aura is absent — not yet fully realized.
- **Adult:** Full five crest plumes, five tail plumes with gold flame tips, two wing tiers with flame tip marks, body feather scale rows, violet glow aura, maximum ornamental border. The most elaborate character in the roster.

**Ornamental Flourish Notes:** All four corner clusters with spiral sub-marks, three-element side curl chains on both sides, bottom spark dot pairs (gold + deep red), and the violet dashed ellipse halo around the wings. The ornaments at this tier become structural — they frame the character as if it belongs on an illuminated manuscript capital letter.

---

## Roster

| Tier | Character | Slug | Silhouette Key Feature | Visual Complexity |
|---|---|---|---|---|
| Common | Library Cat | `cat` | Sitting quad, two triangular ears, side tail | Simplest — clean ink tabby |
| Uncommon | Fennec Fox | `fennec` | Ears consume half the frame height | Ear vein lines, fluffy tail, ear-base flourishes |
| Rare | Snowy Owl | `owl` | Round head (no ears), barrel body, perch branch | Chevron barring, three-ring eyes, facial disc arcs |
| Epic | Axolotl | `axolotl` | Wide flat head, candelabra gill frills both sides | Six-stalk filigree frills in manuscript gold |
| Legendary | Phoenix | `phoenix` | Wings up, five crest plumes, five tail plumes | Maximum — feather tiers, flame tips, violet aura |
