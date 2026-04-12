import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ImportForm } from "./import-form";

export const metadata: Metadata = {
  title: "Admin — Bulk Import",
};

export default async function AdminImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order");

  return (
    <div className="container py-10">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to moderation queue
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Bulk import prompts</h1>
        <p className="text-muted-foreground mt-1">
          Paste JSON to seed the library. Admin only.
        </p>
      </div>

      <ImportForm categories={categories ?? []} adminId={user.id} />
    </div>
  );
}
