"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  return {};
}
