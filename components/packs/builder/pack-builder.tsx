"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PackStageNav, type BuilderStage } from "@/components/packs/builder/pack-stage-nav";
import { PackContentsStage } from "@/components/packs/builder/pack-contents-stage";
import { PackCoverStage } from "@/components/packs/builder/pack-cover-stage";
import { PackReleaseStage } from "@/components/packs/builder/pack-release-stage";
import { PackDetail } from "@/components/packs/pack-detail";
import { updatePackFields, updatePackItem } from "@/app/(app)/dashboard/packs/actions";
import type {
  Pack,
  PackGating,
  PackItemWithContent,
  PackVersion,
  PackWithCreator,
  Profile,
  PromptWithAuthor,
  SkillWithAuthor,
} from "@/lib/types/database";

interface PackBuilderProps {
  initialPack: Pack;
  initialItems: PackItemWithContent[];
  initialVersions: PackVersion[];
  creatorProfile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "bio">;
  libraryPrompts: PromptWithAuthor[];
  librarySkills: SkillWithAuthor[];
  buildAccessOk: boolean;
}

export function PackBuilder({
  initialPack,
  initialItems,
  initialVersions,
  creatorProfile,
  libraryPrompts,
  librarySkills,
  buildAccessOk,
}: PackBuilderProps) {
  const [pack, setPack] = useState<Pack>(initialPack);
  const [items, setItems] = useState<PackItemWithContent[]>(initialItems);
  const [versions, setVersions] = useState<PackVersion[]>(initialVersions);
  const [stage, setStage] = useState<BuilderStage>("contents");
  const [titleDraft, setTitleDraft] = useState(initialPack.title);

  const saveTitle = async () => {
    const title = titleDraft.trim();
    if (!title || title === pack.title) return;
    const r = await updatePackFields(pack.id, { title });
    if (!r.error) setPack((p) => ({ ...p, title }));
  };

  const previewPack: PackWithCreator = { ...pack, profiles: creatorProfile as Profile };

  return (
    <div className="container py-8">
      <Link
        href="/dashboard/packs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Your packs
      </Link>

      {/* A bare heading-shaped input read as static text, so nobody found the
          rename. Labelled and boxed, it reads as the field it always was. */}
      <div className="mb-6 space-y-1.5">
        <label htmlFor="pack-title" className="label-mono block">
          Pack title
        </label>
        <input
          id="pack-title"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={saveTitle}
          placeholder="Untitled pack"
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-3xl font-medium tracking-tight font-serif transition-colors hover:border-border-strong focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
          <PackStageNav active={stage} onChange={setStage} />

          {stage === "contents" && (
            <PackContentsStage
              packId={pack.id}
              items={items}
              onItemsChange={setItems}
              libraryPrompts={libraryPrompts}
              librarySkills={librarySkills}
              currentUserId={creatorProfile.id}
              buildAccessOk={buildAccessOk}
            />
          )}

          {stage === "cover" && (
            <PackCoverStage
              packId={pack.id}
              title={pack.title}
              linerNote={pack.liner_note ?? ""}
              coverSeed={pack.cover_seed ?? pack.id}
              accent={pack.accent ?? "#3C5F86"}
              itemTitles={items.map((i) => (i.item_type === "prompt" ? i.prompts?.title : i.skills?.name) ?? "").filter(Boolean)}
              creatorDisplayName={creatorProfile.display_name ?? creatorProfile.username}
              buildAccessOk={buildAccessOk}
              onChange={(patch) => setPack((p) => ({ ...p, ...patch }))}
            />
          )}

          {stage === "release" && (
            <PackReleaseStage
              pack={pack}
              items={items}
              versions={versions}
              creatorUsername={creatorProfile.username}
              onGatingChange={(patch) => {
                setPack((p) => ({ ...p, ...patch }));
                void updatePackFields(pack.id, patch as { gating?: PackGating; price_cents?: number });
              }}
              onItemPreviewToggle={(itemId, isPreview) => {
                setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, is_preview: isPreview } : i)));
                void updatePackItem(pack.id, itemId, { is_preview: isPreview });
              }}
              onReleased={(patch, newVersion) => {
                setPack((p) => ({ ...p, ...patch }));
                if (newVersion) setVersions((v) => [newVersion, ...v]);
              }}
              onJumpToStage={setStage}
            />
          )}
        </div>

        <div className="lg:col-span-2 order-1 lg:order-2 lg:sticky lg:top-8">
          <div className="border border-border rounded-lg p-6 bg-background-subtle/30">
            <p className="label-mono mb-4">Live preview</p>
            <PackDetail
              pack={previewPack}
              items={items}
              versions={versions}
              currentUserId={creatorProfile.id}
              initiallyFollowing={false}
              initiallySaved={false}
              followerCount={0}
              funnelMode={false}
              previewMode
            />
          </div>
        </div>
      </div>
    </div>
  );
}
