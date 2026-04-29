import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Pergamum",
  description:
    "Pergamum was an ancient library that refused to be gatekept. Two thousand years later, this is the same idea.",
};

// ── Inline figure with image + caption ──────────────────────────
// Real intrinsic dimensions are passed in so next/image avoids layout shift.
function Figure({
  src,
  alt,
  width,
  height,
  caption,
  attribution,
  attributionHref,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  attribution: string;
  attributionHref?: string;
  priority?: boolean;
}) {
  return (
    <figure className="my-12 md:my-14">
      <div className="relative w-full overflow-hidden rounded-lg border border-border/60 bg-muted/30">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(max-width: 768px) 100vw, 680px"
          priority={priority}
          className="w-full h-auto"
        />
      </div>
      <figcaption className="mt-3 text-[13px] text-muted-foreground italic leading-snug max-w-[60ch]">
        {caption}
        <span className="not-italic text-muted-foreground/60">
          {" "}—{" "}
          {attributionHref ? (
            <a
              href={attributionHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground underline-offset-4 hover:underline"
            >
              {attribution}
            </a>
          ) : (
            attribution
          )}
        </span>
      </figcaption>
    </figure>
  );
}

export default function AboutPage() {
  return (
    <article className="px-6 md:px-10 lg:px-16 py-16 md:py-24">
      {/* ── Header ── */}
      <header className="max-w-[760px] mx-auto mb-14 md:mb-20">
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-5">
          About
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,5.6vw,4.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-foreground">
          Pergamum was a library that refused to be gatekept.
        </h1>
        <p className="mt-7 text-[18px] md:text-[20px] text-muted-foreground leading-[1.55] max-w-[640px]">
          Two thousand years later, the same idea — applied to prompts.
        </p>
      </header>

      {/* ── Body ── */}
      <div className="max-w-[680px] mx-auto text-[17px] leading-[1.75] text-foreground/85 space-y-7">
        <p>
          Pergamum was a city in ancient Anatolia, on the western edge of what is now Turkey. In its time it had one of the largest libraries in the world — second only to Alexandria&apos;s, and on a good day, possibly larger.
        </p>

        <p>
          The story of how it got that big is the part worth telling.
        </p>

        <p>
          The library at Alexandria was the dominant one in the Mediterranean. Pergamum was building fast and starting to threaten that dominance. Egypt — which controlled the world&apos;s supply of papyrus, the writing surface every library on Earth depended on — cut off exports. The intent was straightforward: starve Pergamum&apos;s library of the material it needed to grow.
        </p>

        <p>
          Pergamum invented parchment instead.
        </p>

        <p>
          Treated animal skin, scraped thin and stretched. More expensive than papyrus, more durable, and entirely outside Egypt&apos;s control. The library kept growing. By the second century BCE, Pergamum held an estimated two hundred thousand volumes — open to scholars from anywhere in the Mediterranean, copied freely, shared across the known world.
        </p>

        <Figure
          src="/about/library.jpg"
          alt="The Acropolis of Pergamon, an 1882 architectural reconstruction by Friedrich Thiersch."
          width={1596}
          height={900}
          priority
          caption="The Acropolis of Pergamon, an 1882 architectural reconstruction by Friedrich Thiersch. The reading rooms sat above the city, overlooking the Aegean."
          attribution="Friedrich Thiersch, 1882. Public domain via Wikimedia Commons."
          attributionHref="https://commons.wikimedia.org/wiki/File:Acropolis_of_Pergamon_-_Friedrich_Thierch_-_1882.jpg"
        />

        <p className="font-serif italic text-[19px] md:text-[21px] leading-[1.5] text-foreground/90 border-l-2 border-primary/60 pl-6 py-1 my-10">
          Knowledge wanted to move. Someone tried to put a gate in front of it. The gate lost.
        </p>

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          Two thousand years later.
        </h2>

        <p>
          The same fight is playing out with prompts.
        </p>

        <p>
          A prompt is a small thing — a paragraph, sometimes two. But prompts compound. The good ones get re-used hundreds of times by the people who write them, and thousands of times by the people who borrow them. Prompt engineering is a craft now: writers, engineers, researchers, marketers, founders, and a long tail of consultants are all converging on the same kinds of patterns.
        </p>

        <p>
          Crafts get better faster when the people doing them can see each other&apos;s work.
        </p>

        <Figure
          src="/about/parchment.jpg"
          alt="A leaf of aged parchment, the writing surface invented at Pergamum."
          width={5184}
          height={3456}
          caption="Parchment — Pergamum's invention. It outlived the city by a thousand years and copied half of what we still know about antiquity."
          attribution="Wikimedia Commons"
          attributionHref="https://commons.wikimedia.org/wiki/Category:Parchment"
        />

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          Why we named it Pergamum.
        </h2>

        <p>
          The name wasn&apos;t accidental. The original Pergamum existed because someone decided knowledge shouldn&apos;t be gatekept, and then built the infrastructure to prove it — even when proving it required inventing a new substance to write on.
        </p>

        <p>
          That&apos;s the entire pitch of this site. A library, in the old sense of the word: a place where the work of the people who came before you is on the shelves, available to anyone who walks in. You read it, you copy it, you adapt it, you put your own version back on the shelf.
        </p>

        <p>
          If you&apos;ve got a prompt that earns its keep, the library belongs to the people who fill it.
        </p>

        <Figure
          src="/about/acropolis.jpg"
          alt="The ruins of the Pergamon Acropolis as they stand today, in Bergama, Turkey."
          width={1200}
          height={770}
          caption="The acropolis at Pergamum today. The library is gone but its catalogue lives on, scattered across the libraries it shared with."
          attribution="Wikimedia Commons"
          attributionHref="https://commons.wikimedia.org/wiki/Category:Pergamon_Acropolis"
        />
      </div>

      {/* ── Footer note + nav back ── */}
      <div className="max-w-[680px] mx-auto mt-20 pt-10 border-t border-border/60">
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
          Pergamum the project is built and maintained by{" "}
          <a
            href="mailto:connor.precisionworks@gmail.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            Connor
          </a>
          {" "}— part of an ongoing experiment in what an AI consulting practice should put into the world. Free, ad-free, and intended to stay that way.
        </p>
        <div className="flex items-center gap-5 flex-wrap text-sm">
          <Link
            href="/"
            className="text-foreground hover:text-primary transition-colors"
          >
            ← Back to Pergamum
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
