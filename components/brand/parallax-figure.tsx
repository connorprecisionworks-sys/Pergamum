"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";

interface ParallaxFigureProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  attribution: string;
  attributionHref?: string;
  priority?: boolean;
  /**
   * Which way the image drifts as it scrolls past.
   * Alternate per figure for visual rhythm: "left", "right", "left".
   */
  direction?: "left" | "right";
}

export function ParallaxFigure({
  src,
  alt,
  width,
  height,
  caption,
  attribution,
  attributionHref,
  priority = false,
  direction = "left",
}: ParallaxFigureProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Track scroll progress through the figure: 0 when bottom of viewport hits the
  // top of the figure; 1 when top of viewport leaves the bottom of the figure.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Sign flip: "left" → image starts shifted right and drifts left as you scroll.
  //            "right" → image starts shifted left and drifts right.
  const sign = direction === "left" ? 1 : -1;

  // Horizontal drift — small enough to feel intentional, not gimmicky.
  // Image is over-scaled below so this drift never exposes a gap in the frame.
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [16 * sign, -16 * sign]
  );

  // Caption fades + nudges up as the image hits its reading position.
  const captionOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.55, 1],
    reduce ? [1, 1, 1, 1] : [0, 0.7, 1, 1]
  );
  const captionY = useTransform(
    scrollYProgress,
    [0, 0.45],
    reduce ? [0, 0] : [10, 0]
  );

  return (
    <figure ref={ref} className="my-12 md:my-16">
      {/* Image frame — overflow-hidden clips drift; inner div is over-scaled
          so even at peak translation the image still covers the frame edge-to-edge. */}
      <div className="relative w-full overflow-hidden rounded-lg border border-border/60 bg-muted/20">
        <motion.div
          style={{ x }}
          className="will-change-transform"
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="(max-width: 768px) 100vw, 680px"
            priority={priority}
            className="w-full h-auto scale-[1.06] origin-center"
          />
        </motion.div>
      </div>

      <motion.figcaption
        style={{ opacity: captionOpacity, y: captionY }}
        className="mt-3 text-[13px] text-muted-foreground italic leading-snug max-w-[60ch]"
      >
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
      </motion.figcaption>
    </figure>
  );
}
