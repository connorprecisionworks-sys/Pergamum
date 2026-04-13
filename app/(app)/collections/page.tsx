import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CollectionCard } from "@/components/collections/collection-card";
import type { Collection, Profile } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse curated prompt collections from the Pergamum community.",
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-serif">Collections</h1>
        <p className="text-muted-foreground mt-1">
          Curated prompt sets from the community.
        </p>
      </div>

      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground py-20 text-center">
          The shelves are still being filled. Be the first to create a collection.
        </p>
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
