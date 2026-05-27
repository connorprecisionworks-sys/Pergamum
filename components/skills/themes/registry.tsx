import type { ComponentType } from "react";
import type { SkillWithAuthor } from "@/lib/types/database";
import { EditorialLight } from "./editorial-light";
import { TechnicalDark } from "./technical-dark";
import { WarmModern } from "./warm-modern";
import { MinimalEditorial } from "./minimal-editorial";

export interface ThemeProps {
  skill: SkillWithAuthor;
  mode?: "card" | "detail";
}

/**
 * Registry of featured-skill card themes. Each entry is a fully
 * bespoke component that renders the skill card from scratch.
 *
 * Featured skills reference these by name via skills.theme_id.
 * Skills without a matching theme_id fall back to the default
 * Vivid Hybrid card.
 */
export const themeRegistry: Record<string, ComponentType<ThemeProps>> = {
  "editorial-light": EditorialLight,      // Impeccable — cream + italic serif + pink curls
  "technical-dark": TechnicalDark,        // Remotion — black + bold sans + blue swoosh
  "warm-modern": WarmModern,              // Taste Skill — cream + bold sans + orange accent
  "minimal-editorial": MinimalEditorial,  // Emil Kowalski — white + plain sans + purple highlight
};

export function getTheme(themeId: string | null | undefined) {
  if (!themeId) return null;
  return themeRegistry[themeId] ?? null;
}
