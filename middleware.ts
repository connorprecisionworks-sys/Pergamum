import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Defense in depth: a Supabase "Site URL" fallback (or a misconfigured
  // redirect allowlist) can land an OAuth/PKCE ?code= on a page other than
  // /auth/callback. Forward it there instead of stranding it — a code left
  // unexchanged looks exactly like a failed sign-in.
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  if (code && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    const next = searchParams.get("next");
    url.pathname = "/auth/callback";
    url.search = "";
    url.searchParams.set("code", code);
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
