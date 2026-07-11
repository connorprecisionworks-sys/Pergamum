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
 * technical-dark — the "Remotion" theme.
 *
 * Dark canvas, massive bold sans title, kinetic blue swoosh that draws
 * on hover. Mono everywhere outside the headline. Programmer-utility
 * personality.
 */
export function TechnicalDark({ skill, mode = "card" }: ThemeProps) {
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

  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="technical-dark-group group block relative overflow-hidden rounded-xl border border-zinc-800 bg-[#0a0a0c] text-white transition-[transform,box-shadow] duration-500 ease-out hover:scale-[1.01] hover:shadow-[0_12px_40px_rgba(56,139,253,0.25)] animate-fade-in"
      style={{ minHeight: 460 }}
    >
      {/* Blue swoosh — Remotion-style brand mark */}
      <svg
        viewBox="0 0 460 460"
        className="absolute inset-0 w-full h-full pointer-events-none"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M -20 380 Q 100 100, 250 250 T 480 60"
          stroke="#3b82f6"
          strokeWidth="56"
          strokeLinecap="round"
          pathLength={1}
          className="technical-swoosh"
          opacity="0.16"
        />
      </svg>

      <div className="absolute top-4 left-5 font-mono text-[11px] text-zinc-500 z-10">
        ⤓ {skill.copies}
      </div>

      <div className="relative px-7 pt-20 pb-7 h-full flex flex-col">
        <h3
          className="text-[44px] font-bold leading-[0.95] tracking-[-0.02em] mb-3 max-w-[85%]"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          {skill.name}
        </h3>
        <p className="text-base text-zinc-400 leading-snug mb-6 max-w-[92%]">
          {skill.summary}
        </p>

        {skill.tags.length > 0 && (
          <div className="mb-auto flex flex-wrap gap-2">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-mono text-[11px] px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {skill.install_command && (
          <div
            className="mt-6 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-[12px] text-zinc-100 flex-1 truncate">
              $ {skill.install_command}
            </span>
            <button
              onClick={handleCopy}
              aria-label="Copy install command"
              className="technical-copy-btn font-mono text-[11px] text-zinc-400 bg-transparent border border-zinc-700 rounded px-2 py-0.5 shrink-0"
            >
              {copied ? <span className="text-blue-400">✓</span> : "copy"}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
