import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PromptCard } from "@/components/prompts/prompt-card";
import { relativeTime } from "@/lib/utils";
import type { PromptWithAuthor } from "@/lib/types/database";

interface CollectionPageProps {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const supabase = await createClient();
  const { data: owner } = await supabase.from("profiles").select("id").eq("username", username).single();
  if (!owner) return { title: "Collection not found" };
  const { data: col } = await supabase.from("collections").select("title, description").eq("owner_id", owner.id).eq("slug", slug).single();
  return { title: col?.title ?? "Collection", description: col?.description ?? undefined };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { username, slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Resolve owner → collection
  const { data: owner } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .single();

  if (!owner) notFound();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("owner_id", owner.id)
    .eq("slug", slug)
    .single();

  if (!collection) notFound();

  // Private collections only visible to owner
  if (!collection.is_public && collection.owner_id !== user?.id) notFound();

  // Fetch prompts in sort order
  const { data: collectionPrompts } = await supabase
    .from("collection_prompts")
    .select("prompt_id, sort_order")
    .eq("collection_id", collection.id)
    .order("sort_order");

  const promptIds = (collectionPrompts ?? []).map((cp) => cp.prompt_id);

  let prompts: PromptWithAuthor[] = [];
  if (promptIds.length > 0) {
    const { data } = await supabase
      .from("prompts")
      .select(`*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`)
      .in("id", promptIds)
      .eq("status", "published");
    // Re-sort to match collection order
    const byId = Object.fromEntries((data ?? []).map((p) => [p.id, p]));
    prompts = promptIds.map((id) => byId[id]).filter(Boolean) as PromptWithAuthor[];
  }

  const initials = owner.display_name
    ? owner.display_name.slice(0, 2).toUpperCase()
    : owner.username.slice(0, 2).toUpperCase();

  return (
    <div className="container py-10 max-w-5xl">
      <Link
        href="/collections"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All collections
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-3 rounded-xl bg-pergamum-50 dark:bg-pergamum-950/30 border">
            <Bookmark className="h-6 w-6 text-pergamum-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold font-serif">{collection.title}</h1>
              {!collection.is_public && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Lock className="h-3 w-3" />
                  Private
                </Badge>
              )}
            </div>
            {collection.description && (
              <p className="text-muted-foreground mt-1 text-sm">{collection.description}</p>
            )}
          </div>
        </div>

        {/* Owner meta */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarImage src={owner.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px] bg-pergamum-100 text-pergamum-700">{initials}</AvatarFallback>
          </Avatar>
          <Link href={`/u/${owner.username}`} className="hover:text-foreground transition-colors font-medium">
            {owner.display_name ?? owner.username}
          </Link>
          <span>·</span>
          <span>{prompts.length} prompt{prompts.length !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>Updated {relativeTime(collection.updated_at)}</span>
        </div>
      </div>

      {/* Prompts */}
      {prompts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-20 text-center">
          This collection is empty.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prompts.map((p) => <PromptCard key={p.id} prompt={p} />)}
        </div>
      )}
    </div>
  );
}
