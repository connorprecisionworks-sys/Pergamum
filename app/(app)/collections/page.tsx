import type { Metadata } from "next";
import { Library } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CollectionCard } from "@/components/collections/collection-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Collection, Profile } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse curated prompt collections from the PrmptKit community.",
};

export default async function CollectionsPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("collections")
    .select(`*, profiles:profiles!collections_owner_id_fkey(username, display_name)`)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(60);

  type CollectionRow = Collection & { profiles: Pick<Profile, "username" | "display_name"> };
  const collections = (rows ?? []) as CollectionRow[];

  return (
    <div className="container py-10">
      <div className="rounded-lg px-6 py-7 mb-8 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)]">
        <h1 className="text-3xl font-medium tracking-tight font-serif">Collections</h1>
        <p className="text-muted-foreground mt-1">
          Curated prompt sets from the community.
        </p>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={<Library className="h-6 w-6 text-muted-foreground" />}
          title="No public collections yet"
          description="Be the first to curate and share a collection."
          action={{ label: "Browse prompts", href: "/prompts" }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              owner={c.profiles}
              showOwner
            />
          ))}
        </div>
      )}
    </div>
  );
}
