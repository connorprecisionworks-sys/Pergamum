import Link from "next/link";
import { getFeaturedOfTheDay } from "@/lib/featured";
import { SkillCard } from "@/components/skills/skill-card";
import { PromptCard } from "@/components/prompts/prompt-card";

export async function FeaturedOfTheDay() {
  const featured = await getFeaturedOfTheDay();
  if (!featured) return null;

  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = now.getDate();
  const dateLabel = `${month} ${day}`;
  const typeLabel = featured.kind === "skill" ? "SKILL OF THE DAY" : "PROMPT OF THE DAY";
  const browseHref = featured.kind === "skill" ? "/skills" : "/prompts";
  const browseLabel = featured.kind === "skill" ? "Browse all skills" : "Browse all prompts";

  return (
    <div className="flex flex-col gap-3">
      {/* Eyebrow */}
      <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-foreground-subtle uppercase">
        <span
          className="inline-block w-[7px] h-[7px] rounded-full shrink-0 bg-pergamum-400"
          aria-hidden="true"
        />
        {typeLabel}
        <span className="opacity-40">·</span>
        {dateLabel}
      </div>

      {/* Card inside violet glow */}
      <div className="relative">
        {/* Glow layer — sits behind the card via z-index */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-md blur-2xl"
          style={{
            background:
              "radial-gradient(circle at center, #7c71ff22, transparent 70%)",
          }}
        />
        {featured.kind === "skill" ? (
          <SkillCard skill={featured.skill} />
        ) : (
          <PromptCard prompt={featured.prompt} />
        )}
      </div>

      {/* Browse link */}
      <Link
        href={browseHref}
        className="font-mono text-[11px] tracking-[0.14em] text-foreground-subtle hover:text-foreground transition-colors uppercase"
      >
        {browseLabel} →
      </Link>
    </div>
  );
}
