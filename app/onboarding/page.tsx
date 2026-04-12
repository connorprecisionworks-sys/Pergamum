import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Set up your account",
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  // Skip if already onboarded
  if (profile.onboarding_complete) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-pergamum-50/30 to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex justify-center">
            <Logo variant="full" size="md" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome to Pergamum
            </h1>
            <p className="text-sm text-muted-foreground">
              Set up your profile before you start — it only takes a moment.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <OnboardingForm profile={profile} />
        </div>
      </div>
    </div>
  );
}
