"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PromptExample } from "@/lib/types/database";

// Server actions for the /build prompt builder. Drafts are private to their
// author (RLS enforces this) and exist purely as a working scratchpad for the
// builder UI. They never appear in the public library — to publish, the user
// hands a draft off to /submit which copies it into the prompts table.

export interface DraftInput {
  id?: string;
  title?: string;
  goal?: string;
  role: string;
  context: string;
  task: string;
  constraints: string;
  output_format: string;
  examples?: PromptExample[];
}

interface ActionResult {
  success: boolean;
  error?: string;
  draftId?: string;
}

export async function saveDraft(input: DraftInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to save drafts." };
  }

  // Sanitise examples: drop empty pairs, cap to a reasonable number.
  const examples = (input.examples ?? [])
    .map((e) => ({ input: e.input ?? "", output: e.output ?? "" }))
    .filter((e) => e.input.trim() || e.output.trim())
    .slice(0, 10);

  const payload = {
    author_id: user.id,
    title: input.title?.trim() || null,
    goal: input.goal?.trim() || null,
    role: input.role ?? "",
    context: input.context ?? "",
    task: input.task ?? "",
    constraints: input.constraints ?? "",
    output_format: input.output_format ?? "",
    examples,
  };

  if (input.id) {
    const { error } = await supabase
      .from("prompt_drafts")
      .update({
        title: payload.title,
        goal: payload.goal,
        role: payload.role,
        context: payload.context,
        task: payload.task,
        constraints: payload.constraints,
        output_format: payload.output_format,
        examples: payload.examples,
      })
      .eq("id", input.id)
      .eq("author_id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/build");
    revalidatePath("/dashboard");
    return { success: true, draftId: input.id };
  }

  const { data, error } = await supabase
    .from("prompt_drafts")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to save draft." };
  }

  revalidatePath("/build");
  revalidatePath("/dashboard");
  return { success: true, draftId: data.id };
}

export async function deleteDraft(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in." };
  }

  const { error } = await supabase
    .from("prompt_drafts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/build");
  revalidatePath("/dashboard");
  return { success: true };
}
