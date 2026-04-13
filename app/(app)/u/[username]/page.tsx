import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar, MapPin, Globe, Twitter, Github,
  ArrowUp, Eye, Award, Star, FileText, Bookmark, Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PromptCard } from "@/components/prompts/prompt-card";
import { CollectionCard } from "@/components/collections/collection-card";
import { BadgeShowcase } from "@/components/profile/badge-showcase";
import { FollowButton } from "@/components/profile/follow-button";
import { formatCount, relativeTime } from "@/lib/utils";
import type { PromptWithAuthor, Badge as BadgeType, UserBadge, Collection } from "@/lib/types/database";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}`, description: `${username}'s prompt library on Pergamum.` };
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the profile being viewed
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  // Parallel data fetches
  const [
    promptsResult,
    collectionsResult,
    badgesResult,
    userBadgesResult,
    followerCountResult,
    followingCountResult,
    isFollowingResult,
    featuredPromptResult,
  ] = await Promise.all([
    supabase
      .from("prompts")
      .select(`*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`)
      .eq("author_id", profile.id)
      .eq("status", "published")
      .order("upvotes", { ascending: false }),

    supabase
      .from("collections")
      .select("*")
      .eq("owner_id", profile.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),

    supabase.from("badges").select("*").order("tier"),

    supabase.from("user_badges").select("*").eq("user_id", profile.id),

    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),

    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),

    user
      ? supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),

    profile.featured_prompt_id
      ? supabase.from("prompts").select(`*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`).eq("id", profile.featured_prompt_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const prompts = (promptsResult.data ?? []) as PromptWithAuthor[];
  const collections = (collectionsResult.data ?? []) as Collection[];
  const allBadges = (badgesResult.data ?? []) as BadgeType[];
  const userBadges = (userBadgesResult.data ?? []) as UserBadge[];
  const followerCount = followerCountResult.count ?? 0;
  const followingCount = followingCountResult.count ?? 0;
  const isFollowing = !!isFollowingResult.data;
  const featuredPrompt = featuredPromptResult?.data as PromptWithAuthor | null;

  // Fetch prompt counts per collection
  const collectionIds = collections.map((c) => c.id);
  const { data: promptCounts } = collectionIds.length > 0
    ? await supabase
        .from("collection_prompts")
        .select("collection_id")
        .in("collection_id", collectionIds)
    : { data: [] };

  const countByCollection = (promptCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.collection_id] = (acc[row.collection_id] ?? 0) + 1;
    return acc;
  }, {});

  // Activity feed: last 20 events across prompts + collections + badges
  type ActivityItem =
    | { kind: "prompt"; title: string; slug: string; ts: string }
    | { kind: "collection"; title: string; ownerUsername: string; collSlug: string; ts: string }
    | { kind: "badge"; name: string; icon: string; tier: string; ts: string };

  const activity: ActivityItem[] = [
    ...prompts.slice(0, 10).map((p) => ({
      kind: "prompt" as const,
      title: p.title,
      slug: p.slug,
      ts: p.published_at ?? p.created_at,
    })),
    ...collections.slice(0, 5).map((c) => ({
      kind: "collection" as const,
      title: c.title,
      ownerUsername: username,
      collSlug: c.slug,
      ts: c.created_at,
    })),
    ...userBadges.slice(0, 5).map((ub) => {
      const badge = allBadges.find((b) => b.id === ub.badge_id);
      return {
        kind: "badge" as const,
        name: badge?.name ?? "Badge",
        icon: badge?.icon ?? "Award",
        tier: badge?.tier ?? "bronze",
        ts: ub.earned_at,
      };
    }),
  ]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 20);

  const initials = profile.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile.username.slice(0, 2).toUpperCase();

  return (
    <div className="container py-10 max-w-5xl">
      {/* ── Profile Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name ?? profile.username} />
          <AvatarFallback className="text-2xl bg-pergamum-100 text-pergamum-700">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold font-serif">{profile.display_name ?? profile.username}</h1>
                {profile.is_admin && <Badge variant="pergamum" className="text-xs">Admin</Badge>}
              </div>
              <p className="text-muted-foreground text-sm">@{profile.username}</p>
            </div>
            <FollowButton
              targetUserId={profile.id}
              currentUserId={user?.id ?? null}
              initiallyFollowing={isFollowing}
            />
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed max-w-xl">{profile.bio}</p>
          )}

          {/* Meta: location, joined, social links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {relativeTime(profile.created_at)}
            </span>
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Globe className="h-3 w-3" />
                Website
              </a>
            )}
            {profile.twitter && (
              <a href={`https://twitter.com/${profile.twitter.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Twitter className="h-3 w-3" />
                @{profile.twitter.replace(/^@/, "")}
              </a>
            )}
            {profile.github && (
              <a href={`https://github.com/${profile.github.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Github className="h-3 w-3" />
                {profile.github.replace(/^@/, "")}
              </a>
            )}
          </div>

          {/* Followers / following */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span>
              <span className="font-semibold">{formatCount(followerCount)}</span>{" "}
              <span className="text-muted-foreground">follower{followerCount !== 1 ? "s" : ""}</span>
            </span>
            <span>
              <span className="font-semibold">{formatCount(followingCount)}</span>{" "}
              <span className="text-muted-foreground">following</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Star, label: "Reputation", value: formatCount(profile.reputation) },
          { icon: FileText, label: "Prompts", value: formatCount(prompts.length) },
          { icon: ArrowUp, label: "Upvotes received", value: formatCount(profile.lifetime_upvotes_received ?? 0) },
          { icon: Award, label: "Badges", value: userBadges.length.toString() },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{label}</span>
              </div>
              <div className="text-xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Badges ─────────────────────────────────────────────── */}
      {allBadges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Badges</h2>
          <BadgeShowcase allBadges={allBadges} earnedBadges={userBadges} />
        </div>
      )}

      {/* ── Featured prompt ────────────────────────────────────── */}
      {featuredPrompt && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Featured</h2>
          <div className="max-w-md">
            <PromptCard prompt={featuredPrompt} />
          </div>
        </div>
      )}

      <Separator className="mb-8" />

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <Tabs defaultValue="prompts">
        <TabsList className="mb-6">
          <TabsTrigger value="prompts">
            Prompts ({prompts.length})
          </TabsTrigger>
          <TabsTrigger value="collections">
            Collections ({collections.length})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Prompts */}
        <TabsContent value="prompts">
          {prompts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              The shelves are still being filled.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prompts.map((p) => <PromptCard key={p.id} prompt={p} />)}
            </div>
          )}
        </TabsContent>

        {/* Collections */}
        <TabsContent value="collections">
          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No collections curated yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {collections.map((c) => (
                <CollectionCard
                  key={c.id}
                  collection={{ ...c, prompt_count: countByCollection[c.id] ?? 0 }}
                  owner={{ username: profile.username, display_name: profile.display_name }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No recent activity.
            </p>
          ) : (
            <div className="space-y-3 max-w-2xl">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {item.kind === "prompt" && <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                    {item.kind === "collection" && <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />}
                    {item.kind === "badge" && <Award className="h-3.5 w-3.5 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.kind === "prompt" && (
                      <p className="leading-snug">
                        Published{" "}
                        <Link href={`/prompts/${item.slug}`} className="font-medium hover:text-pergamum-600 transition-colors">
                          {item.title}
                        </Link>
                      </p>
                    )}
                    {item.kind === "collection" && (
                      <p className="leading-snug">
                        Created collection{" "}
                        <Link href={`/collections/${item.ownerUsername}/${item.collSlug}`} className="font-medium hover:text-pergamum-600 transition-colors">
                          {item.title}
                        </Link>
                      </p>
                    )}
                    {item.kind === "badge" && (
                      <p className="leading-snug">
                        Earned badge{" "}
                        <span className="font-medium">{item.name}</span>
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground">{relativeTime(item.ts)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
