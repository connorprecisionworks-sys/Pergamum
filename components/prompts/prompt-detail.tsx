"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Eye, Flag, Tag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./copy-button";
import { VoteButtons } from "./vote-buttons";
import { VariableForm } from "./variable-form";
import { ModelBadge } from "./model-badge";
import { formatCount, relativeTime } from "@/lib/utils";
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

  const handleSubstitutedChange = useCallback((text: string) => {
    setSubstitutedBody(text);
  }, []);

  const handleReport = async () => {
    if (!currentUserId) {
      toast.error("Sign in to report prompts.");
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
      toast.error("Failed to submit report.");
    } else {
      toast.success("Report submitted. Thank you!");
    }
  };

  const initials = author?.display_name
    ? author.display_name.slice(0, 2).toUpperCase()
    : author?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <Link
              href={`/prompts?category=${category.slug}`}
              className="text-sm font-medium text-pergamum-600 hover:text-pergamum-700"
            >
              {category.name}
            </Link>
          )}
          {prompt.model_tags.map((m) => (
            <ModelBadge key={m} model={m} />
          ))}
        </div>

        <h1 className="text-3xl font-bold tracking-tight">{prompt.title}</h1>

        {prompt.description && (
          <p className="text-muted-foreground text-lg leading-relaxed">
            {prompt.description}
          </p>
        )}

        {/* Author + meta */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={author?.avatar_url ?? undefined}
                alt={author?.display_name ?? author?.username ?? ""}
              />
              <AvatarFallback className="text-xs bg-pergamum-100 text-pergamum-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <Link
                href={`/u/${author?.username}`}
                className="font-medium hover:text-pergamum-600 transition-colors"
              >
                {author?.display_name ?? author?.username}
              </Link>
              <span className="text-muted-foreground ml-2">
                {relativeTime(prompt.published_at ?? prompt.created_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{formatCount(prompt.views)} uses</span>
          </div>
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
      {Array.isArray(prompt.variables) && prompt.variables.length > 0 && (
        <>
          <VariableForm
            variables={prompt.variables as unknown as PromptVariable[]}
            body={prompt.body}
            onSubstitutedChange={handleSubstitutedChange}
          />
          <Separator />
        </>
      )}

      {/* Prompt body */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Prompt
            {Array.isArray(prompt.variables) && prompt.variables.length > 0 && (
              <span className="ml-2 text-pergamum-500 font-normal lowercase">
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

        <div className="relative rounded-xl border bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
          <pre className="prompt-body p-6 text-sm overflow-x-auto">
            {substitutedBody}
          </pre>
        </div>

        <div className="flex items-center gap-3 justify-between flex-wrap">
          <CopyButton text={substitutedBody} promptId={prompt.id} />
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
