import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Prmpt",
  description:
    "A prompt can be worth hundreds of dollars. The way it usually gets handed over is worth nothing. Prmpt fixes the second part.",
};

export default function AboutPage() {
  return (
    <article className="px-6 md:px-10 lg:px-16 py-16 md:py-24">
      {/* ── Header ── */}
      <header className="max-w-[760px] mx-auto mb-14 md:mb-20">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-5">
          About
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,5.6vw,4.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-foreground">
          A prompt can be worth hundreds of dollars. The delivery is usually worth zero.
        </h1>
        <p className="mt-7 text-[18px] md:text-[20px] text-muted-foreground leading-[1.55] max-w-[640px]">
          Prmpt is what happens when the delivery gets taken as seriously as the prompt.
        </p>
      </header>

      {/* ── Body ── */}
      <div className="max-w-[680px] mx-auto text-[17px] leading-[1.75] text-foreground/85 space-y-7">
        <p>
          A good prompt does real work. It can save someone an afternoon, or produce a result they couldn&apos;t get on their own, or replace a process that used to take a person. Priced honestly, against the time and output it stands in for, that&apos;s worth real money — sometimes hundreds of dollars for a single well-built system prompt.
        </p>

        <p>
          Now look at how it actually reaches the person who paid for it. A screenshot buried in a carousel post. A wall of text pasted into an Instagram comment. A PDF you have to open, select all, copy, and paste somewhere else before it does anything. A Google Doc with edit access nobody meant to hand out.
        </p>

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          The gap.
        </h2>

        <p>
          The prompt is worth something. The format it arrives in is worth nothing — it doesn&apos;t even look like a product. It looks like homework. The creator did the hard part, building something that works, and then handed it over in the least valuable container available.
        </p>

        <p>
          That gap is the whole problem. Not the prompt itself — the delivery.
        </p>

        <p className="font-serif italic text-[19px] md:text-[21px] leading-[1.5] text-foreground/90 border-l-2 border-primary/60 pl-6 py-1 my-10">
          A prompt is not text. It&apos;s an interface, if you build it like one.
        </p>

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          Delivery as the product.
        </h2>

        <p>
          On Prmpt, a prompt gets its own page instead of a paste-and-hope block of text. The variables inside it — a name, a tone, an audience, whatever the creator built in — show up as a live form, filled in as you type, instead of placeholders you have to hunt down and edit by hand. One button copies exactly what&apos;s meant to be copied.
        </p>

        <p>
          None of that is a special export or a paid add-on. It&apos;s what the prompt looks like by default. The formatting, the structure, the fields — all of it survives the trip from the creator&apos;s head to the buyer&apos;s clipboard.
        </p>

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          What a creator sends.
        </h2>

        <p>
          Instead of a screenshot, a link. Instead of a document a client has to fight with, a page that already works the way it&apos;s supposed to. The creator keeps their name on it, keeps the relationship, and sends something that reads as finished — because it is.
        </p>

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          The name.
        </h2>

        <p>
          Not a library. Not a leaderboard. Prmpt — the smallest unit of stuff you&apos;d actually hand someone so they could use it right away. That&apos;s the whole bet: prompts deserve to be shipped like software, not passed around like notes.
        </p>
      </div>

      {/* ── Footer note + nav back ── */}
      <div className="max-w-[680px] mx-auto mt-20 pt-10 border-t border-border/60">
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
          Prmpt is built and maintained by{" "}
          <a
            href="mailto:connor.precisionworks@gmail.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            Connor
          </a>
          {" "}— part of an ongoing experiment in what an AI consulting practice should put into the world.
        </p>
        <div className="flex items-center gap-5 flex-wrap text-sm">
          <Link
            href="/"
            className="text-foreground hover:text-primary transition-colors"
          >
            ← Back to Prmpt
          </Link>
          <Link
            href="/the-science"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Read the research →
          </Link>
        </div>
      </div>
    </article>
  );
}
