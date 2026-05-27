"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Eye, Flag, Tag, GitFork } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./copy-button";
import { VoteButtons } from "./vote-buttons";
import { VariableForm } from "./variable-form";
import { ModelBadge } from "./model-badge";
import { formatCount, relativeTime, categoryColor, detectVariableNames } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { PromptWithAuthor, VoteValue, PromptVariable } from "@/lib/types/database";

interface PromptDetailProps {
  prompt: PromptWithAuthor;
  currentUserId: string | null;
  currentVote: VoteValue | null;
}

export function PromptDetail({
  prompt,
  currentUserId,
  currentVote,
}: PromptDetailProps) {
  const [substitutedBody, setSubstitutedBody] = useState(prompt.body);
  const author = prompt.profiles;
  const category = prompt.categories;
  const accentColor = categoryColor(category?.slug ?? null);

  // Merge stored variable metadata with body-detected names so prompts
  // submitted before auto-detection was added still show the input form.
  const stored = Array.isArray(prompt.variables)
    ? (prompt.variables as unknown as PromptVariable[])
    : [];
  const storedByName = new Map(stored.map((v) => [v.name, v]));
  const variables: PromptVariable[] = detectVariableNames(prompt.body).map(
    (name) => storedByName.get(name) ?? { name, type: "text" }
  );

  const handleSubstitutedChange = useCallback((text: string) => {
    setSubstitutedBody(text);
  }, []);

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
    <article className="max-w-3xl mx-auto space-y-8">
      {/* Hero header — same radial-gradient treatment as browse pages */}
      <div className="rounded-lg px-6 py-7 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)] space-y-4">
        {/* Category dot + label | model badges */}
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <Link
              href={`/prompts?category=${category.slug}`}
              className="flex items-center gap-2 group/cat"
            >
              <span
                className="inline-block w-[7px] h-[7px] rounded-full shrink-0"
                style={{ backgroundColor: accentColor }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground-muted group-hover/cat:text-foreground transition-colors">
                {category.name}
              </span>
            </Link>
          )}
          {prompt.model_tags.map((m) => (
            <ModelBadge key={m} model={m} />
          ))}
        </div>

        <h1 className="text-3xl font-medium tracking-tight">{prompt.title}</h1>

        {prompt.description && (
          <p className="text-muted-foreground text-lg leading-relaxed">
            {prompt.description}
          </p>
        )}

        {/* Author + meta — label-mono treatment matching card footer */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage
                src={author?.avatar_url ?? undefined}
                alt={author?.display_name ?? author?.username ?? ""}
              />
              <AvatarFallback className="text-xs bg-pergamum-100 text-pergamum-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Link
              href={`/u/${author?.username}`}
              className="text-sm font-medium hover:text-pergamum-600 transition-colors"
            >
              {author?.display_name ?? author?.username}
            </Link>
            <span className="label-mono opacity-40">·</span>
            <span className="label-mono">
              {relativeTime(prompt.published_at ?? prompt.created_at)}
            </span>
          </div>
          {(prompt.views ?? 0) >= 5 && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-foreground-subtle" />
              <span className="label-mono">{formatCount(prompt.views)} uses</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {prompt.tags.map((tag) => (
              <Link
                key={tag}
                href={`/prompts?tag=${encodeURIComponent(tag)}`}
                className="text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2 py-0.5 rounded transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Variables */}
      {variables.length > 0 && (
        <>
          <VariableForm
            variables={variables}
            body={prompt.body}
            onSubstitutedChange={handleSubstitutedChange}
          />
          <Separator />
        </>
      )}

      {/* Prompt body */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
            Prompt
            {variables.length > 0 && (
              <span className="ml-2 text-pergamum-500 normal-case tracking-normal font-mono text-[11px]">
                (live preview)
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <VoteButtons
              promptId={prompt.id}
              initialUpvotes={prompt.upvotes}
              initialDownvotes={prompt.downvotes}
              currentVote={currentVote}
            />
          </div>
        </div>

        {/* Body container — same visual language as the install chip */}
        <div className="relative bg-background-inset border border-border rounded-md overflow-hidden">
          <pre className="prompt-body p-5 overflow-x-auto">
            {substitutedBody}
          </pre>
        </div>

        <div className="flex items-center gap-3 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            <CopyButton text={substitutedBody} promptId={prompt.id} />
            {currentUserId && currentUserId !== prompt.author_id && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/submit?fork_from=${prompt.id}`}>
                  <GitFork className="h-4 w-4 mr-1.5" />
                  Remix
                </Link>
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReport}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Report this prompt"
          >
            <Flag className="h-4 w-4 mr-1.5" />
            Report
          </Button>
        </div>
      </div>
    </article>
  );
}
