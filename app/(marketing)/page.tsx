import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptCard } from "@/components/prompts/prompt-card";
import { FadeSection } from "@/components/brand/fade-section";
import { LiveDemo } from "@/components/brand/live-demo";
import { createClient } from "@/lib/supabase/server";
import type { PromptWithAuthor } from "@/lib/types/database";

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

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
          Section 1: Hero — centered, ~90vh, restrained
      ───────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] md:min-h-[88vh] px-6 pt-32 md:pt-40 pb-24 md:pb-28 overflow-hidden">
        {/* Single ambient violet glow at top — sole decorative element */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none opacity-[0.55]"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(var(--primary) / 0.10) 0%, transparent 60%)",
          }}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-[720px] mx-auto text-center flex flex-col items-center gap-8 md:gap-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 text-[11px] md:text-xs font-medium tracking-[0.22em] uppercase text-muted-foreground">
            <span className="inline-block h-[5px] w-[5px] rounded-full bg-primary" aria-hidden="true" />
            Now live
            <span className="inline-block h-[5px] w-[5px] rounded-full bg-primary" aria-hidden="true" />
          </div>

          {/* Headline — tight tracking, single idea */}
          <h1 className="font-serif font-normal text-foreground text-[clamp(2.5rem,7.2vw,5rem)] leading-[1.04] tracking-[-0.03em]">
            The library<br />
            <span className="text-primary">is open.</span>
          </h1>

          {/* Subhead — concrete, two short clauses */}
          <p className="text-[17px] md:text-[19px] text-muted-foreground leading-[1.5] max-w-[560px]">
            A community archive of prompts for every AI tool. Free forever — no paywall, no pro tier, no signup to read.
          </p>

          {/* CTAs — primary verb + secondary text-link */}
          <div className="flex items-center justify-center gap-7 flex-wrap pt-1">
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

        {/* Stats baseline — subtle, anchors the bottom */}
        <div className="absolute bottom-8 md:bottom-10 inset-x-0 text-center pointer-events-none">
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
          Section 2: Library tease (gated preview)
      ───────────────────────────────────────────── */}
      <section className="container py-24 border-t border-border">
        <FadeSection>
          <span className="label-mono">[ 01 — WHAT&apos;S INSIDE ]</span>
          <h2 className="font-serif text-[32px] font-medium tracking-h2 mt-3 mb-4">
            Prompts from the community
          </h2>
          <p className="text-[15px] text-foreground-muted max-w-lg leading-relaxed mb-10">
            Every prompt is reviewed, categorized, and searchable by model.
            Vote on what works, remix what you find, build on what others share.
          </p>
        </FadeSection>

        <div className="relative">
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${!user ? "fade-bottom" : ""}`}>
            {(teasePrompts as PromptWithAuthor[] | null ?? []).map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} blurred={!user} />
            ))}
          </div>

          {!user && (
            <>
              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none" />
              {/* CTA centered over the fade */}
              <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    Sign up to see the full library
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <span className="label-mono">Free forever · No credit card</span>
              </div>
            </>
          )}
        </div>
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
