"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SkillWithAuthor } from "@/lib/types/database";

interface ThemeProps {
  skill: SkillWithAuthor;
  mode?: "card" | "detail";
}

/**
 * minimal-editorial — the "Emil Kowalski" theme.
 *
 * Pure white background, plain sans-serif at medium weight, generous
 * whitespace, syntax-highlighted install command. The minimalism IS the
 * personality — everything else is restraint.
 */
export function MinimalEditorial({ skill, mode = "card" }: ThemeProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!skill.install_command) return;
    navigator.clipboard
      .writeText(skill.install_command)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
        toast.success("Install command copied to clipboard.");
        fetch("/api/skills/copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skillId: skill.id }),
        }).catch(() => {});
        if (mode === "card") setTimeout(() => router.push(`/skills/${skill.slug}`), 250);
      })
      .catch(() => toast.error("Couldn't copy. Try selecting the text manually."));
  };

  // Split the install command for fake syntax highlighting: first word
  // styled normal, "skills" / "add" / repo path get a purple accent.
  const renderCommand = (cmd: string) => {
    const parts = cmd.split(/(\s+)/);
    return parts.map((part, i) => {
      if (part === "skills" || part === "install" || part === "add") {
        return (
          <span key={i} className="text-purple-500">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="minimal-editorial-group group block relative overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 transition-[transform,box-shadow] duration-500 ease-out hover:scale-[1.01] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] animate-fade-in"
      style={{ minHeight: 460 }}
    >
      <div className="absolute top-4 right-5 font-mono text-[11px] text-zinc-400 z-10">
        ⤓ {skill.copies}
      </div>

      <div className="relative px-7 pt-7 pb-7 h-full flex flex-col">
        {/* Name block — like a personal letterhead */}
        <div className="mb-auto">
          <h3 className="text-[18px] font-medium text-zinc-900 leading-tight">
            {skill.name}
          </h3>
          <p className="text-[14px] text-zinc-500 leading-tight">
            {skill.category ? skill.category[0].toUpperCase() + skill.category.slice(1) : "Skill"}
          </p>
        </div>

        {/* Mid-card body */}
        <div className="my-12 max-w-[90%] space-y-3">
          <p className="text-[15px] text-zinc-800 leading-relaxed">
            {skill.summary}
          </p>
        </div>

        {/* Install command — clean container with purple syntax highlight */}
        {skill.install_command && (
          <div
            className="mt-auto border border-zinc-200 rounded-md px-4 py-3 flex items-center gap-3 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-[13px] text-zinc-900 flex-1 truncate">
              {renderCommand(skill.install_command)}
            </span>
            <button
              onClick={handleCopy}
              aria-label="Copy install command"
              className="minimal-copy-btn shrink-0 p-1 rounded hover:bg-zinc-100 transition-colors"
            >
              {copied ? (
                <span className="text-purple-500 text-[11px] font-mono px-1">✓</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-zinc-400">
                  <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 4V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Subtitle below install — matches the "Supports Claude Code, Codex, Cursor" line */}
        <p className="mt-2 text-[11px] text-zinc-400">
          {skill.runtimes.length > 0
            ? `Supports ${skill.runtimes.map((r) => r.replace("-", " ")).join(", ")}.`
            : ""}
        </p>
      </div>
    </Link>
  );
}
