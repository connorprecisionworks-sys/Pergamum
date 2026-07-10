// Lightweight, client-only session counter for the "show on second
// session" trigger in the progressive personalization card. Counts once
// per browser session (sessionStorage dedupes within a tab's lifetime),
// persisted across sessions via localStorage. Not tied to auth — it's a
// per-browser approximation, not a server-tracked session count.

const COUNT_KEY = "pk_session_count";
const COUNTED_FLAG_KEY = "pk_session_counted";

export function getSessionCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const alreadyCountedThisSession = sessionStorage.getItem(COUNTED_FLAG_KEY);
    let count = parseInt(localStorage.getItem(COUNT_KEY) ?? "0", 10) || 0;
    if (!alreadyCountedThisSession) {
      count += 1;
      localStorage.setItem(COUNT_KEY, String(count));
      sessionStorage.setItem(COUNTED_FLAG_KEY, "1");
    }
    return count;
  } catch {
    return 0;
  }
}
