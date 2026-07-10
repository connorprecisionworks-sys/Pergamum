import { cn } from "@/lib/utils";

interface PackCoverProps {
  title: string;
  /** Deterministic seed — same seed always renders the same facets. */
  seed: string;
  /** Hex color for the single accent facet. Defaults to Ink (brand-600). */
  accent?: string | null;
  className?: string;
}

const HEX_SIZE = 34;
const VIEWBOX = 320;
const DEFAULT_ACCENT = "#3C5F86";

// Deterministic string hash → 32-bit seed, then a small PRNG. Never
// Math.random(): the same pack + seed must always render the same cover.
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let state = seed;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Flat-top hexagon points — the angular facet language shared with the
// logo mark's hexagonal geometry.
function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + size * Math.cos(angle)).toFixed(1)},${(cy + size * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function PackCover({ title, seed, accent, className }: PackCoverProps) {
  const rand = mulberry32(hashSeed(seed || title));
  const accentColor = accent || DEFAULT_ACCENT;

  const w = HEX_SIZE * 1.5;
  const h = HEX_SIZE * Math.sqrt(3);
  const cols = Math.ceil(VIEWBOX / w) + 2;
  const rows = Math.ceil(VIEWBOX / h) + 2;

  const hexes: { cx: number; cy: number; gray: number }[] = [];
  for (let col = -1; col < cols; col++) {
    for (let row = -1; row < rows; row++) {
      const cx = col * w;
      const cy = row * h + (Math.abs(col % 2) === 1 ? h / 2 : 0);
      if (cx < -HEX_SIZE || cx > VIEWBOX + HEX_SIZE || cy < -HEX_SIZE || cy > VIEWBOX + HEX_SIZE) continue;
      const jitter = rand();
      const diag = (cx + cy) / (VIEWBOX * 2);
      const gray = Math.max(0.05, Math.min(0.85, diag * 0.55 + jitter * 0.4));
      hexes.push({ cx, cy, gray });
    }
  }

  // Pick the single accent facet nearest a seeded focal point.
  const focalX = rand() * VIEWBOX;
  const focalY = rand() * VIEWBOX;
  let accentIdx = 0;
  let bestDist = Infinity;
  hexes.forEach((hex, i) => {
    const d = (hex.cx - focalX) ** 2 + (hex.cy - focalY) ** 2;
    if (d < bestDist) {
      bestDist = d;
      accentIdx = i;
    }
  });

  return (
    <div className={cn("relative aspect-square w-full overflow-hidden rounded-md bg-[#0B0B0D]", className)}>
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {hexes.map((hex, i) => (
          <polygon
            key={i}
            points={hexPoints(hex.cx, hex.cy, HEX_SIZE - 1)}
            fill={i === accentIdx ? accentColor : `rgba(255,255,255,${hex.gray.toFixed(3)})`}
            stroke="#000000"
            strokeOpacity={0.35}
            strokeWidth={0.5}
          />
        ))}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-serif text-white text-lg leading-tight line-clamp-3">{title}</p>
      </div>
    </div>
  );
}
