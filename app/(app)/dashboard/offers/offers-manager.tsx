"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { saveOfferSlot } from "@/app/creator/onboarding/actions";
import { savePromptOfferSlot, deleteOfferSlot, toggleOfferSlotActive } from "./actions";
import type { OfferSlot } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface OffersManagerProps {
  defaultSlot: OfferSlot | null;
  promptSlots: OfferSlot[];
  publishedPrompts: { id: string; title: string }[];
}

function ActiveToggle({
  active,
  onToggle,
  disabled,
}: {
  active: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        active ? "bg-primary" : "bg-border-strong"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          active ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function SlotForm({
  initial,
  onSave,
  saveLabel = "Save",
}: {
  initial: { label: string; url: string; description: string | null };
  onSave: (input: { label: string; url: string; description: string | null }) => Promise<{ error?: string }>;
  saveLabel?: string;
}) {
  const [label, setLabel] = useState(initial.label);
  const [url, setUrl] = useState(initial.url);
  const [description, setDescription] = useState(initial.description ?? "");
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await onSave({ label, url, description: description || null });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved.");
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Button text</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Book a free strategy call" />
      </div>
      <div>
        <Label className="text-xs">Link</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://cal.com/you" />
      </div>
      <div>
        <Label className="text-xs">Description (optional)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <Button onClick={save} disabled={pending || !label.trim() || !url.trim()} size="sm" className="gap-1.5">
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {saveLabel}
      </Button>
    </div>
  );
}

export function OffersManager({ defaultSlot, promptSlots, publishedPrompts }: OffersManagerProps) {
  const [addingForPromptId, setAddingForPromptId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const overriddenPromptIds = new Set(promptSlots.map((s) => s.prompt_id));
  const eligiblePrompts = publishedPrompts.filter((p) => !overriddenPromptIds.has(p.id));

  const handleToggle = (slotId: string, next: boolean) => {
    startTransition(async () => {
      const result = await toggleOfferSlotActive(slotId, next);
      if (result?.error) toast.error(result.error);
    });
  };

  const handleDelete = (slotId: string) => {
    if (!window.confirm("Remove this offer button?")) return;
    startTransition(async () => {
      const result = await deleteOfferSlot(slotId);
      if (result?.error) toast.error(result.error);
      else toast.success("Removed.");
    });
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-1 text-lg font-medium">Default slot</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Applies to every prompt that doesn&rsquo;t have its own override below.
        </p>
        <div className="rounded-lg border p-4">
          {defaultSlot && (
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <ActiveToggle
                active={defaultSlot.active}
                disabled={isPending}
                onToggle={() => handleToggle(defaultSlot.id, !defaultSlot.active)}
              />
            </div>
          )}
          <SlotForm
            initial={{
              label: defaultSlot?.label ?? "Book a free strategy call",
              url: defaultSlot?.url ?? "",
              description: defaultSlot?.description ?? null,
            }}
            onSave={saveOfferSlot}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-medium">Per-prompt overrides</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          A different offer for a specific prompt — beats the default on that page only.
        </p>

        {promptSlots.length > 0 && (
          <div className="mb-4 space-y-3">
            {promptSlots.map((slot) => {
              const prompt = publishedPrompts.find((p) => p.id === slot.prompt_id);
              return (
                <div key={slot.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">
                      {prompt?.title ?? "Unknown prompt"}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <ActiveToggle
                        active={slot.active}
                        disabled={isPending}
                        onToggle={() => handleToggle(slot.id, !slot.active)}
                      />
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => handleDelete(slot.id)}
                        disabled={isPending}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <SlotForm
                    initial={{ label: slot.label, url: slot.url, description: slot.description }}
                    onSave={(input) => savePromptOfferSlot(slot.prompt_id as string, input)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {eligiblePrompts.length > 0 && (
          <div className="rounded-lg border border-dashed p-4">
            {addingForPromptId ? (
              <div className="space-y-3">
                <Label className="text-xs">Prompt</Label>
                <div className="text-sm font-medium">
                  {eligiblePrompts.find((p) => p.id === addingForPromptId)?.title}
                </div>
                <SlotForm
                  initial={{ label: "", url: "", description: null }}
                  saveLabel="Add override"
                  onSave={async (input) => {
                    const result = await savePromptOfferSlot(addingForPromptId, input);
                    if (!result?.error) setAddingForPromptId(null);
                    return result;
                  }}
                />
              </div>
            ) : (
              <Select onValueChange={setAddingForPromptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Add an override for a prompt…" />
                </SelectTrigger>
                <SelectContent>
                  {eligiblePrompts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
