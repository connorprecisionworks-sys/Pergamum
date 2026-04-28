import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, props } = body as { event?: string; props?: Record<string, unknown> };

    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "event required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // analytics_events table is not in generated types until migration runs
    // eslint-disable-next-line
    await (supabase as any).from("analytics_events").insert({
      event,
      props: props ?? null,
      user_id: user?.id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
