"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { relativeTime } from "@/lib/utils";
import type { SkillWithAuthor } from "@/lib/types/database";

interface ThemeProps {
  skill: SkillWithAuthor;
  mode?: "card" | "detail";
}

/**
 * editorial-light — the "Impeccable" theme.
 *
 * Cream background, big italic serif title, decorative pink curls
 * that draw themselves in on hover, dark install command bar at the
 * bottom. Stays light even in dark mode — the visual contrast against
 * the rest of the dark site is the whole point.
 */
export function EditorialLight({ skill, mode = "card" }: ThemeProps) {
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
        if (mode === "card") {
          setTimeout(() => router.push(`/skills/${skill.slug}`), 250);
        }
      })
      .catch(() => {
        toast.error("Couldn't copy. Try selecting the text manually.");
      });
  };

  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group block relative overflow-hidden rounded-xl border border-zinc-200 bg-[#fafaf7] text-zinc-900 transition-shadow hover:shadow-[0_8px_32px_rgba(236,72,153,0.12)] animate-fade-in"
      style={{ minHeight: 460 }}
    >
      {/* Decorative pink curls — draw themselves in on hover */}
      <svg
        viewBox="0 0 200 100"
        className="absolute top-3 right-3 w-32 h-16 pointer-events-none"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M 10 50 Q 40 10, 80 50 T 150 50 Q 170 30, 190 50"
          stroke="#ec4899"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            transition: "stroke-dashoffset 1.4s ease-out",
          }}
          className="group-hover:[stroke-dashoffset:0]"
        />
      </svg>

      <svg
        viewBox="0 0 200 100"
        className="absolute bottom-24 left-2 w-28 h-14 pointer-events-none"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M 10 50 Q 30 80, 60 50 T 110 50 Q 140 70, 180 40"
          stroke="#ec4899"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            transition: "stroke-dashoffset 1.4s ease-in 300ms",
          }}
          className="group-hover:[stroke-dashoffset:0] group-hover:[transition:stroke-dashoffset_1.4s_ease-out_300ms]"
        />
      </svg>

      {/* Upvote count — subtle, top-left */}
      <div className="absolute top-4 left-5 font-mono text-[11px] text-zinc-400 z-10">
        ↑ {skill.upvotes}
      </div>

      <div className="relative px-7 pt-16 pb-7 h-full flex flex-col">
        {/* Title — big italic serif */}
        <h3
          className="font-serif text-[44px] leading-[1.04] tracking-tight italic font-normal text-zinc-900 mb-2"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          {skill.name}
        </h3>

        {/* Subtitle — italic, lighter */}
        <p
          className="font-serif text-lg italic text-zinc-600 leading-snug mb-5"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          {skill.summary.split(/[.—]/)[0].trim()}
        </p>

        {/* Body description — what's underneath the subtitle */}
        <p className="text-[13px] text-zinc-700 leading-relaxed line-clamp-3 mb-5">
          {skill.summary}
        </p>

        {/* WHAT'S INCLUDED label + features (from tags) */}
        {skill.tags.length > 0 && (
          <div className="mb-auto pt-4 border-t border-zinc-200/80">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
              What&apos;s included
            </div>
            <ul className="space-y-1 text-[13px] text-zinc-700">
              {skill.tags.slice(0, 3).map((tag) => (
                <li key={tag} className="capitalize">
                  {tag.replace(/-/g, " ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Install command — dark bar at the bottom */}
        {skill.install_command && (
          <div
            className="mt-5 flex items-center gap-2 bg-zinc-900 rounded-md px-3 py-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-[12px] text-zinc-100 flex-1 truncate">
              {skill.install_command}
            </span>
            <button
              onClick={handleCopy}
              aria-label="Copy install command"
              className="font-mono text-[11px] text-zinc-400 hover:text-white bg-transparent border border-zinc-700 rounded px-2 py-0.5 transition-colors shrink-0"
            >
              {copied ? <span className="text-emerald-400">✓</span> : "copy"}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
