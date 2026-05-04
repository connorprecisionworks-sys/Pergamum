"use server";

import { revalidatePath } from "next/cache";
import { grantBuildAccess } from "@/lib/build-access";

interface GateResult {
  success: boolean;
  error?: string;
}

export async function submitAccessCode(code: string): Promise<GateResult> {
  const trimmed = (code ?? "").trim();
  if (!trimmed) {
    return { success: false, error: "Enter your access code." };
  }
  const ok = await grantBuildAccess(trimmed);
  if (!ok) {
    return { success: false, error: "That code didn't match. Try again." };
  }
  // Re-render /build so the gate disappears and the builder loads.
  revalidatePath("/build");
  return { success: true };
}
