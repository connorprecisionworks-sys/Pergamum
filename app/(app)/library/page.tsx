import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
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

/** Zone header — hairline rule with a quiet label, and optional right-side meta. */
function ZoneHeader({ label, meta }: { label: string; meta?: string }) {
  return (
    <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
      <span className="text-[13px] text-foreground-muted">{label}</span>
      {meta && <span className="text-[13px] text-foreground-subtle">{meta}</span>}
    </div>
  );
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
      <div className="mx-auto max-w-[1120px] px-6 py-16 md:px-10">
        <Masthead />
        <div className="mt-12">
          <EmptyState
            icon={<Compass className="h-6 w-6 text-foreground-subtle" />}
            title="Your library is empty"
            description="Run a prompt, save a pack, or follow a creator — it'll all show up here."
            action={{ label: "Browse prompts", href: "/prompts" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-24 pt-14 md:px-10">
      <Masthead />

      {claimedPrompt && (
        <p className="-mt-8 mb-14 text-sm text-foreground-muted">
          You claimed{" "}
          <span className="font-medium text-foreground">{claimedPrompt.title}</span> —
          it&apos;s saved below.{" "}
          <Link href="/prompts" className="underline underline-offset-2 hover:text-foreground">
            Browse more
          </Link>{" "}
          to add to your library.
        </p>
      )}

      {/* Z1 — Resume strip */}
      <section className="mb-16">
        <ZoneHeader label="Recent runs" />
        {runList.length === 0 ? (
          <p className="text-sm text-foreground-muted">Nothing to resume yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {runList.slice(0, 3).map((run) => (
              <div key={run.id} className="bg-background px-5 py-5">
                <div className="text-[18px] font-medium leading-tight text-foreground">
                  {run.prompts!.title}
                </div>
                <div className="mt-3.5 flex items-center justify-between">
                  <span className="text-xs text-foreground-subtle">
                    {relativeTime(run.created_at)}
                  </span>
                  <Link
                    href={`/prompts/${run.prompts!.slug}?run=${run.id}`}
                    className="text-[13px] font-medium text-foreground transition-colors hover:text-foreground-muted"
                  >
                    Run again &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Z2 — Your packs */}
      <section className="mb-16">
        <ZoneHeader
          label="Your packs"
          meta={savedPacks.length > 0 ? `${savedPacks.length} pack${savedPacks.length === 1 ? "" : "s"}` : undefined}
        />
        {savedPacks.length === 0 ? (
          <p className="text-sm text-foreground-muted">No saved packs yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {savedPacks.map((r) => {
              const pack = r.packs!;
              const updated = hasUpdateSince(pack.id, r.created_at);
              return (
                <Link
                  key={r.id}
                  href={`/packs/${pack.profiles?.username}/${pack.slug}`}
                  className="group block"
                >
                  <div className="overflow-hidden rounded-2xl">
                    <PackCover title={pack.title} seed={pack.cover_seed ?? pack.id} accent={pack.accent} />
                  </div>
                  <p className="mt-3 truncate text-sm font-medium leading-tight text-foreground">
                    {pack.title}
                  </p>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    v{pack.version}
                    {updated && " · new"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Z3 / Z4 — presets & history, alongside following + singles */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.7fr_1fr] lg:gap-16">
        <section>
          <ZoneHeader label="Presets & history" />

          {presetList.length > 0 && (
            <div className="mb-7 flex flex-wrap gap-2">
              {presetList.map((p) => (
                <Link
                  key={p.id}
                  href={`/prompts/${p.prompts!.slug}?preset=${p.id}`}
                  title={p.prompts!.title}
                  className="inline-flex h-8 items-center rounded-full border border-border-strong px-3.5 text-[13px] text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
                >
                  {p.name}
                </Link>
              ))}
            </div>
          )}

          <LibraryHistoryTable
            rows={runList.map((r) => ({
              id: r.id,
              promptTitle: r.prompts!.title,
              promptSlug: r.prompts!.slug,
              createdAt: r.created_at,
            }))}
          />
        </section>

        <div>
          <section className="mb-14">
            <ZoneHeader label="From creators you follow" />
            {followedProfiles.length === 0 ? (
              <p className="text-sm text-foreground-muted">Not following any creators yet.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {followedProfiles.map((p) => {
                  const initials = p.display_name
                    ? p.display_name.slice(0, 2).toUpperCase()
                    : p.username.slice(0, 2).toUpperCase();
                  const latestPack = latestPackByCreator.get(p.id);
                  const latestPrompt = latestPromptByCreator.get(p.id);
                  const release = latestPack
                    ? { href: `/packs/${latestPack.creatorUsername}/${latestPack.slug}`, text: `Released ${latestPack.title}` }
                    : latestPrompt
                      ? { href: `/prompts/${latestPrompt.slug}`, text: `New single: ${latestPrompt.title}` }
                      : null;
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <Link href={`/u/${p.username}`} className="shrink-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={p.avatar_url ?? undefined} alt={p.display_name ?? p.username} />
                          <AvatarFallback className="bg-secondary text-[11px] text-foreground-muted">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/u/${p.username}`}
                          className="block truncate text-sm font-medium text-foreground"
                        >
                          {p.display_name ?? p.username}
                        </Link>
                        {release ? (
                          <Link
                            href={release.href}
                            className="mt-0.5 block truncate text-[12.5px] text-foreground-subtle transition-colors hover:text-foreground-muted"
                          >
                            {release.text}
                          </Link>
                        ) : (
                          <span className="mt-0.5 block text-[12.5px] text-foreground-subtle">
                            No releases yet
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <ZoneHeader label="Saved singles" />
            {promptSaveList.length === 0 ? (
              <p className="text-sm text-foreground-muted">No saved prompts yet.</p>
            ) : (
              <div className="flex flex-col gap-[18px]">
                {promptSaveList.map((r) => {
                  const prompt = r.prompts!;
                  return (
                    <Link key={r.id} href={`/prompts/${prompt.slug}`} className="group block">
                      <div className="text-sm font-medium text-foreground">{prompt.title}</div>
                      <div className="mt-0.5 text-xs text-foreground-subtle">
                        @{prompt.profiles?.username}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Masthead() {
  return (
    <div className="mb-14">
      <div className="mb-4 text-[13px] text-foreground-muted">Your toolbox</div>
      <h1 className="m-0 max-w-[16ch] text-[clamp(2.2rem,4.4vw,52px)] font-normal leading-[0.98] -tracking-[0.025em] text-foreground">
        Everything you keep, in reach.
      </h1>
    </div>
  );
}
