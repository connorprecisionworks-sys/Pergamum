import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ClaimReconciler } from "@/components/layout/claim-reconciler";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let unreadNotifications = 0;
  if (user) {
    const [{ data }, { count }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
    ]);
    profile = data;
    unreadNotifications = count ?? 0;
  }

  // Onboarding is mandatory (post-value, not a signup wall). Every (app)
  // route shares this layout, so gating here — not per-page — is what makes
  // it impossible to reach /library, /dashboard, etc. by typing the URL.
  // Three lanes (CREATOR-ONBOARDING-SPEC.md "The routing problem"):
  // unchosen -> pick a lane; creator, unfinished -> creator onboarding;
  // client, unfinished -> the existing client onboarding, untouched.
  //
  // Exception: /dashboard/packs* is exempt from the creator-onboarding
  // bounce. Onboarding step 2 links to the pack builder there ("Build a
  // pack," encouraged not required) — without this exemption a mid-
  // onboarding creator following that link gets bounced straight back by
  // this same gate, an unreachable loop. Every other route still bounces
  // them back, so leaving the packs area auto-returns them to finish.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const inPackBuilder = pathname.startsWith("/dashboard/packs");
  if (user && profile) {
    if (profile.account_type === null) {
      redirect("/welcome");
    } else if (profile.account_type === "creator" && !profile.creator_onboarding_complete && !inPackBuilder) {
      redirect("/creator/onboarding");
    } else if (profile.account_type === "client" && !profile.onboarding_complete) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <ClaimReconciler profileId={profile?.id} />
      <AppSidebar profile={profile} unreadNotifications={unreadNotifications} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
