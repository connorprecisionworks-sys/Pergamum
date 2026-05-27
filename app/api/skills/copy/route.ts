import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/skills/copy
 * Body: { skillId: string }
 *
 * Best-effort vanity counter — bumps skills.copies by 1.
 * Uses the service-role client because RLS on `skills` only lets
 * authors + admins write, but anyone clicking "copy" should be counted.
 *
 * Returns 204 on success. Failures are silent (this is fire-and-forget
 * from the client — the UX doesn't depend on it).
 */
export async function POST(request: Request) {
  let body: { skillId?: string };
  try {
    body = (await request.json()) as { skillId?: string };
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const skillId = body.skillId;
  if (!skillId || typeof skillId !== "string") {
    return new NextResponse(null, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Read current count, then write count+1. (Not atomic, but this is
  // a non-critical vanity counter — eventual consistency is fine.)
  const { data: row } = await supabase
    .from("skills")
    .select("copies")
    .eq("id", skillId)
    .single();

  if (!row) {
    return new NextResponse(null, { status: 404 });
  }

  await supabase
    .from("skills")
    .update({ copies: (row.copies ?? 0) + 1 })
    .eq("id", skillId);

  return new NextResponse(null, { status: 204 });
}
