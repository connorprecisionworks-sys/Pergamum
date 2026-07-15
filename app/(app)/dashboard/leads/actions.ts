"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendLeadMessageEmail } from "@/lib/email/lead-message";

interface SendLeadMessageResult {
  error?: string;
}

interface SendLeadMessageRpcResult {
  sent: boolean;
  reason: string | null;
}

const REASON_MESSAGES: Record<string, string> = {
  not_authenticated: "Sign in to send a message.",
  not_a_lead: "That person isn't one of your leads.",
  opted_out: "This lead has opted out of messages from creators.",
  cooldown: "You already sent this lead a message in the last 24 hours.",
  invalid_offer_slot: "That offer slot isn't yours anymore. Refresh and try again.",
};

export async function sendLeadMessage(
  leadUserId: string,
  offerSlotId: string | null,
  body: string | null
): Promise<SendLeadMessageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to send a message." };

  const { data, error } = await supabase.rpc("send_lead_message", {
    p_lead_user_id: leadUserId,
    p_offer_slot_id: offerSlotId ?? undefined,
    p_body: body ?? undefined,
  });

  if (error) return { error: "Couldn't send that. Try again." };

  const result = data as unknown as SendLeadMessageRpcResult | null;
  if (!result?.sent) {
    return { error: REASON_MESSAGES[result?.reason ?? ""] ?? "Couldn't send that. Try again." };
  }

  revalidatePath("/dashboard/leads");

  // Best-effort, not awaited — the in-app notification (already inserted by
  // the RPC) is the real delivery; email is a bonus channel that must never
  // block or fail the send itself. Opt-out is already respected: the RPC
  // above returns sent=false and inserts nothing for an opted-out lead, so
  // reaching this line already means email is allowed.
  void notifyLeadByEmail(user.id, leadUserId, offerSlotId, body);

  return {};
}

/** Never trusts client-supplied content for the email — re-reads the
 *  creator's name and the offer's label/url server-side, and resolves the
 *  lead's address only via the service-role admin API so it never passes
 *  back through anything the creator's client could see. */
async function notifyLeadByEmail(
  creatorId: string,
  leadUserId: string,
  offerSlotId: string | null,
  body: string | null
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const service = await createServiceClient();

  const [{ data: creatorProfile }, offerResult, { data: authUser }] = await Promise.all([
    service.from("profiles").select("display_name, username").eq("id", creatorId).maybeSingle(),
    offerSlotId
      ? service.from("offer_slots").select("label, url").eq("id", offerSlotId).maybeSingle()
      : Promise.resolve({ data: null as { label: string; url: string } | null }),
    service.auth.admin.getUserById(leadUserId),
  ]);

  const email = authUser?.user?.email;
  if (!email) return;

  const creatorName = creatorProfile?.display_name ?? creatorProfile?.username ?? "A creator";

  await sendLeadMessageEmail(email, creatorName, offerResult.data?.label, offerResult.data?.url, body);
}

export async function markLeadBooked(leadUserId: string, booked: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to do that." };

  const { data, error } = await supabase.rpc("mark_lead_booked", {
    p_user_id: leadUserId,
    p_booked: booked,
  });

  if (error || !data) return { error: "Couldn't update that. Try again." };

  revalidatePath("/dashboard/leads");
  return {};
}
