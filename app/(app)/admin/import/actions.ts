"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export interface ImportPromptInput {
  title: string;
  description: string;
  body: string;
  category_id: string | null;
  model_tags: string[];
  tags: string[];
  variables: { name: string; type: "text" }[];
  author_id: string;
}

export interface ImportResult {
  imported: number;
  errors: { row: number; message: string }[];
}

const BATCH_SIZE = 50;

export async function importPrompts(
  prompts: ImportPromptInput[]
): Promise<ImportResult> {
  const serviceClient = await createServiceClient();

  // Fetch all existing slugs once so collision handling is O(n) not O(n²)
  const { data: existingSlugsData } = await serviceClient
    .from("prompts")
    .select("slug");

  const takenSlugs = new Set((existingSlugsData ?? []).map((p) => p.slug));

  const publishedAt = new Date().toISOString();

  const withSlugs = prompts.map((p) => {
    const base = slugify(p.title);
    let slug = base;
    if (takenSlugs.has(slug)) {
      let i = 2;
      while (takenSlugs.has(`${base}-${i}`)) i++;
      slug = `${base}-${i}`;
    }
    takenSlugs.add(slug);
    return { ...p, slug, status: "published", published_at: publishedAt };
  });

  let imported = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < withSlugs.length; i += BATCH_SIZE) {
    const batch = withSlugs.slice(i, i + BATCH_SIZE);
    const { data, error } = await serviceClient
      .from("prompts")
      .insert(batch)
      .select("id");

    if (error) {
      batch.forEach((_, j) => {
        errors.push({ row: i + j + 1, message: error.message });
      });
    } else {
      imported += (data ?? []).length;
    }
  }

  return { imported, errors };
}
