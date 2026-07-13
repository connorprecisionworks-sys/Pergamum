"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify, detectVariableNames } from "@/lib/utils";
import type { Json, PromptVariable, PromptWithAuthor } from "@/lib/types/database";

// The single insert path into `prompts`. Creators self-publish — no admin
// approval queue for a creator's own content (CREATOR-AUTHORING-REDESIGN-SPEC.md).
// Every caller (submit form, builder, pack "new prompt" sheet, paste-import)
// funnels through here so publish behavior never diverges between them.

export interface CreateLibraryPromptInput {
  title: string;
  body: string;
  description?: string | null;
  category_id?: string | null;
  model_tags?: string[];
  tags?: string[];
  /**
   * Full variable metadata (name + optional description/default/type), used
   * by the submit form which collects it explicitly. Callers that don't
   * collect metadata (builder, paste-import) omit this and get variables
   * auto-extracted from the body's {{...}} tokens instead.
   */
  variables?: PromptVariable[];
  forked_from_id?: string | null;
}

export interface CreateLibraryPromptResult {
  error?: string;
  prompt?: PromptWithAuthor;
}

export async function createLibraryPrompt(
  input: CreateLibraryPromptInput
): Promise<CreateLibraryPromptResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const body = input.body.trim();
  if (!body) return { error: "Prompt body can't be empty." };

  const title = input.title.trim() || "Untitled prompt";
  const description =
    input.description?.trim() || body.slice(0, 160).replace(/\s+/g, " ");
  const variables =
    input.variables ??
    detectVariableNames(body).map((name) => ({ name, type: "text" as const }));

  const base = slugify(title);
  const { data: existing } = await supabase
    .from("prompts")
    .select("slug")
    .like("slug", `${base}%`);
  const existingSlugs = (existing ?? []).map((p) => p.slug);
  let slug = base;
  if (existingSlugs.includes(slug)) {
    let i = 2;
    while (existingSlugs.includes(`${base}-${i}`)) i++;
    slug = `${base}-${i}`;
  }

  const { data, error } = await supabase
    .from("prompts")
    .insert({
      author_id: user.id,
      title,
      slug,
      body,
      description,
      category_id: input.category_id ?? null,
      model_tags: input.model_tags?.length ? input.model_tags : ["any"],
      tags: input.tags ?? [],
      variables: variables as Json,
      status: "published",
      published_at: new Date().toISOString(),
      forked_from_id: input.forked_from_id ?? null,
    })
    .select(
      "*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)"
    )
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to publish." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/prompts");
  return { prompt: data as unknown as PromptWithAuthor };
}

export interface ImportPromptRow {
  title: string;
  body: string;
}

export interface ImportLibraryPromptsResult {
  imported: PromptWithAuthor[];
  errors: { row: number; message: string }[];
}

/**
 * Creator-facing bulk import (CREATOR-AUTHORING-REDESIGN-SPEC.md phase 3) —
 * a safe sibling to the admin importer (app/(app)/admin/import/actions.ts),
 * which uses the service client and trusts a client-supplied author_id.
 * This one runs every row through createLibraryPrompt, so it inherits the
 * same session-derived author_id, RLS-respecting client, and slug handling —
 * inserted one at a time (not in parallel) so each row's slug-collision
 * check sees the previous row's insert.
 */
export async function importPromptsForCreator(
  rows: ImportPromptRow[]
): Promise<ImportLibraryPromptsResult> {
  const imported: PromptWithAuthor[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = await createLibraryPrompt({
      title: rows[i].title,
      body: rows[i].body,
    });
    if (result.error || !result.prompt) {
      errors.push({ row: i + 1, message: result.error ?? "Failed to import." });
    } else {
      imported.push(result.prompt);
    }
  }

  return { imported, errors };
}
