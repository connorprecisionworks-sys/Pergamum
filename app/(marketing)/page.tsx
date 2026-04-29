import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeSection } from "@/components/brand/fade-section";
import { LiveDemo } from "@/components/brand/live-demo";
import { TypewriterHero } from "@/components/brand/typewriter-hero";
import { FeaturedPrompts } from "@/components/brand/featured-prompts";
import { createClient } from "@/lib/supabase/server";
import type { PromptWithAuthor } from "@/lib/types/database";

export default async function LandingPage() {
  const supabase = await createClient();

  const [
    { data: teasePrompts },
    { count: promptCount },
    { count: categoryCount },
    { count: userCount },
  ] = await Promise.all([
    supabase
      .from("prompts")
      .select(`*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`)
      .eq("status", "published")
      .order("copies", { ascending: false })
      .limit(6),
    supabase.from("prompts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const pc = promptCount ?? 0;
  const cc = categoryCount ?? 0;
  const uc = userCount ?? 0;

  return (
    <>
      {/* ─────────────────────────────────────────────
          Section 1: Hero — left-aligned editorial, ~85vh
      ───────────────────────────────────────────── */}
      <section className="relative flex flex-col justify-center min-h-[78vh] md:min-h-[85vh] px-6 md:px-12 lg:px-20 pt-28 md:pt-36 pb-20 md:pb-24 overflow-hidden">
        {/* Soft ambient violet glow — pushed to the right to balance the left-aligned text */}
        <div
          className="absolute -top-32 right-[-200px] w-[820px] h-[600px] pointer-events-none opacity-[0.55]"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(var(--primary) / 0.10) 0%, transparent 60%)",
          }}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-[1180px] mx-auto">
          {/* Eyebrow — top-left */}
          <div className="flex items-center gap-2.5 text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-10 md:mb-14">
            <span className="inline-block h-[5px] w-[5px] rounded-full bg-primary" aria-hidden="true" />
            Now live
          </div>

          {/* Headline + subhead in a constrained editorial column */}
          <div className="max-w-[760px] flex flex-col gap-7 md:gap-9">
            <TypewriterHero />

            <p className="text-[17px] md:text-[19px] text-muted-foreground leading-[1.5] max-w-[540px]">
              A community archive of prompts for every AI tool. Free forever — no paywall, no pro tier, no signup to read.
            </p>

            {/* CTAs — left-aligned, primary verb + secondary text-link */}
            <div className="flex items-center gap-7 flex-wrap pt-2">
              <Button size="lg" asChild className="h-12 px-7 text-[15px] font-medium">
                <Link href="/prompts">Browse the library</Link>
              </Button>
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground hover:text-primary transition-colors"
              >
                Contribute a prompt
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats line — bottom-left, anchors the section without competing */}
        <div className="absolute bottom-8 md:bottom-10 left-6 md:left-12 lg:left-20 pointer-events-none">
          <span className="label-mono">
            [ {pc} prompt{pc !== 1 ? "s" : ""} &nbsp;·&nbsp; {cc} categor{cc !== 1 ? "ies" : "y"} &nbsp;·&nbsp; {uc} contributor{uc !== 1 ? "s" : ""} ]
          </span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          Trust bar — works-with row
      ───────────────────────────────────────────── */}
      <section className="border-y border-border/60 py-10 md:py-12">
        <div className="container">
          <p className="text-center text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-6">
            Works with
          </p>
          <div className="flex items-center justify-center gap-x-10 md:gap-x-14 gap-y-4 flex-wrap">
            {["Claude", "GPT-4", "Gemini", "Llama", "Mistral", "Perplexity", "Grok"].map((name) => (
              <span
                key={name}
                className="text-[15px] md:text-base font-medium text-foreground/45 tracking-tight"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          Section 2: Featured prompts — scroll-snap row
          (replaces the old gated grid; alignment matches editorial hero)
      ───────────────────────────────────────────── */}
      <section className="border-t border-border/60 py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-20 max-w-[1180px] mx-auto mb-10 md:mb-12">
          <FadeSection>
            <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-4">
              From the community
            </p>
            <h2 className="font-serif text-[32px] md:text-[44px] font-normal leading-[1.05] tracking-[-0.025em] max-w-[680px]">
              What people are using right now.
            </h2>
            <p className="mt-4 text-[15px] md:text-[16px] text-muted-foreground max-w-[540px] leading-[1.55]">
              Scroll to see what&apos;s being copied this week. Open any prompt to fill in its variables and use it.
            </p>
          </FadeSection>
        </div>

        <FadeSection delay={0.1}>
          <FeaturedPrompts
            prompts={(teasePrompts as PromptWithAuthor[] | null) ?? []}
            totalCount={pc}
          />
        </FadeSection>
      </section>

      {/* ─────────────────────────────────────────────
          Section 3: Live demo of variable templating
          (replaces "How it works" + "Categories" + "Contributors")
      ───────────────────────────────────────────── */}
      <section className="border-t border-border/60 py-24 md:py-32">
        <div className="container max-w-5xl">
          <FadeSection>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-4">
                Variables, demonstrated
              </p>
              <h2 className="font-serif text-[36px] md:text-[52px] font-normal leading-[1.05] tracking-[-0.02em] max-w-[720px] mx-auto">
                Type. Watch. Copy.
              </h2>
              <p className="mt-5 text-[16px] md:text-[18px] text-muted-foreground max-w-[560px] mx-auto leading-[1.5]">
                Every <code className="font-mono text-[0.9em] text-foreground/80">{`{{variable}}`}</code> in a prompt becomes a live input. The preview rewrites as you type — no copy-paste-edit dance.
              </p>
            </div>
          </FadeSection>

          <FadeSection delay={0.1}>
            <LiveDemo />
          </FadeSection>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          Section 6: Final CTA
      ───────────────────────────────────────────── */}
      <section className="border-t border-border py-32">
        <div className="container text-center space-y-6">
          <h2 className="font-serif text-[32px] md:text-[48px] font-normal tracking-h1 leading-tight">
            Start building your library.
          </h2>
          <Button size="lg" asChild>
            <Link href="/auth/signup">
              Get started — it&apos;s free
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <div className="flex items-center justify-center gap-6 pt-2">
            <Link href="/prompts" className="label-mono hover:text-foreground-muted transition-colors">
              Browse →
            </Link>
            <Link href="/submit" className="label-mono hover:text-foreground-muted transition-colors">
              Submit →
            </Link>
            <Link href="/leaderboards" className="label-mono hover:text-foreground-muted transition-colors">
              Leaderboards →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
