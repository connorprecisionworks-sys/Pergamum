import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PackFocusHeader } from "@/components/packs/pack-focus-header";
import { PackDetail } from "@/components/packs/pack-detail";
import type { PackItemWithContent, PackWithCreator } from "@/lib/types/database";

interface PackPageProps {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ via?: string }>;
}

export async function generateMetadata({ params }: PackPageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const supabase = await createClient();
  const { data: owner } = await supabase.from("profiles").select("id").eq("username", username).single();
  if (!owner) return { title: "Pack not found" };
  const { data: pack } = await supabase
    .from("packs")
    .select("title, liner_note")
    .eq("creator_id", owner.id)
    .eq("slug", slug)
    .single();
  if (!pack) return { title: "Pack not found" };
  return { title: pack.title, description: pack.liner_note ?? undefined };
}

export default async function PackPage({ params, searchParams }: PackPageProps) {
  const { username, slug } = await params;
  const sp = await searchParams;
  const funnelMode = Boolean(sp.via);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: owner } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("username", username)
    .single();
  if (!owner) notFound();

  const { data: pack } = await supabase
    .from("packs")
    .select("*")
    .eq("creator_id", owner.id)
    .eq("slug", slug)
    .single();
  if (!pack) notFound();
  if (pack.status !== "published" && pack.creator_id !== user?.id) notFound();

  const { data: itemRows } = await supabase
    .from("pack_items")
    .select(
      `*,
      prompts:prompts(*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)),
      skills:skills(*, profiles:profiles!skills_author_id_fkey(id, username, display_name, avatar_url))`
    )
    .eq("pack_id", pack.id)
    .order("position");

  const items = (itemRows ?? []) as unknown as PackItemWithContent[];

  const { data: versions } = await supabase
    .from("pack_versions")
    .select("*")
    .eq("pack_id", pack.id)
    .order("version", { ascending: false });

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", owner.id);

  let initiallyFollowing = false;
  let initiallySaved = false;
  let headerProfile = null;
  let unreadNotifications = 0;
  if (user) {
    const [followResult, saveResult, profileResult, notifResult] = await Promise.all([
      supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", owner.id).maybeSingle(),
      supabase.from("pack_saves").select("id").eq("user_id", user.id).eq("pack_id", pack.id).maybeSingle(),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    ]);
    initiallyFollowing = !!followResult.data;
    initiallySaved = !!saveResult.data;
    headerProfile = profileResult.data;
    unreadNotifications = notifResult.count ?? 0;
  }

  const packWithCreator: PackWithCreator = { ...pack, profiles: owner };

  return (
    <div className="flex min-h-screen flex-col">
      {funnelMode ? (
        <PackFocusHeader profile={headerProfile} />
      ) : (
        <Header profile={headerProfile} unreadNotifications={unreadNotifications} />
      )}
      <main id="main" className="flex-1 container py-8">
        {!funnelMode && (
          <Link
            href={`/u/${owner.username}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {owner.display_name ?? owner.username}
          </Link>
        )}
        <PackDetail
          pack={packWithCreator}
          items={items}
          versions={versions ?? []}
          currentUserId={user?.id ?? null}
          initiallyFollowing={initiallyFollowing}
          initiallySaved={initiallySaved}
          followerCount={followerCount ?? 0}
          funnelMode={funnelMode}
        />
      </main>
      <Footer />
    </div>
  );
}
