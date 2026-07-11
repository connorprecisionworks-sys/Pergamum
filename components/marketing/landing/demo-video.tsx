"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

/** Fraction of the band that must be visible before playback starts. */
const START_THRESHOLD = 0.55;

/**
 * Full-bleed demo band. Holds its first frame (the poster) until the section is
 * at least 55% in view, then plays once from t=0 — so it reads as an animation
 * that starts as you arrive at it, not a video that was already running.
 */
export function DemoVideo() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasStarted = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || hasStarted.current) continue;
          hasStarted.current = true;
          video.currentTime = 0;
          void video.play().catch(() => {
            // Autoplay can still be refused; the poster stays and the controls work.
          });
          observer.disconnect();
        }
      },
      { threshold: START_THRESHOLD },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      hasStarted.current = true;
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const restart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    hasStarted.current = true;
    video.currentTime = 0;
    void video.play().catch(() => {});
  }, []);

  return (
    <section
      ref={sectionRef}
      className="landing-demo-bg relative w-full overflow-hidden"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/demo.mp4"
          poster="/demo-poster.jpg"
          muted
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={restart}
            aria-label="Restart the demo"
            className="landing-media-btn flex h-14 w-14 items-center justify-center rounded-full"
          >
            <RotateCcw className="h-5 w-5 text-foreground-subtle" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause the demo" : "Play the demo"}
            className="landing-media-btn flex h-14 w-14 items-center justify-center rounded-full"
          >
            {playing ? (
              <Pause className="h-5 w-5 text-foreground-subtle" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 text-foreground-subtle" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
