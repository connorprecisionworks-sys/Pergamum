import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Compass, History as HistoryIcon, Layers, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { PromptCard } from "@/components/prompts/prompt-card";
import { PackCover } from "@/components/packs/pack-cover";
import { LibraryHistoryTable } from "@/components/library/library-history-table";
import { relativeTime } from "@/lib/utils";
import type { PromptWithAuthor } from "@/lib/types/database";

export const metadata: Metadata = { title: "Your library" };

interface RunOrPresetPromptRef {
  id: string;
  title: string;
  slug: string;
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/library");

  const [
    { data: runs },
    { data: presets },
    { data: packSaveRows },
    { data: promptSaveRows },
    { data: followRows },
  ] = await Promise.all([
    supabase
      .from("prompt_runs")
      .select("id, prompt_id, values, created_at, prompts(id, title, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("prompt_presets")
      .select("id, prompt_id, name, values, updated_at, prompts(id, title, slug)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("pack_saves")
      .select("id, pack_id, created_at, packs(*, profiles:profiles!packs_creator_id_fkey(id, username, display_name, avatar_url))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("prompt_saves")
      .select(
        `id, created_at, prompts(*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon))`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("follows").select("following_id, created_at").eq("follower_id", user.id).order("created_at", { ascending: false }),
  ]);

  type RunRow = { id: string; prompt_id: string; values: unknown; created_at: string; prompts: RunOrPresetPromptRef | null };
  type PresetRow = { id: string; prompt_id: string; name: string; values: unknown; updated_at: string; prompts: RunOrPresetPromptRef | null };
  const runList = ((runs ?? []) as unknown as RunRow[]).filter((r) => r.prompts);
  const presetList = ((presets ?? []) as unknown as PresetRow[]).filter((p) => p.prompts);

  const packSaveList = (packSaveRows ?? []) as unknown as {
    id: string;
    pack_id: string;
    created_at: string;
    packs: {
      id: string;
      title: string;
      slug: string;
      cover_seed: string | null;
      accent: string | null;
      version: number;
      status: string;
      profiles: { username: string; display_name: string | null } | null;
    } | null;
  }[];
  const savedPacks = packSaveList.filter((r) => r.packs);

  // Update badge: has a version shipped since this pack was saved?
  const savedPackIds = savedPacks.map((r) => r.pack_id);
  const { data: newerVersions } =
    savedPackIds.length > 0
      ? await supabase.from("pack_versions").select("pack_id, created_at").in("pack_id", savedPackIds)
      : { data: [] as { pack_id: string; created_at: string }[] };
  const hasUpdateSince = (packId: string, savedAt: string) =>
    (newerVersions ?? []).some((v) => v.pack_id === packId && v.created_at > savedAt);

  const promptSaveList = ((promptSaveRows ?? []) as unknown as { id: string; created_at: string; prompts: PromptWithAuthor | null }[]).filter(
    (r) => r.prompts
  );

  // Following: latest published pack + latest published prompt per creator.
  const followingIds = (followRows ?? []).map((f) => f.following_id);
  let followedProfiles: { id: string; username: string; display_name: string | null; avatar_url: string | null }[] = [];
  const latestPackByCreator = new Map<string, { title: string; slug: string; creatorUsername: string }>();
  const latestPromptByCreator = new Map<string, { title: string; slug: string }>();
  if (followingIds.length > 0) {
    const [{ data: profiles }, { data: latestPacksRaw }, { data: latestPromptsRaw }] = await Promise.all([
      supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", followingIds),
      supabase
        .from("packs")
        .select("title, slug, creator_id, released_at, profiles:profiles!packs_creator_id_fkey(username)")
        .eq("status", "published")
        .in("creator_id", followingIds)
        .order("released_at", { ascending: false }),
      supabase
        .from("prompts")
        .select("title, slug, author_id, published_at")
        .eq("status", "published")
        .in("author_id", followingIds)
        .order("published_at", { ascending: false }),
    ]);
    followedProfiles = profiles ?? [];
    for (const p of (latestPacksRaw ?? []) as unknown as {
      title: string;
      slug: string;
      creator_id: string;
      profiles: { username: string } | null;
    }[]) {
      if (!latestPackByCreator.has(p.creator_id) && p.profiles?.username) {
        latestPackByCreator.set(p.creator_id, { title: p.title, slug: p.slug, creatorUsername: p.profiles.username });
      }
    }
    for (const p of (latestPromptsRaw ?? []) as unknown as { title: string; slug: string; author_id: string }[]) {
      if (!latestPromptByCreator.has(p.author_id)) {
        latestPromptByCreator.set(p.author_id, { title: p.title, slug: p.slug });
      }
    }
  }

  const totalActivity = runList.length + presetList.length + savedPacks.length + promptSaveList.length + followedProfiles.length;

  // Post-claim heuristic: nothing saved except runs/presets pointing at the
  // one just-claimed prompt (claimPendingState writes exactly this shape —
  // see lib/claim.ts). Show a one-line pointer instead of a blank shelf.
  const distinctRunPresetPromptIds = new Set([...runList.map((r) => r.prompt_id), ...presetList.map((p) => p.prompt_id)]);
  const justClaimed =
    savedPacks.length === 0 &&
    promptSaveList.length === 0 &&
    distinctRunPresetPromptIds.size === 1 &&
    (runList.length > 0 || presetList.length > 0);
  const claimedPrompt = justClaimed ? runList[0]?.prompts ?? presetList[0]?.prompts : null;

  if (totalActivity === 0) {
    return (
      <div className="container py-10 max-w-3xl">
        <LibraryHeader />
        <EmptyState
          icon={<Compass className="h-6 w-6 text-muted-foreground" />}
          title="Your library is empty"
          description="Run a prompt, save a pack, or follow a creator — it'll all show up here."
          action={{ label: "Browse prompts", href: "/prompts" }}
        />
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-3xl space-y-12">
      <LibraryHeader />

      {claimedPrompt && (
        <p className="text-sm text-foreground-muted -mt-8">
          You claimed <span className="text-foreground font-medium">{claimedPrompt.title}</span> — it&apos;s saved
          below. <Link href="/prompts" className="underline underline-offset-2 hover:text-foreground">Browse more</Link> to
          add to your library.
        </p>
      )}

      {/* Z1 — Resume strip */}
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-3">Resume</h2>
        {runList.length === 0 ? (
          <p className="text-sm text-foreground-muted">Nothing to resume yet.</p>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {runList.slice(0, 3).map((run) => (
              <div key={run.id} className="border border-border rounded-md px-4 py-3 min-w-[220px] max-w-xs">
                <p className="text-sm font-medium truncate">{run.prompts!.title}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-foreground-subtle">{relativeTime(run.created_at)}</span>
                  <Link
                    href={`/prompts/${run.prompts!.slug}?run=${run.id}`}
                    className="text-xs text-foreground-subtle hover:text-foreground underline underline-offset-2"
                  >
                    Run again
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Z2 — Your packs */}
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-3">Your packs</h2>
        {savedPacks.length === 0 ? (
          <p className="text-sm text-foreground-muted">No saved packs yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {savedPacks.map((r) => {
              const pack = r.packs!;
              const updated = hasUpdateSince(pack.id, r.created_at);
              return (
                <Link key={r.id} href={`/packs/${pack.profiles?.username}/${pack.slug}`} className="group block">
                  <div className="relative">
                    <PackCover title={pack.title} seed={pack.cover_seed ?? pack.id} accent={pack.accent} />
                    {updated && (
                      <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-mono px-1.5 py-0.5 rounded">
                        v{pack.version} · new
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1.5 truncate group-hover:text-brand-400 transition-colors">
                    {pack.title}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        {/* Singles */}
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mt-6 mb-3">Singles</h3>
        {promptSaveList.length === 0 ? (
          <p className="text-sm text-foreground-muted">No saved prompts yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promptSaveList.map((r) => (
              <PromptCard key={r.id} prompt={r.prompts!} />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Z3 — Presets & history */}
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-3">
          Named presets
        </h2>
        {presetList.length === 0 ? (
          <p className="text-sm text-foreground-muted mb-6">No saved presets yet.</p>
        ) : (
          <div className="space-y-1.5 mb-6">
            {presetList.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/60 last:border-b-0">
                <div className="min-w-0">
                  <span className="text-sm font-medium">{p.name}</span>{" "}
                  <span className="text-xs text-foreground-subtle">— {p.prompts!.title}</span>
                </div>
                <Link
                  href={`/prompts/${p.prompts!.slug}?preset=${p.id}`}
                  className="text-xs text-foreground-subtle hover:text-foreground underline underline-offset-2 shrink-0"
                >
                  Load
                </Link>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-3 flex items-center gap-1.5">
          <HistoryIcon className="h-3 w-3" />
          Run history
        </h2>
        <LibraryHistoryTable
          rows={runList.map((r) => ({
            id: r.id,
            promptTitle: r.prompts!.title,
            promptSlug: r.prompts!.slug,
            createdAt: r.created_at,
          }))}
        />
      </section>

      <Separator />

      {/* Z4 — Following */}
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-3 flex items-center gap-1.5">
          <UserPlus className="h-3 w-3" />
          Following
        </h2>
        {followedProfiles.length === 0 ? (
          <p className="text-sm text-foreground-muted">Not following any creators yet.</p>
        ) : (
          <div className="space-y-3">
            {followedProfiles.map((p) => {
              const initials = p.display_name ? p.display_name.slice(0, 2).toUpperCase() : p.username.slice(0, 2).toUpperCase();
              const latestPack = latestPackByCreator.get(p.id);
              const latestPrompt = latestPromptByCreator.get(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 py-1.5">
                  <Link href={`/u/${p.username}`} className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={p.avatar_url ?? undefined} alt={p.display_name ?? p.username} />
                      <AvatarFallback className="text-xs bg-brand-100 text-brand-700">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{p.display_name ?? p.username}</span>
                  </Link>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    {latestPack && (
                      <Link href={`/packs/${latestPack.creatorUsername}/${latestPack.slug}`} className="flex items-center gap-1 text-foreground-subtle hover:text-foreground transition-colors">
                        <Layers className="h-3 w-3" />
                        {latestPack.title}
                      </Link>
                    )}
                    {latestPrompt && (
                      <Link href={`/prompts/${latestPrompt.slug}`} className="text-foreground-subtle hover:text-foreground transition-colors">
                        {latestPrompt.title}
                      </Link>
                    )}
                    {!latestPack && !latestPrompt && <span className="text-foreground-subtle">No releases yet</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function LibraryHeader() {
  return (
    <div className="rounded-lg px-6 py-7 mb-2 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)]">
      <h1 className="text-3xl font-medium tracking-tight font-serif">Your library</h1>
      <p className="text-muted-foreground mt-1">Your AI toolbox — everything you&apos;ve run, saved, and followed.</p>
    </div>
  );
}
