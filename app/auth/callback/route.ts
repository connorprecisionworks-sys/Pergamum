import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Validate next is a relative path — reject protocol-relative URLs (//evil.com)
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (code) {
    let cookiesToSet: { name: string; value: string; options?: CookieOptions }[] = [];

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(toSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet = toSet;
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if the user needs to complete onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const withNext = (path: string) => `${path}?next=${encodeURIComponent(next)}`;

      let dest = next;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type, creator_onboarding_complete, onboarding_complete")
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.account_type === null) {
            dest = withNext("/welcome");
          } else if (profile.account_type === "creator" && !profile.creator_onboarding_complete) {
            dest = withNext("/creator/onboarding");
          } else if (profile.account_type === "client" && !profile.onboarding_complete) {
            dest = withNext("/onboarding");
          }
        }
      }

      const response = NextResponse.redirect(new URL(dest, origin));
      cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth`);
}
