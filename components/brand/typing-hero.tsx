"use client";

import { useEffect, useState } from "react";

const PHRASES = ["of prompts.", "of builders.", "of tools.", "of knowledge."];

const TYPE_SPEED = 75;   // ms per character when typing
const DELETE_SPEED = 38; // ms per character when deleting
const PAUSE_AFTER = 2200; // ms to hold completed phrase
const PAUSE_BEFORE = 280; // ms pause before typing next phrase

export function TypingHero() {
  const [displayed, setDisplayed] = useState(PHRASES[0]);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phase, setPhase] = useState<"hold" | "deleting" | "pause" | "typing">(
    "hold"
  );
  const [cursorVisible, setCursorVisible] = useState(true);

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Main animation loop
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;

    if (phase === "hold") {
      id = setTimeout(() => setPhase("deleting"), PAUSE_AFTER);
    } else if (phase === "deleting") {
      if (displayed.length === 0) {
        setPhase("pause");
      } else {
        id = setTimeout(() => {
          setDisplayed((t) => t.slice(0, -1));
        }, DELETE_SPEED);
      }
    } else if (phase === "pause") {
      id = setTimeout(() => {
        const next = (phraseIdx + 1) % PHRASES.length;
        setPhraseIdx(next);
        setPhase("typing");
      }, PAUSE_BEFORE);
    } else if (phase === "typing") {
      const target = PHRASES[phraseIdx];
      if (displayed.length === target.length) {
        setPhase("hold");
      } else {
        id = setTimeout(() => {
          setDisplayed(target.slice(0, displayed.length + 1));
        }, TYPE_SPEED);
      }
    }

    return () => clearTimeout(id);
  }, [phase, displayed, phraseIdx]);

  // Stop blinking while actively typing or deleting — solid cursor during motion
  const isAnimating = phase === "typing" || phase === "deleting";
  const caretOpacity = isAnimating ? 1 : cursorVisible ? 1 : 0;

  return (
    <span className="whitespace-nowrap">
      <span className="text-pergamum-500">{displayed}</span>
      <span
        className="inline-block w-[2px] rounded-sm bg-pergamum-500 align-middle mx-[1px]"
        style={{
          height: "1em",
          verticalAlign: "-0.1em",
          opacity: caretOpacity,
          transition: isAnimating ? "none" : "opacity 0.08s",
        }}
        aria-hidden="true"
      />
    </span>
  );
}
