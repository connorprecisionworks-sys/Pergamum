"use client";

import { useEffect, useState } from "react";

/**
 * Tracks `prefers-reduced-motion`. Every landing enhancement (tilt, magnetic
 * button, typewriter, faux cursor) reads this and ships static instead.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
