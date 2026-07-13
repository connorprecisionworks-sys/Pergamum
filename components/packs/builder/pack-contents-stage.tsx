"use client";

import { useState } from "react";
import { GripVertical, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { NewPromptSheet } from "@/components/packs/builder/new-prompt-sheet";
import { addPackItem, removePackItem, reorderPackItems, updatePackItem } from "@/app/(app)/dashboard/packs/actions";
import { cn } from "@/lib/utils";
import type { PackItemWithContent, PromptWithAuthor, SkillWithAuthor } from "@/lib/types/database";

interface PackContentsStageProps {
  packId: string;
  items: PackItemWithContent[];
  onItemsChange: (items: PackItemWithContent[]) => void;
  libraryPrompts: PromptWithAuthor[];
  librarySkills: SkillWithAuthor[];
  currentUserId: string;
  buildAccessOk: boolean;
}

export function PackContentsStage({
  packId,
  items,
  onItemsChange,
  libraryPrompts: initialPrompts,
  librarySkills: initialSkills,
  currentUserId,
  buildAccessOk,
}: PackContentsStageProps) {
  const [libraryPrompts, setLibraryPrompts] = useState(initialPrompts);
  const [librarySkills] = useState(initialSkills);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const inPackPromptIds = new Set(items.filter((i) => i.item_type === "prompt").map((i) => i.prompt_id));
  const inPackSkillIds = new Set(items.filter((i) => i.item_type === "skill").map((i) => i.skill_id));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleAdd = async (itemType: "prompt" | "skill", content: PromptWithAuthor | SkillWithAuthor) => {
    setAddingId(content.id);
    const r = await addPackItem(packId, itemType, content.id);
    setAddingId(null);
    if (r.error || !r.id) {
      toast.error(r.error ?? "Couldn't add that.");
      return;
    }
    const newItem: PackItemWithContent = {
      id: r.id,
      pack_id: packId,
      item_type: itemType,
      prompt_id: itemType === "prompt" ? content.id : null,
      skill_id: itemType === "skill" ? content.id : null,
      position: r.position ?? items.length,
      promise_line: null,
      is_preview: false,
      created_at: new Date().toISOString(),
      prompts: itemType === "prompt" ? (content as PromptWithAuthor) : null,
      skills: itemType === "skill" ? (content as SkillWithAuthor) : null,
    };
    onItemsChange([...items, newItem]);
  };

  // Builder/paste-import publish straight into the library now — no more
  // manual "Refresh library" step. Append locally and offer the one-click
  // follow-up instead of forcing a second trip back to this list.
  const handlePromptPublished = (prompt: PromptWithAuthor) => {
    setLibraryPrompts((prev) => [prompt, ...prev]);
    toast.success("Saved to your library.", {
      action: {
        label: "Add to pack",
        onClick: () => handleAdd("prompt", prompt),
      },
    });
  };

  const handleRemove = async (itemId: string) => {
    const r = await removePackItem(packId, itemId);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    onItemsChange(items.filter((i) => i.id !== itemId));
  };

  const handlePromiseLineChange = (itemId: string, value: string) => {
    onItemsChange(items.map((i) => (i.id === itemId ? { ...i, promise_line: value } : i)));
  };

  const handlePromiseLineBlur = async (itemId: string, value: string) => {
    await updatePackItem(packId, itemId, { promise_line: value });
  };

  const handleAiDraftPromise = async (item: PackItemWithContent) => {
    const title = item.item_type === "prompt" ? item.prompts?.title : item.skills?.name;
    const description = item.item_type === "prompt" ? item.prompts?.description ?? undefined : item.skills?.summary;
    if (!title) return;
    try {
      const res = await fetch("/api/packs/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "promise_line", title, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      handlePromiseLineChange(item.id, data.text);
      await updatePackItem(packId, item.id, { promise_line: data.text });
    } catch {
      toast.error("Couldn't draft a promise line right now.");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onItemsChange(reordered);
    const r = await reorderPackItems(packId, reordered.map((i) => i.id));
    if (r.error) toast.error("Couldn't save the new order.");
  };

  const addablePrompts = libraryPrompts.filter((p) => !inPackPromptIds.has(p.id));
  const addableSkills = librarySkills.filter((s) => !inPackSkillIds.has(s.id));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle">
            Add from your library
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)} className="h-7 gap-1.5 text-xs">
              <Plus className="h-3 w-3" />
              New prompt
            </Button>
          </div>
        </div>

        {addablePrompts.length === 0 && addableSkills.length === 0 ? (
          <p className="text-sm text-foreground-muted py-3">
            Nothing left to add — publish a prompt or hit &ldquo;New prompt&rdquo;.
          </p>
        ) : (
          <div className="border border-border rounded-md divide-y divide-border max-h-64 overflow-y-auto">
            {addablePrompts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAdd("prompt", p)}
                disabled={addingId === p.id}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-background-subtle/60 transition-colors"
              >
                <span className="text-sm truncate">{p.title}</span>
                {addingId === p.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                )}
              </button>
            ))}
            {addableSkills.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleAdd("skill", s)}
                disabled={addingId === s.id}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-background-subtle/60 transition-colors"
              >
                <span className="text-sm truncate">{s.name} <span className="label-mono ml-1">skill</span></span>
                {addingId === s.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-2">
          Tracklist ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-foreground-muted py-3">Add prompts or skills above to build the tracklist.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <SortableTrackItem
                    key={item.id}
                    item={item}
                    index={index}
                    onRemove={() => handleRemove(item.id)}
                    onPromiseLineChange={(v) => handlePromiseLineChange(item.id, v)}
                    onPromiseLineBlur={(v) => handlePromiseLineBlur(item.id, v)}
                    onAiDraft={() => handleAiDraftPromise(item)}
                    buildAccessOk={buildAccessOk}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <NewPromptSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        userId={currentUserId}
        buildAccessOk={buildAccessOk}
        onPromptPublished={handlePromptPublished}
      />
    </div>
  );
}

function SortableTrackItem({
  item,
  index,
  onRemove,
  onPromiseLineChange,
  onPromiseLineBlur,
  onAiDraft,
  buildAccessOk,
}: {
  item: PackItemWithContent;
  index: number;
  onRemove: () => void;
  onPromiseLineChange: (v: string) => void;
  onPromiseLineBlur: (v: string) => void;
  onAiDraft: () => void;
  buildAccessOk: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const title = item.item_type === "prompt" ? item.prompts?.title : item.skills?.name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 p-3 rounded-md border border-border bg-background",
        isDragging && "opacity-60 shadow-lg"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-1.5 p-1 text-foreground-subtle hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="font-mono text-[13px] text-foreground-subtle w-6 shrink-0 pt-1.5 tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-medium truncate">{title}</p>
        <div className="flex items-center gap-1.5">
          <Input
            value={item.promise_line ?? ""}
            onChange={(e) => onPromiseLineChange(e.target.value)}
            onBlur={(e) => onPromiseLineBlur(e.target.value)}
            placeholder="Promise line — what they get from this"
            className="h-7 text-xs"
          />
          {buildAccessOk ? (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onAiDraft} aria-label="Draft with AI">
              <Sparkles className="h-3.5 w-3.5 text-foreground-subtle" />
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled aria-label="Draft with AI — private beta">
                      <Sparkles className="h-3.5 w-3.5 text-foreground-subtle" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>AI drafting is in private beta — enter your access code at /build.</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-foreground-subtle hover:text-destructive" onClick={onRemove} aria-label="Remove from pack">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
