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
 * warm-modern — the "Taste Skill" theme.
 *
 * Warm cream textured background, bold sans-serif title with an orange
 * "designer" tagline below. A small framed mockup floats in the
 * background to suggest the layered website screenshots on the real
 * Taste Skill landing page.
 */
export function WarmModern({ skill, mode = "card" }: ThemeProps) {
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

  const tagline = skill.summary.split(/[.—]/)[0].trim();
  const body = skill.summary.replace(tagline, "").replace(/^[.—\s]+/, "").trim();

  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="warm-modern-group group block relative overflow-hidden rounded-xl border border-stone-300 bg-[#f4eee5] text-stone-900 transition-[transform,box-shadow] duration-500 ease-out hover:scale-[1.01] hover:shadow-[0_12px_40px_rgba(249,115,22,0.18)] animate-fade-in"
      style={{ minHeight: 460 }}
    >
      {/* Floating mockup card — draws on hover */}
      <div
        className="warm-mockup absolute top-6 right-[-30px] w-[160px] h-[100px] rounded-md bg-white border border-stone-300 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rotate-[8deg] pointer-events-none"
        aria-hidden="true"
      >
        <div className="h-3 border-b border-stone-200 flex items-center px-2 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        </div>
        <div className="p-2 space-y-1.5">
          <div className="h-2 rounded bg-stone-200 w-3/4" />
          <div className="h-2 rounded bg-stone-200 w-1/2" />
          <div className="h-6 rounded bg-orange-200 w-12 mt-2" />
        </div>
      </div>

      <div className="absolute top-4 left-5 font-mono text-[11px] text-stone-500 z-10">
        ↑ {skill.upvotes}
      </div>

      <div className="relative px-7 pt-16 pb-7 h-full flex flex-col">
        {/* Orange experimental pill */}
        <div className="inline-flex items-center gap-1.5 self-start mb-5 px-2.5 py-1 rounded-full bg-orange-100 border border-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange-700">
            Featured
          </span>
        </div>

        <h3
          className="text-[42px] font-bold leading-[1] tracking-[-0.02em] text-stone-900 mb-3"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          {skill.name}
        </h3>

        <p className="text-[15px] text-orange-600 font-medium mb-4">
          {tagline}.
        </p>

        {body && (
          <p className="text-[13px] text-stone-700 leading-relaxed line-clamp-3 mb-auto">
            {body}
          </p>
        )}

        {skill.install_command && (
          <div
            className="mt-6 flex items-center gap-2 bg-stone-900 rounded-md px-3 py-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-[12px] text-stone-100 flex-1 truncate">
              $ {skill.install_command}
            </span>
            <button
              onClick={handleCopy}
              aria-label="Copy install command"
              className="warm-copy-btn font-mono text-[11px] text-stone-400 bg-transparent border border-stone-700 rounded px-2 py-0.5 shrink-0"
            >
              {copied ? <span className="text-orange-400">✓</span> : "copy"}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
