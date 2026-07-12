import { redirect } from "next/navigation";
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
  if (user && profile && !profile.onboarding_complete) {
    redirect("/onboarding");
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
