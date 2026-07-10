import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark, Layers, Plus, Rocket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeletePackButton } from "@/components/packs/builder/delete-pack-button";
import { relativeTime } from "@/lib/utils";
import type { Pack } from "@/lib/types/database";

export const metadata: Metadata = { title: "Your packs" };

export default async function DashboardPacksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/packs");

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  if (!profile) redirect("/auth/login");

  const { data: packs } = await supabase
    .from("packs")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const packIds = (packs ?? []).map((p) => p.id);
  const [{ data: itemCounts }, { data: saveCounts }] = await Promise.all([
    packIds.length > 0
      ? supabase.from("pack_items").select("pack_id").in("pack_id", packIds)
      : Promise.resolve({ data: [] as { pack_id: string }[] }),
    packIds.length > 0
      ? supabase.from("pack_saves").select("pack_id").in("pack_id", packIds)
      : Promise.resolve({ data: [] as { pack_id: string }[] }),
  ]);

  const itemCountByPack = new Map<string, number>();
  (itemCounts ?? []).forEach((r) => itemCountByPack.set(r.pack_id, (itemCountByPack.get(r.pack_id) ?? 0) + 1));
  const saveCountByPack = new Map<string, number>();
  (saveCounts ?? []).forEach((r) => saveCountByPack.set(r.pack_id, (saveCountByPack.get(r.pack_id) ?? 0) + 1));

  return (
    <div className="container py-10 max-w-3xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight font-serif">Your packs</h1>
          <p className="text-muted-foreground mt-1">Release bundles of prompts and skills like an album drop.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/packs/new">
            <Plus className="h-4 w-4 mr-2" />
            New release
          </Link>
        </Button>
      </div>

      {(packs ?? []).length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6 text-muted-foreground" />}
          title="No packs yet"
          description="Bundle a few prompts into a release — under three minutes from library to link."
          action={{ label: "Start your first pack", href: "/dashboard/packs/new" }}
        />
      ) : (
        <div className="space-y-2">
          {(packs as Pack[]).map((pack) => (
            <div
              key={pack.id}
              className="flex items-center justify-between gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <Link href={`/dashboard/packs/${pack.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      pack.status === "published"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {pack.status === "published" ? `Live · v${pack.version}` : "Draft"}
                  </span>
                  <span className="font-medium text-sm truncate">{pack.title}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {itemCountByPack.get(pack.id) ?? 0} tracks
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3 w-3" />
                    {saveCountByPack.get(pack.id) ?? 0} saves
                  </span>
                  <span>{relativeTime(pack.updated_at)}</span>
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                {pack.status === "published" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/packs/${profile.username}/${pack.slug}`} target="_blank" aria-label="View live pack">
                      <Rocket className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
                <DeletePackButton packId={pack.id} packTitle={pack.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
