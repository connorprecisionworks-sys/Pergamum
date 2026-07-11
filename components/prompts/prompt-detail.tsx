"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, GitFork, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./copy-button";
import { InlinePromptBody } from "./inline-prompt-body";
import { LaunchButtons } from "./launch-buttons";
import { PresetPanel } from "./preset-panel";
import { ClaimButton } from "./claim-button";
import { SavePromptButton } from "./save-prompt-button";
import { ModelBadge } from "./model-badge";
import { formatCount, relativeTime, detectVariableNames, substituteVariables } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { savePendingClaim } from "@/lib/anon-claim";
import type { PromptWithAuthor, PromptVariable, PromptVersion } from "@/lib/types/database";

interface PromptDetailProps {
  prompt: PromptWithAuthor;
  currentUserId: string | null;
  /** Ordered version DESC; empty unless the prompt has been edited-and-republished at least once. */
  versions: PromptVersion[];
  /** Whether the current user already has this prompt in prompt_saves. */
  initiallySaved?: boolean;
  /** Seeds the variable form — used by /library's "Run again" and preset "Load" deep-links. */
  initialValues?: Record<string, string>;
}

export function PromptDetail({
  prompt,
  currentUserId,
  versions,
  initiallySaved = false,
  initialValues,
}: PromptDetailProps) {
  const author = prompt.profiles;
  const category = prompt.categories;

  // Merge stored variable metadata with body-detected names so prompts
  // submitted before auto-detection was added still show the input form.
  const stored = Array.isArray(prompt.variables)
    ? (prompt.variables as unknown as PromptVariable[])
    : [];
  const storedByName = new Map(stored.map((v) => [v.name, v]));
  const variables: PromptVariable[] = detectVariableNames(prompt.body).map(
    (name) => storedByName.get(name) ?? { name, type: "text" }
  );

  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults = Object.fromEntries(variables.map((v) => [v.name, v.default ?? ""]));
    return initialValues ? { ...defaults, ...initialValues } : defaults;
  });
  const substitutedBody = substituteVariables(prompt.body, values);

  const filledCount = variables.filter((v) => (values[v.name] ?? "").trim().length > 0).length;

  // Anonymous carryover: keep the in-progress state ready to claim on auth.
  useEffect(() => {
    if (!currentUserId) {
      savePendingClaim(prompt.id, values, prompt.author_id);
    }
  }, [currentUserId, prompt.id, prompt.author_id, values]);

  const handleReport = async () => {
    if (!currentUserId) {
      toast.error("Sign in to report this prompt.");
      return;
    }
    const reason = window.prompt(
      "Why are you reporting this prompt? (spam, inappropriate content, etc.)"
    );
    if (!reason?.trim()) return;

    const supabase = createClient();
    const { error } = await supabase.from("reports").insert({
      reporter_id: currentUserId,
      prompt_id: prompt.id,
      reason: reason.trim(),
    });

    if (error) {
      toast.error("Couldn't submit your report. Try again.");
    } else {
      toast.success("Report submitted — thanks for keeping the library tidy.");
    }
  };

  const initials = author?.display_name
    ? author.display_name.slice(0, 2).toUpperCase()
    : author?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <article className="mx-auto max-w-[760px] overflow-hidden rounded-[20px] bg-card shadow-[0_24px_70px_rgba(28,30,40,0.16)]">
      {/* Masthead */}
      <div className="px-8 pt-12 md:px-[72px] md:pt-16">
        {category && (
          <Link
            href={`/prompts?category=${category.slug}`}
            className="mb-7 block text-[11px] uppercase tracking-[0.16em] text-foreground-subtle transition-colors hover:text-foreground-muted"
          >
            {category.name}
          </Link>
        )}

        <h1 className="m-0 mb-5 max-w-[14ch] text-[clamp(2rem,4.6vw,56px)] font-normal leading-[0.98] -tracking-[0.025em] text-foreground">
          {prompt.title}
        </h1>

        {prompt.description && (
          <p className="m-0 mb-8 max-w-[46ch] text-[18px] leading-[1.5] text-foreground-muted">
            {prompt.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-9">
          <Avatar className="h-[30px] w-[30px] shrink-0">
            <AvatarImage
              src={author?.avatar_url ?? undefined}
              alt={author?.display_name ?? author?.username ?? ""}
            />
            <AvatarFallback className="bg-secondary text-[10px] text-foreground-muted">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/u/${author?.username}`}
            className="text-[13px] text-foreground-muted transition-colors hover:text-foreground"
          >
            @{author?.username}
          </Link>

          <span className="ml-auto flex flex-wrap items-center gap-3">
            {prompt.model_tags.map((m) => (
              <ModelBadge key={m} model={m} />
            ))}
            {(prompt.copies ?? 0) >= 5 && (
              <span className="text-xs text-foreground-subtle">
                {formatCount(prompt.copies)} uses
              </span>
            )}
            <span className="text-xs text-foreground-subtle">
              {relativeTime(prompt.published_at ?? prompt.created_at)}
            </span>
          </span>
        </div>
      </div>

      {/* The workspace — one read-and-type object */}
      <div className="px-8 pb-10 pt-9 md:px-[72px]">
        {variables.length > 0 && (
          <div className="mb-5 text-[11px] tracking-[0.06em] text-foreground-subtle">
            {filledCount} of {variables.length} field{variables.length === 1 ? "" : "s"} filled
          </div>
        )}

        <InlinePromptBody
          body={prompt.body}
          variables={variables}
          values={values}
          onValuesChange={setValues}
        />

        {variables.length > 0 && currentUserId && (
          <div className="mt-7 flex justify-end">
            <PresetPanel
              promptId={prompt.id}
              currentUserId={currentUserId}
              values={values}
              onLoadValues={setValues}
            />
          </div>
        )}
      </div>

      {/* Action rail */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-8 py-5 md:px-[72px]">
        <CopyButton
          text={substitutedBody}
          promptId={prompt.id}
          currentUserId={currentUserId}
          values={values}
          className="h-[46px] rounded-full px-7 text-[15px] font-semibold"
        />
        <LaunchButtons
          text={substitutedBody}
          promptId={prompt.id}
          currentUserId={currentUserId}
          values={values}
        />
        {!currentUserId && <ClaimButton returnTo={`/prompts/${prompt.slug}`} />}
        {currentUserId && (
          <span className="ml-auto">
            <SavePromptButton
              promptId={prompt.id}
              currentUserId={currentUserId}
              initiallySaved={initiallySaved}
            />
          </span>
        )}
      </div>

      {/* Secondary rail — everything the mockup's rail doesn't show but the
          route already wires up. Kept, quieted. */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border px-8 py-4 md:px-[72px]">
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {prompt.tags.map((tag) => (
              <Link
                key={tag}
                href={`/prompts?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground-subtle transition-colors hover:border-border-strong hover:text-foreground"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {currentUserId && currentUserId !== prompt.author_id && (
            <Button variant="ghost" size="sm" className="text-foreground-subtle" asChild>
              <Link href={`/submit?fork_from=${prompt.id}`}>
                <GitFork className="mr-1.5 h-3.5 w-3.5" />
                Remix
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReport}
            className="text-foreground-subtle hover:text-foreground"
            aria-label="Report this prompt"
          >
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            Report
          </Button>
        </div>
      </div>

      {/* Version history — only present once a prompt has been edited-and-republished */}
      {versions.length > 0 && (
        <details className="group border-t border-border px-8 py-4 md:px-[72px]">
          <summary className="flex w-fit cursor-pointer select-none list-none items-center gap-1.5 text-xs text-foreground-subtle transition-colors hover:text-foreground">
            <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
            Version history ({versions.length + 1})
          </summary>
          <div className="mt-3 space-y-2.5 border-l border-border pl-4">
            {versions.map((v) => (
              <div key={v.id} className="text-xs">
                <span className="text-foreground-subtle">v{v.version}</span>{" "}
                <span className="text-foreground-muted">{relativeTime(v.created_at)}</span>
                {v.changelog && <p className="mt-0.5 text-foreground/80">{v.changelog}</p>}
              </div>
            ))}
            <div className="text-xs">
              <span className="text-foreground-subtle">v1</span>{" "}
              <span className="text-foreground-muted">
                {relativeTime(prompt.published_at ?? prompt.created_at)}
              </span>
              <p className="mt-0.5 text-foreground/80">Initial publish.</p>
            </div>
          </div>
        </details>
      )}
    </article>
  );
}
