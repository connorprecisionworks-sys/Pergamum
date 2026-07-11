"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Grain } from "./grain";
import { useReducedMotion } from "./use-reduced-motion";

/** Stagger applied to each revealed child, in seconds. */
const STAGGER = 0.14;
const LEAD_IN = 0.12;

export function Finale() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);

  // Reveal the card and stagger its children in as the band arrives.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const children = card.querySelectorAll<HTMLElement>("[data-reveal]");
    const reveal = () => {
      card.dataset.shown = "true";
      children.forEach((child, index) => {
        child.style.transitionDelay = `${STAGGER * index + LEAD_IN}s`;
        child.dataset.shown = "true";
      });
    };

    if (reduced || !("IntersectionObserver" in window)) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [reduced]);

  // Magnetic button + faux cursor. The cursor element sits *behind* the frosted
  // card, so the card's backdrop-filter blurs it into the glass — while the real
  // button, which is above the glass, stays fully clickable.
  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    const button = buttonRef.current;
    const cursor = cursorRef.current;
    if (reduced || !section || !card || !button || !cursor) return;

    const onMove = (event: PointerEvent) => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const sectionRect = section.getBoundingClientRect();
        cursor.style.transform = `translate3d(${
          event.clientX - sectionRect.left
        }px, ${event.clientY - sectionRect.top}px, 0)`;

        const cardRect = card.getBoundingClientRect();
        const insideCard =
          event.clientX >= cardRect.left &&
          event.clientX <= cardRect.right &&
          event.clientY >= cardRect.top &&
          event.clientY <= cardRect.bottom;

        // The ghost only shows where the glass is over it. Off the card there
        // is nothing to diffuse it and it would read as a second, oversized
        // cursor next to the real one.
        cursor.style.opacity = insideCard ? "1" : "0";

        // The button leans toward the pointer only while it is over the card.
        if (!insideCard) {
          button.style.transform = "translate(0, 0)";
          return;
        }

        const buttonRect = button.getBoundingClientRect();
        const dx =
          (event.clientX - (buttonRect.left + buttonRect.width / 2)) /
          (buttonRect.width / 2);
        const dy =
          (event.clientY - (buttonRect.top + buttonRect.height / 2)) /
          (buttonRect.height / 2);
        button.style.transform = `translate(${(dx * 9).toFixed(1)}px, ${(
          dy * 6
        ).toFixed(1)}px)`;
      });
    };

    const onLeave = () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      cursor.style.opacity = "0";
      button.style.transform = "translate(0, 0)";
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="landing-finale-bg relative flex min-h-[760px] items-center justify-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="landing-glow-layer pointer-events-none absolute inset-0 origin-center"
        style={{
          background:
            "radial-gradient(90% 78% at 30% 24%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%), radial-gradient(78% 70% at 90% 98%, rgba(120,178,212,0.34), rgba(255,255,255,0) 60%)",
        }}
      />
      <Grain id="finaleGrain" opacity={0.09} />

      {/* Faux cursor — z-[2], beneath the card's z-[3] glass, so the card's
          backdrop-filter smears it into the frost. It needs real mass and a
          soft halo to survive a 30px blur under a 55%-white surface; a thin
          outline simply disappears. The real button sits above the glass and
          stays clickable. */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        data-faux-cursor
        className="pointer-events-none absolute left-0 top-0 z-[2] opacity-0"
        style={{ transition: "opacity 220ms ease" }}
      >
        {/* Sized to survive the card's 30px backdrop-blur: a shape smaller than
            the blur radius dissolves completely. Through the frost this reads
            as a soft shadow tracking the pointer, not a crisp arrow. */}
        <div
          className="absolute rounded-full"
          style={{
            left: -34,
            top: -30,
            width: 110,
            height: 110,
            background:
              "radial-gradient(closest-side, rgba(13,13,15,0.34), rgba(13,13,15,0) 72%)",
          }}
        />
        <svg
          className="relative"
          width="40"
          height="47"
          viewBox="0 0 22 26"
          fill="none"
        >
          <path
            d="M2 2L2 20.5L6.8 16.2L10.2 23.5L13.6 21.8L10.3 14.8L16.5 14.2L2 2Z"
            fill="rgba(13,13,15,0.95)"
          />
        </svg>
      </div>

      <div
        ref={cardRef}
        className="landing-frost landing-reveal relative z-[3] w-[452px] max-w-[calc(100%-48px)] overflow-hidden rounded-[30px] px-[46px] pb-[38px] pt-12 text-center"
      >
        <div
          aria-hidden="true"
          className="landing-sheen-layer pointer-events-none absolute inset-[-14%] z-[1]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 34%), radial-gradient(420px circle at 26% 4%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)",
          }}
        />

        <div className="relative z-[2]">
          <span
            data-reveal
            className="landing-reveal mb-[22px] inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-primary"
          >
            <Image
              src="/logo-mark-white.png"
              alt=""
              width={26}
              height={26}
              className="h-[26px] w-[26px]"
            />
          </span>

          <h2
            data-reveal
            className="landing-reveal m-0 mb-3.5 text-[clamp(2rem,4vw,40px)] font-normal leading-[1.02] -tracking-[0.02em] text-foreground"
          >
            Reach the leads
            <br />
            your prompts earn.
          </h2>

          <p
            data-reveal
            className="landing-reveal m-0 mb-7 text-base leading-[1.55] text-foreground-muted"
          >
            Every download becomes a warm contact. Open your page and start the
            conversation.
          </p>

          <Link
            ref={buttonRef}
            href="/auth/signup"
            data-reveal
            className="landing-reveal mb-[18px] flex h-14 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground"
            style={{
              transition:
                "transform 0.22s cubic-bezier(.2,.7,.2,1), opacity 0.6s cubic-bezier(.2,.7,.2,1)",
            }}
          >
            Get started
          </Link>

          <div data-reveal className="landing-reveal text-sm text-foreground-muted">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-foreground underline underline-offset-2"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
