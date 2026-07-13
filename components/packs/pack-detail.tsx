import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FollowButton } from "@/components/profile/follow-button";
import { PackCover } from "@/components/packs/pack-cover";
import { PackTrackRow } from "@/components/packs/pack-track-row";
import { GetPackButton } from "@/components/packs/get-pack-button";
import { relativeTime } from "@/lib/utils";
import type { PackGating, PackItemWithContent, PackVersion, PackWithCreator } from "@/lib/types/database";

interface PackDetailProps {
  pack: PackWithCreator;
  items: PackItemWithContent[];
  versions: PackVersion[];
  currentUserId: string | null;
  initiallyFollowing: boolean;
  initiallySaved: boolean;
  followerCount: number;
  funnelMode: boolean;
  /** Builder's live preview: static "Get this pack" pill, no writes. */
  previewMode?: boolean;
}

function releaseDate(d: string | null): string {
  if (!d) return "Unreleased";
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, ".");
}

export function PackDetail({
  pack,
  items,
  versions,
  currentUserId,
  initiallyFollowing,
  initiallySaved,
  followerCount,
  funnelMode,
  previewMode,
}: PackDetailProps) {
  const creator = pack.profiles;
  const isOwner = currentUserId === pack.creator_id;
  const promptCount = items.filter((i) => i.item_type === "prompt").length;
  const skillCount = items.filter((i) => i.item_type === "skill").length;
  const returnTo = `/packs/${creator.username}/${pack.slug}`;

  const initials = creator.display_name
    ? creator.display_name.slice(0, 2).toUpperCase()
    : creator.username.slice(0, 2).toUpperCase();

  return (
    <article className="max-w-3xl mx-auto space-y-10">
      {/* Z1 — Release hero */}
      <div className="space-y-6">
        <PackCover title={pack.title} seed={pack.cover_seed ?? pack.id} accent={pack.accent} className="max-w-xs" />

        <div className="space-y-3">
          <h1 className="text-3xl font-medium tracking-tight font-serif">{pack.title}</h1>

          <div className="flex items-center gap-2 flex-wrap">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={creator.avatar_url ?? undefined} alt={creator.display_name ?? creator.username} />
              <AvatarFallback className="text-xs bg-brand-100 text-brand-700">{initials}</AvatarFallback>
            </Avatar>
            <Link href={`/u/${creator.username}`} className="text-sm font-medium hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
              {creator.display_name ?? creator.username}
            </Link>
            <FollowButton targetUserId={pack.creator_id} currentUserId={currentUserId} initiallyFollowing={initiallyFollowing} />
          </div>

          <p className="label-mono">
            RELEASED {releaseDate(pack.released_at)} · {promptCount} PROMPT{promptCount !== 1 ? "S" : ""}
            {skillCount > 0 ? ` · ${skillCount} SKILL${skillCount !== 1 ? "S" : ""}` : ""} · v{pack.version}
          </p>

          {pack.liner_note && (
            <p className="text-foreground/90 text-[15px] leading-relaxed max-w-xl">{pack.liner_note}</p>
          )}

          <div className="pt-1">
            {previewMode ? (
              <span className="inline-flex items-center h-10 px-4 rounded-md bg-primary/40 text-primary-foreground text-sm font-medium select-none">
                {pack.gating === "paid" ? `Get for $${(pack.price_cents / 100).toFixed(0)}` : "Get this pack"}
              </span>
            ) : (
              <GetPackButton
                packId={pack.id}
                packTitle={pack.title}
                gating={pack.gating as PackGating}
                priceCents={pack.price_cents}
                currentUserId={currentUserId}
                initiallySaved={initiallySaved}
                returnTo={returnTo}
              />
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Z2 — Tracklist */}
      <div>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-2">Tracklist</h2>
        <div>
          {items.map((item, index) => {
            // In the builder's live preview, currentUserId is always the
            // creator (isOwner), which would otherwise hide the lock state
            // they're trying to configure — simulate a visitor's view there.
            const locked = pack.gating === "paid" && !item.is_preview && (previewMode || !isOwner);
            return (
              <PackTrackRow
                key={item.id}
                item={item}
                index={index}
                currentUserId={currentUserId}
                ownerUsername={creator.username}
                packSlug={pack.slug}
                locked={locked}
                defaultOpen={funnelMode && index === 0}
              />
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Z3 — About the creator */}
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarImage src={creator.avatar_url ?? undefined} alt={creator.display_name ?? creator.username} />
          <AvatarFallback className="text-lg bg-brand-100 text-brand-700">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href={`/u/${creator.username}`} className="font-medium hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
              {creator.display_name ?? creator.username}
            </Link>
            <span className="label-mono">{followerCount} follower{followerCount !== 1 ? "s" : ""}</span>
          </div>
          {creator.bio && <p className="text-sm text-foreground-muted leading-relaxed max-w-lg">{creator.bio}</p>}
        </div>
      </div>

      {/* Z4 — Release history */}
      {versions.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-3">
              Release history
            </h2>
            <div className="space-y-2.5 pl-4 border-l border-border/60">
              {versions.map((v) => (
                <div key={v.id} className="text-xs">
                  <span className="font-mono text-foreground-subtle">v{v.version}</span>{" "}
                  <span className="text-muted-foreground">{relativeTime(v.created_at)}</span>
                  {v.changelog && <p className="mt-0.5 text-foreground/80">{v.changelog}</p>}
                </div>
              ))}
              <div className="text-xs">
                <span className="font-mono text-foreground-subtle">v1</span>{" "}
                <span className="text-muted-foreground">{relativeTime(pack.released_at ?? pack.created_at)}</span>
                <p className="mt-0.5 text-foreground/80">Initial release.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
