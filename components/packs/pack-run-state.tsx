"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PackRunState {
  hasRun: boolean;
  markRun: () => void;
}

const PackRunStateContext = createContext<PackRunState | null>(null);

/** Tracks whether the lead has run any prompt in this pack during the
 *  current visit — mirrors prompt-detail's session-only hasRun, scoped
 *  to the whole pack instead of a single prompt. */
export function PackRunStateProvider({ children }: { children: ReactNode }) {
  const [hasRun, setHasRun] = useState(false);
  const markRun = () => setHasRun(true);
  return (
    <PackRunStateContext.Provider value={{ hasRun, markRun }}>
      {children}
    </PackRunStateContext.Provider>
  );
}

export function usePackRunState(): PackRunState {
  const ctx = useContext(PackRunStateContext);
  if (!ctx) {
    throw new Error("usePackRunState must be used within a PackRunStateProvider");
  }
  return ctx;
}
