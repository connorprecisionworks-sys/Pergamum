import { resend, EMAIL_FROM } from "./resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.useprmpt.com";

/** One transactional send for LEAD-MESSAGING-SPEC.md — the creator's offer,
 *  delivered without the creator ever seeing this address. */
export async function sendLeadMessageEmail(
  to: string,
  creatorName: string,
  offerLabel: string | undefined,
  offerUrl: string | undefined,
  note: string | null | undefined
): Promise<void> {
  if (!resend) return;

  const offerHtml =
    offerLabel && offerUrl
      ? `<p><a href="${offerUrl}">${offerLabel}</a></p>`
      : "";
  const noteHtml = note ? `<p>${note}</p>` : "";

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `${creatorName} sent you something on Prmpt`,
      html: `
        <p>${creatorName} sent you something on Prmpt.</p>
        ${offerHtml}
        ${noteHtml}
        <p><a href="${APP_URL}/notifications">View in Prmpt</a></p>
      `,
    });
  } catch {
    // Best-effort — the message itself already sent in-app before this fires.
  }
}
