"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

import { Grain } from "./grain";
import { useReducedMotion } from "./use-reduced-motion";

/** Base resting angles of the product panel (degrees). */
const BASE = { ry: -14, rx: 6, rot: -1.5 };
const REST_SHINE =
  "radial-gradient(420px circle at 30% 18%, rgba(255,255,255,0.42), rgba(255,255,255,0) 60%)";

/**
 * Magnetic tilt: the panel leans toward the pointer and a specular highlight
 * tracks it. rAF-batched so a burst of pointermove events collapses into one
 * write per frame. Untouched on touch devices and under reduced motion — it
 * simply rests at its base angle.
 */
function useMagneticTilt(enabled: boolean) {
  const stageRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const shineRef = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!enabled || !stage || !card) return;

    const apply = (px: number, py: number) => {
      const dx = px - 0.5;
      const dy = py - 0.5;
      const ry = BASE.ry - dx * 20;
      const rx = BASE.rx + dy * 18;
      card.style.transform = `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(
        2,
      )}deg) rotate(${BASE.rot}deg)`;
      if (shineRef.current) {
        shineRef.current.style.background = `radial-gradient(440px circle at ${(
          px * 100
        ).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)`;
      }
    };

    const onMove = (event: PointerEvent) => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect();
        apply(
          (event.clientX - rect.left) / rect.width,
          (event.clientY - rect.top) / rect.height,
        );
      });
    };

    const onLeave = () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      card.style.transform = `rotateY(${BASE.ry}deg) rotateX(${BASE.rx}deg) rotate(${BASE.rot}deg)`;
      if (shineRef.current) shineRef.current.style.background = REST_SHINE;
    };

    stage.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [enabled]);

  return { stageRef, cardRef, shineRef };
}

export function Hero() {
  const reduced = useReducedMotion();
  const { stageRef, cardRef, shineRef } = useMagneticTilt(!reduced);

  return (
    <section
      ref={stageRef}
      className="landing-hero-bg relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="landing-bloom"
          style={{
            width: 1100,
            height: 440,
            left: "-14%",
            top: "-20%",
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.92), rgba(255,255,255,0) 70%)",
            filter: "blur(32px)",
            transform: "rotate(-20deg)",
          }}
        />
        <div
          className="landing-bloom"
          style={{
            width: 900,
            height: 320,
            right: "-12%",
            top: "6%",
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.72), rgba(255,255,255,0) 72%)",
            filter: "blur(36px)",
            transform: "rotate(15deg)",
          }}
        />
        <div
          className="landing-bloom"
          style={{
            width: 1250,
            height: 400,
            left: "4%",
            bottom: "-24%",
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.68), rgba(255,255,255,0) 72%)",
            filter: "blur(42px)",
            transform: "rotate(-8deg)",
          }}
        />
      </div>
      <Grain id="heroGrain" opacity={0.13} />

      <div className="relative z-[2] mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 px-6 pb-[104px] pt-24 md:px-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <h1 className="m-0 text-[clamp(3rem,6.4vw,80px)] font-semibold leading-[0.98] -tracking-[0.03em] text-foreground">
            Turn comments
            <br />
            into clients.
          </h1>

          <p className="my-8 max-w-[480px] text-[18px] leading-[1.6] text-foreground-muted">
            A wall of comment &ldquo;PROMPT&rdquo; doesn&rsquo;t get you clients.
            prmpt does &mdash; it turns every one of those comments into a lead,
            hands over your prompt like a pro, and books the call for you.
          </p>

          <div className="flex flex-wrap items-center gap-[22px]">
            <Link
              href="/auth/signup"
              className="inline-flex h-[54px] items-center rounded-full bg-primary px-[30px] text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open your prmpt page
            </Link>
            <Link
              href="/prompts"
              className="text-[15px] font-medium text-foreground-muted underline decoration-foreground-muted/35 underline-offset-[3px] transition-colors hover:text-foreground"
            >
              Looking for prompts to use? Browse the library &rarr;
            </Link>
          </div>
        </div>

        {/* Liquid-glass product panel, resting on a 3D angle. */}
        <div
          className="w-full max-w-[480px] justify-self-center lg:justify-self-end"
          style={{ perspective: "1700px" }}
        >
          <div
            ref={cardRef}
            className="landing-glass relative overflow-hidden will-change-transform"
            style={{
              transform: `rotateY(${BASE.ry}deg) rotateX(${BASE.rx}deg) rotate(${BASE.rot}deg)`,
              transformOrigin: "center",
              transition: "transform 0.2s ease-out",
            }}
          >
            <div
              ref={shineRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[5]"
              style={{ background: REST_SHINE, transition: "background 0.2s ease-out" }}
            />

            <div className="landing-glass-divider flex items-center gap-3 px-5 py-4">
              <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-background-inset text-[11px] text-foreground-muted">
                CN
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-foreground">
                  The pre-call research brief
                </div>
                <div className="text-[10.5px] tracking-[0.04em] text-foreground-subtle">
                  CONNOR NORTH · SALES · v1.2
                </div>
              </div>
              <span className="ml-auto text-[10px] tracking-[0.08em] text-foreground">
                3 FIELDS
              </span>
            </div>

            <div className="landing-glass-body px-[22px] pb-5 pt-[22px]">
              <div className="text-[13px] leading-[2.05] text-foreground-muted">
                Research{" "}
                <span className="inline-block rounded-[3px] border-[1.5px] border-primary bg-white/85 px-2 py-px text-foreground">
                  Acme, Inc.
                </span>{" "}
                before my discovery call. They&rsquo;re a{" "}
                <span className="inline-block rounded-[3px] border border-border-strong bg-background px-2 py-px">
                  Series B fintech
                </span>{" "}
                and I&rsquo;m selling{" "}
                <span className="inline-block rounded-[3px] border border-border-strong bg-background px-2 py-px">
                  a compliance layer
                </span>
                .
              </div>

              <div className="mt-5 flex items-center gap-2.5">
                <span className="inline-flex h-10 items-center rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground">
                  Copy prompt
                </span>
                <span className="inline-flex h-10 items-center gap-2.5 rounded-sm border border-border-strong bg-background px-3.5 text-[13px] font-medium text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Open in Claude
                  <ChevronDown className="h-3 w-3 text-foreground-subtle" />
                </span>
                <span className="ml-auto text-[10px] tracking-[0.06em] text-foreground-subtle">
                  3 / 3
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 px-[22px] pb-5 pt-3.5">
              <div className="landing-glass-row flex items-center gap-2.5 rounded-lg px-3.5 py-[11px]">
                <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-background-inset text-[9px] text-foreground-muted">
                  MO
                </span>
                <span className="text-[13px] text-foreground-muted">
                  Maya kept{" "}
                  <span className="font-semibold text-foreground">
                    PRDs in an Afternoon
                  </span>
                </span>
                <span className="ml-auto text-[10px] text-foreground-subtle">2m</span>
              </div>
              <div className="landing-glass-row flex items-center gap-2.5 rounded-lg px-3.5 py-[11px]">
                <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-background-inset text-[9px] text-foreground-muted">
                  DR
                </span>
                <span className="text-[13px] text-foreground-muted">
                  Dev unlocked{" "}
                  <span className="font-semibold text-foreground">
                    The Recruiter&rsquo;s Kit
                  </span>
                </span>
                <span className="ml-auto text-[10px] text-foreground-subtle">5m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
