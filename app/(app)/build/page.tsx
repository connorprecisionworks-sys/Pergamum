import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasBuildAccess } from "@/lib/build-access";
import { Builder } from "./builder";
import { BuildGate } from "./gate";
import type { PromptDraft } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Build a prompt",
  description:
    "A 5-block prompt builder. Build it for yourself first — share it if it helps others.",
};

interface BuildPageProps {
  searchParams: Promise<{ draft?: string }>;
}

export default async function BuildPage({ searchParams }: BuildPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/build");
  }

  // Soft beta gate — if BUILD_ACCESS_CODE is set on the server and the user
  // hasn't entered it yet, render the gate UI instead of the builder.
  const accessOk = await hasBuildAccess();
  if (!accessOk) {
    return (
      <div className="px-6 md:px-10 py-10 md:py-14 max-w-[860px] mx-auto">
        <BuildGate />
      </div>
    );
  }

  const params = await searchParams;

  // Load existing draft if requested. RLS guarantees we'll only see our own.
  let initialDraft: PromptDraft | null = null;
  if (params.draft) {
    const { data } = await supabase
      .from("prompt_drafts")
      .select("*")
      .eq("id", params.draft)
      .single();
    initialDraft = (data as PromptDraft | null) ?? null;
  }

  // Recent drafts for the side picker — most recent first.
  const { data: recentDraftsRaw } = await supabase
    .from("prompt_drafts")
    .select("id, title, goal, updated_at")
    .order("updated_at", { ascending: false })
    .limit(8);

  const recentDrafts =
    (recentDraftsRaw as Pick<
      PromptDraft,
      "id" | "title" | "goal" | "updated_at"
    >[] | null) ?? [];

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-[860px] mx-auto">
      <header className="mb-8 max-w-[640px] mx-auto text-center">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-3">
          Builder
        </p>
        <h1 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em]">
          Design once. Use it forever.
        </h1>
        <p className="mt-3 text-[14px] md:text-[15px] text-muted-foreground leading-[1.55]">
          The builder is for the prompts that earn their keep — the ones
          you&apos;ll run every week with new inputs. Describe what you want,
          mark the parts that should change between runs, test it on real
          data, then save it for next time.
        </p>
      </header>

      <Builder
        userId={user.id}
        initialDraft={initialDraft}
        recentDrafts={recentDrafts}
      />
    </div>
  );
}
