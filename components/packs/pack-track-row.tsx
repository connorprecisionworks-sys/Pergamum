"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Lock, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { VariableForm } from "@/components/prompts/variable-form";
import { CopyButton } from "@/components/prompts/copy-button";
import { LaunchMenu } from "@/components/prompts/launch-menu";
import { PresetPanel } from "@/components/prompts/preset-panel";
import { InstallCommandBlock } from "@/components/skills/install-command-block";
import { detectVariableNames, substituteVariables, cn } from "@/lib/utils";
import type { PackGating, PackItemWithContent, PromptVariable } from "@/lib/types/database";

interface PackTrackRowProps {
  item: PackItemWithContent;
  index: number;
  currentUserId: string | null;
  ownerUsername: string;
  creatorName: string;
  gating: PackGating;
  packSlug: string;
  locked: boolean;
  defaultOpen: boolean;
}

export function PackTrackRow({
  item,
  index,
  currentUserId,
  ownerUsername,
  creatorName,
  gating,
  packSlug,
  locked,
  defaultOpen,
}: PackTrackRowProps) {
  const [open, setOpen] = useState(defaultOpen && !locked);
  const number = String(index + 1).padStart(2, "0");
  // A follower-locked row is a moment of desire, not a dead end — clicking
  // it scrolls to the unlock CTA instead of doing nothing. A paid-locked row
  // has no working purchase flow yet, so it stays a plain disabled preview.
  const unlockable = locked && gating === "follower";

  const content = item.item_type === "prompt" ? item.prompts : item.skills;
  if (!content) return null;

  const title = item.item_type === "prompt" ? item.prompts!.title : item.skills!.name;
  const permalink =
    item.item_type === "prompt"
      ? `/prompts/${item.prompts!.slug}`
      : `/skills/${item.skills!.slug}`;

  const copyPermalink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${permalink}?via=share`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const scrollToUnlock = () => {
    document.getElementById("unlock-cta")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => {
          if (unlockable) {
            scrollToUnlock();
            return;
          }
          if (!locked) setOpen((v) => !v);
        }}
        disabled={locked && !unlockable}
        className={cn(
          "w-full flex items-center gap-4 py-4 px-1 text-left transition-colors",
          locked && !unlockable ? "cursor-default opacity-70" : "hover:bg-background-subtle/40"
        )}
        aria-expanded={open}
      >
        <span className="font-mono text-[13px] text-foreground-subtle w-6 shrink-0 tabular-nums">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[15px] truncate">{title}</span>
            {locked && <Lock className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />}
          </div>
          {item.promise_line && (
            <p className="text-[13px] text-foreground-muted truncate mt-0.5">{item.promise_line}</p>
          )}
          {unlockable && (
            <p className="text-[13px] text-foreground-subtle mt-0.5">Follow {creatorName} to unlock →</p>
          )}
        </div>
        {!locked && item.item_type === "prompt" && (
          <span className="label-mono shrink-0 hidden sm:inline">
            {(item.prompts!.variables as unknown as PromptVariable[] | null)?.length
              ? `${(item.prompts!.variables as unknown as PromptVariable[]).length} fields`
              : `${detectVariableNames(item.prompts!.body).length} fields`}
          </span>
        )}
        {!locked && (
          <button
            type="button"
            onClick={copyPermalink}
            aria-label="Copy link to this track"
            className="p-1.5 rounded-md text-foreground-subtle hover:text-foreground hover:bg-background-subtle shrink-0"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
        )}
        {!locked && (
          <ChevronDown
            className={cn("h-4 w-4 text-foreground-subtle shrink-0 transition-transform", open && "rotate-180")}
          />
        )}
      </button>

      {open && !locked && (
        <div className="pb-6 px-1 space-y-5">
          {item.item_type === "prompt" ? (
            <PromptTrackBody prompt={item.prompts!} currentUserId={currentUserId} />
          ) : (
            <SkillTrackBody skill={item.skills!} />
          )}
          <Link
            href={permalink}
            className="inline-block text-xs text-foreground-subtle hover:text-foreground transition-colors"
          >
            Open full page →
          </Link>
        </div>
      )}
    </div>
  );
}

function PromptTrackBody({
  prompt,
  currentUserId,
}: {
  prompt: NonNullable<PackItemWithContent["prompts"]>;
  currentUserId: string | null;
}) {
  const stored = Array.isArray(prompt.variables) ? (prompt.variables as unknown as PromptVariable[]) : [];
  const storedByName = new Map(stored.map((v) => [v.name, v]));
  const variables: PromptVariable[] = detectVariableNames(prompt.body).map(
    (name) => storedByName.get(name) ?? { name, type: "text" }
  );
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((v) => [v.name, v.default ?? ""]))
  );
  const substitutedBody = substituteVariables(prompt.body, values);

  return (
    <div className="space-y-4">
      {variables.length > 0 && (
        <>
          <VariableForm variables={variables} values={values} onValuesChange={setValues} />
          {currentUserId && (
            <div className="flex justify-end">
              <PresetPanel
                promptId={prompt.id}
                currentUserId={currentUserId}
                values={values}
                onLoadValues={setValues}
              />
            </div>
          )}
        </>
      )}
      <div className="relative bg-background-inset border border-border rounded-md overflow-hidden">
        <pre className="prompt-body p-4 overflow-x-auto text-[13px]">{substitutedBody}</pre>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <CopyButton text={substitutedBody} promptId={prompt.id} currentUserId={currentUserId} values={values} />
        <LaunchMenu text={substitutedBody} promptId={prompt.id} currentUserId={currentUserId} values={values} />
      </div>
      <Separator />
    </div>
  );
}

function SkillTrackBody({ skill }: { skill: NonNullable<PackItemWithContent["skills"]> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted leading-relaxed">{skill.summary}</p>
      {skill.install_command && (
        <InstallCommandBlock skillId={skill.id} command={skill.install_command} />
      )}
      <Separator />
    </div>
  );
}
