import type { ComponentType } from "react";
import type { SkillWithAuthor } from "@/lib/types/database";
import { EditorialLight } from "./editorial-light";

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
  "editorial-light": EditorialLight,
};

export function getTheme(themeId: string | null | undefined) {
  if (!themeId) return null;
  return themeRegistry[themeId] ?? null;
}
