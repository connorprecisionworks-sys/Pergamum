import { resend, EMAIL_FROM } from "./resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.useprmpt.com";

interface DigestItem {
  score?: number;
  stage?: string;
  trigger_event_type?: string;
}

function stageHeadline(stage: string, triggerEventType?: string): string {
  return triggerEventType === "offer_click"
    ? "A hot lead just clicked your offer button"
    : `A lead just went ${stage}`;
}

function bodyLine(triggerEventType?: string): string {
  return triggerEventType === "offer_click"
    ? "They are booking, or one nudge away. Watch your calendar."
    : "They have not clicked your offer yet — check what they did and consider a direct nudge.";
}

/** One transactional send — the anonymous payload copy from HOT-LEAD-HEAT-SPEC.md section 4. */
export async function sendHotLeadEmail(
  to: string,
  score: number,
  stage: string,
  triggerEventType?: string
): Promise<void> {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: stageHeadline(stage, triggerEventType) + " on Prmpt",
      html: `
        <p>${stageHeadline(stage, triggerEventType)}. Score ${Math.round(score)}.</p>
        <p>${bodyLine(triggerEventType)}</p>
        <p><a href="${APP_URL}/dashboard/leads">See the full signal breakdown</a></p>
      `,
    });
  } catch {
    // Best-effort — the lead event this rode in on already succeeded.
  }
}

/** Daily-digest roll-up: one email per creator covering every unsent alert. */
export async function sendHotLeadDigestEmail(to: string, items: DigestItem[]): Promise<void> {
  if (!resend) return;
  if (items.length === 0) return;

  const rows = items
    .map(
      (i) =>
        `<li>${stageHeadline(i.stage ?? "hot", i.trigger_event_type)} — score ${Math.round(i.score ?? 0)}</li>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `${items.length} lead${items.length === 1 ? "" : "s"} moved today on Prmpt`,
      html: `
        <p>Today's activity on your prompts:</p>
        <ul>${rows}</ul>
        <p><a href="${APP_URL}/dashboard/leads">See the full pipeline</a></p>
      `,
    });
  } catch {
    // Best-effort — the digest still marks notifications read; a quiet
    // failure here is better than a broken cron run for every creator.
  }
}
