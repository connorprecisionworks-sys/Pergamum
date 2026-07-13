import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a URL-safe slug from a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Append a numeric suffix to avoid slug collisions: my-slug-2, my-slug-3, … */
export function uniqueSlug(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** HN-style trending score: (upvotes - 1) / pow(hours + 2, 1.8) */
export function trendingScore(upvotes: number, publishedAt: string | null): number {
  if (!publishedAt) return 0;
  const hoursSince =
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  return Math.max(upvotes - 1, 0) / Math.pow(hoursSince + 2, 1.8);
}

/** Substitute {{variable}} placeholders in a prompt body */
export function substituteVariables(
  body: string,
  values: Record<string, string>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, name) => values[name] ?? match);
}

/** Pull unique {{variable}} names out of a prompt body, in first-seen order. */
export function detectVariableNames(body: string): string[] {
  if (!body) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const match of body.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      names.push(match[1]);
    }
  }
  return names;
}

/**
 * Normalize a user-submitted URL: add https:// when no scheme is present.
 * Returns null if the result still isn't a well-formed absolute URL, so
 * callers can reject it with an inline error instead of saving garbage.
 */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!url.hostname || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Normalize comma-separated tags: lowercase, trimmed, deduped */
export function normalizeTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

/** Format a number for display: 1200 → 1.2k */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Plain-English meaning of a creator_alert_settings.hot_threshold value (5-100) */
export function describeHotThreshold(value: number): string {
  if (value <= 24) {
    return "You'll hear about a lead the moment they show any real activity — even a single copy or run.";
  }
  if (value <= 49) {
    return "You'll hear about a lead once they show real, one-session usage — no comeback required.";
  }
  if (value <= 74) {
    return "You'll hear about a lead once they show real usage and come back on another day.";
  }
  return "You'll only hear about a lead once they've clearly kept coming back.";
}

/** Relative time string: "3 minutes ago", "2 days ago" */
export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

/**
 * Returns a hex color for the category accent used in left-border accents and
 * dot indicators. Non-brand colors use their Tailwind default hex values
 * because those shades don't exist in the project palette.
 */
export function categoryColor(slug: string | null | undefined): string {
  switch (slug) {
    case "writing":           return "#b299e5"; // brand-400
    case "coding":            return "#7447d1"; // brand-600
    case "agents":            return "#9370db"; // brand-500
    case "research":          return "#bbbbf1"; // brand-300
    case "data":
    case "data-analysis":     return "#6366f1"; // indigo-500 (no project shade)
    case "design":            return "#d946ef"; // fuchsia-500 (no project shade)
    case "ops":               return "#0ea5e9"; // sky-500 (no project shade)
    case "marketing":         return "#f59e0b"; // amber-500 (no project shade)
    case "web-development":   return "#10b981"; // emerald-500 (no project shade)
    case "image-generation":
    case "video-scripts":     return "#fb7185"; // rose-400 (no project shade)
    case "business-strategy": return "#818cf8"; // indigo-400 (no project shade)
    case "productivity":
    case "education":         return "#71717a"; // zinc-500 (no project shade)
    default:                  return "#9370db"; // brand-500
  }
}

// Provider colour palettes — same family shares a hue, so a row of model badges
// reads as a grouped visual signal.
const C_ANTHROPIC  = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
const C_OPENAI     = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
const C_GOOGLE     = "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400";
const C_META       = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
const C_MISTRAL    = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
const C_XAI        = "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-300";
const C_DEEPSEEK   = "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
const C_PERPLEXITY = "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
const C_IMAGE      = "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400";
const C_NEUTRAL    = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

export const MODEL_DISPLAY: Record<string, { label: string; color: string }> = {
  // Generic
  any: { label: "Any model", color: C_NEUTRAL },

  // Anthropic — tiers, not pinned versions, so these stay valid across releases.
  "claude-opus":   { label: "Claude Opus",   color: C_ANTHROPIC },
  "claude-sonnet": { label: "Claude Sonnet", color: C_ANTHROPIC },
  "claude-haiku":  { label: "Claude Haiku",  color: C_ANTHROPIC },

  // OpenAI — the tier name IS the version (GPT-5, GPT-4o, o1) so we pin.
  "gpt-5":   { label: "GPT-5",    color: C_OPENAI },
  "gpt-4.1": { label: "GPT-4.1",  color: C_OPENAI },
  "gpt-4o":  { label: "GPT-4o",   color: C_OPENAI },
  "o1":      { label: "o1",       color: C_OPENAI },
  "o3-mini": { label: "o3-mini",  color: C_OPENAI },

  // Google
  "gemini-pro":   { label: "Gemini Pro",   color: C_GOOGLE },
  "gemini-flash": { label: "Gemini Flash", color: C_GOOGLE },

  // Open-weights and others
  "llama":      { label: "Llama",      color: C_META },
  "mistral":    { label: "Mistral",    color: C_MISTRAL },
  "grok":       { label: "Grok",       color: C_XAI },
  "deepseek":   { label: "DeepSeek",   color: C_DEEPSEEK },
  "perplexity": { label: "Perplexity", color: C_PERPLEXITY },

  // Image / multimodal
  "midjourney":       { label: "Midjourney",       color: C_IMAGE },
  "dall-e":           { label: "DALL-E",           color: C_IMAGE },
  "stable-diffusion": { label: "Stable Diffusion", color: C_IMAGE },
  "flux":             { label: "Flux",             color: C_IMAGE },

  // Backward-compat: any prompt still tagged with the old generic family
  // names continues to render correctly.
  "claude": { label: "Claude (any)", color: C_ANTHROPIC },
  "gpt-4":  { label: "GPT-4 (any)",  color: C_OPENAI },
  "gemini": { label: "Gemini (any)", color: C_GOOGLE },
};
