import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CollectionManager } from "./collection-manager";

export const metadata: Metadata = { title: "My Collections" };

interface PageProps {
  searchParams: Promise<{ new?: string }>;
}

export default async function DashboardCollectionsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/collections");

  const { data: profile } = await supabase
    .from("profiles").select("username").eq("id", user.id).single();
  if (!profile) redirect("/auth/login");

  const { data: collections } = await supabase
    .from("collections")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const params = await searchParams;
  const openNew = params.new === "1";

  return (
    <div className="container py-10 max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-serif">My collections</h1>
        <p className="text-muted-foreground mt-1">Create and manage curated lists of prompts.</p>
      </div>
      <CollectionManager
        collections={collections ?? []}
        ownerUsername={profile.username}
        openNew={openNew}
      />
    </div>
  );
}
