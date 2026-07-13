import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomePicker } from "@/components/welcome/welcome-picker";

export const metadata: Metadata = {
  title: "Welcome",
};

interface WelcomePageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams;
  const rawNext = params.next;
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  // Already picked a lane — no back-door re-pick here (that lives in settings).
  if (profile.account_type !== null) redirect("/dashboard");

  return <WelcomePicker next={next} />;
}
