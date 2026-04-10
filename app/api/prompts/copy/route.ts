import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { promptId?: string };
    const { promptId } = body;

    if (!promptId || typeof promptId !== "string") {
      return NextResponse.json({ error: "Invalid prompt ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // Read current view count then increment (Supabase doesn't support SQL expressions in update)
    const { data: prompt, error: readError } = await supabase
      .from("prompts")
      .select("views")
      .eq("id", promptId)
      .single();

    if (readError || !prompt) {
      return NextResponse.json({ ok: true }); // Silently succeed if prompt not found
    }

    await supabase
      .from("prompts")
      .update({ views: (prompt.views ?? 0) + 1 })
      .eq("id", promptId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
