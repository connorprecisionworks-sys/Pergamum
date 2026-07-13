import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Validate next is a relative path — reject protocol-relative URLs (//evil.com)
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if the user needs to complete onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type, creator_onboarding_complete, onboarding_complete")
          .eq("id", user.id)
          .single();

        const withNext = (path: string) => `${origin}${path}?next=${encodeURIComponent(next)}`;

        if (profile) {
          if (profile.account_type === null) {
            return NextResponse.redirect(withNext("/welcome"));
          }
          if (profile.account_type === "creator" && !profile.creator_onboarding_complete) {
            return NextResponse.redirect(withNext("/creator/onboarding"));
          }
          if (profile.account_type === "client" && !profile.onboarding_complete) {
            return NextResponse.redirect(withNext("/onboarding"));
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth`);
}
