import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Pergamum",
  description:
    "Pergamum was an ancient library that refused to be gatekept. Two thousand years later, this is the same idea.",
};

// ── Static figure with image + attributed caption ───────────────────
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
    <figure className="my-12 md:my-16">
      <div className="relative w-full overflow-hidden rounded-lg border border-border/60 bg-muted/20">
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
          Pergamum sat on a 335-metre hill above the Caicus river plain in northwest Anatolia — the modern town of Bergama, Turkey. The acropolis at the top of the hill held the temples, the palaces, a theatre cut into the slope at one of the steepest angles in the ancient world, and the library. A city built vertical, in the way Hellenistic cities tended to be when they wanted to project power.
        </p>

        <p>
          It was a small kingdom. The Attalid dynasty that built it spanned only about a hundred and fifty years, from 281 to 133 BCE. Five kings, all of them unusually invested in scholarship and the arts. Eumenes II — the second-to-last — is the one who built the library. He spent his reign accumulating books, sculptors, and reputation in roughly equal measure, and by his death in 159 BCE the library was the second-largest in the world. The largest was at Alexandria, in Ptolemaic Egypt.
        </p>

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          The papyrus embargo.
        </h2>

        <p>
          The growth was alarming enough to Alexandria that Egypt cut off papyrus exports. Egypt held a near-monopoly on papyrus production — the plant grew along the Nile and almost nowhere else — and every library on Earth depended on it. The intent of the embargo was straightforward: starve Pergamum&apos;s library of the material it needed to grow.
        </p>

        <p>
          Pergamum responded by perfecting parchment instead.
        </p>

        <p>
          Treated animal skin, scraped thin and stretched. More expensive to produce than papyrus, more durable, and entirely outside Egypt&apos;s control. Animal-skin writing surfaces had existed before, in Persia and Mesopotamia, but Pergamum&apos;s artisans turned the process into something industrial. The Romans called the result <em>charta pergamena</em> — &ldquo;paper of Pergamum.&rdquo; The English word <em>parchment</em> is a direct descendant. The substance is still named for the city, two thousand years after the city stopped existing.
        </p>

        <Figure
          src="/about/library.jpg"
          alt="The Acropolis of Pergamon, an 1882 architectural reconstruction by Friedrich Thiersch."
          width={1596}
          height={900}
          priority
          caption="The Acropolis of Pergamon, an 1882 architectural reconstruction by Friedrich Thiersch. The library, the temple of Athena, the theatre, and the royal palaces sat above the city, overlooking the Aegean."
          attribution="Friedrich Thiersch, 1882. Public domain via Wikimedia Commons."
          attributionHref="https://commons.wikimedia.org/wiki/File:Acropolis_of_Pergamon_-_Friedrich_Thierch_-_1882.jpg"
        />

        <p className="font-serif italic text-[19px] md:text-[21px] leading-[1.5] text-foreground/90 border-l-2 border-primary/60 pl-6 py-1 my-10">
          Knowledge wanted to move. Someone tried to put a gate in front of it. The gate lost.
        </p>

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          What was inside.
        </h2>

        <p>
          Vitruvius, the Roman architect, described the design of the Pergamum library in <em>De Architectura</em>. The reading rooms were arranged around a central courtyard, with porticoes lined by statues of poets and philosophers — a curated lineage of the figures who had built the literary tradition the library was preserving. The walls were doubled, with air gaps in between, an early attempt at humidity control to keep the parchment from rotting in the Aegean summers.
        </p>

        <p>
          By the second century BCE, per Plutarch, the collection had reached an estimated two hundred thousand volumes. Open to scholars from anywhere in the Mediterranean. Copied freely. Shared across the known world. For a kingdom of about two hundred thousand people total, it was an astonishing fraction of the population&apos;s output going into a single shared resource.
        </p>

        <p>
          Pergamum was a research city as much as a political one. It had a sanctuary of Asclepius — the god of medicine — that doubled as one of the most famous healing centres in antiquity, with a sacred spring and a tunnel where patients underwent dream-incubation therapy. Galen, the physician whose writings would dominate Western medicine for the next fifteen hundred years, was born there in 129 CE and trained at the Asclepieion before going to Rome.
        </p>

        <Figure
          src="/about/parchment.jpg"
          alt="A leaf of aged parchment, the writing surface invented at Pergamum."
          width={5184}
          height={3456}
          caption="Parchment. Pergamum's invention outlived the city by a thousand years and copied half of what we still know about classical antiquity."
          attribution="Wikimedia Commons"
          attributionHref="https://commons.wikimedia.org/wiki/Category:Parchment"
        />

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          What happened to it.
        </h2>

        <p>
          The Attalid dynasty ended quietly. Attalus III died childless in 133 BCE and willed the entire kingdom — library included — to Rome. The wealth that flooded into the Roman treasury when the bequest was settled was so large that it became part of the political crisis that produced the Gracchi reforms a few years later. Pergamum became the Roman province of Asia.
        </p>

        <p>
          The library outlived the dynasty by about a century. Plutarch — writing two hundred years after the fact, so take it with the appropriate salt — claims that Mark Antony eventually gave the collection, still around two hundred thousand volumes, to Cleopatra, to replenish what had been lost when the Library of Alexandria caught fire. Whether that actually happened or was Roman propaganda about Antony&apos;s recklessness is debated.
        </p>

        <p>
          The Great Altar of Pergamon — built around 160 BCE under Eumenes II, with a 113-metre frieze depicting the battle of the gods and the giants — was excavated by German archaeologists in the late 19th century and rebuilt inside Berlin&apos;s Pergamon Museum, where it still stands.
        </p>

        <Figure
          src="/about/altar.jpg"
          alt="The Great Altar of Pergamon, reassembled inside Berlin's Pergamon Museum."
          width={5184}
          height={3456}
          caption="The Great Altar of Pergamon, reassembled inside Berlin's Pergamon Museum. The 113-metre frieze around its base depicts the Gigantomachy — the mythological battle of the Olympian gods against the giants."
          attribution="Wikimedia Commons"
          attributionHref="https://commons.wikimedia.org/wiki/Category:Pergamon_Altar"
        />

        <p>
          The acropolis itself is a UNESCO site. The library, the parchment workshops, the Asclepieion, the theatre cut into the cliff — all of it is in ruins now, walkable, photographable, and, for the moment, free to visit.
        </p>

        <Figure
          src="/about/acropolis.jpg"
          alt="The ruins of the Pergamon Acropolis as they stand today, in Bergama, Turkey."
          width={1200}
          height={770}
          caption="The acropolis at Pergamum today. The library is gone, but its catalogue lives on — scattered across the libraries it freely shared with for two centuries."
          attribution="Wikimedia Commons"
          attributionHref="https://commons.wikimedia.org/wiki/Category:Pergamon_Acropolis"
        />

        <h2 className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.015em] mt-16 mb-3">
          Why we named it Pergamum.
        </h2>

        <p>
          The original Pergamum existed because someone decided knowledge shouldn&apos;t be gatekept, and then built the infrastructure to prove it — even when proving it required inventing a new substance to write on. That&apos;s the entire reason this site is named after it. A library, in the old sense of the word.
        </p>
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
