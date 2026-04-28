type TrackEvent =
  | "signup_started"
  | "signup_completed"
  | "onboarding_completed"
  | "first_prompt_submitted"
  | "first_prompt_published";

export function track(event: TrackEvent, props?: Record<string, unknown>): void {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, props }),
  }).catch(() => {
    // fire-and-forget — analytics failures are silent
  });
}
