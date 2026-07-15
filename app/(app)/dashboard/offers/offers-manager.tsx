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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { saveOfferSlot } from "@/app/creator/onboarding/actions";
import { savePromptOfferSlot, deleteOfferSlot, toggleOfferSlotActive } from "./actions";
import type { OfferSlot } from "@/lib/types/database";
import { cn, normalizeUrl } from "@/lib/utils";

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

interface SlotFormValue {
  title: string | null;
  label: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
}

function SlotForm({
  initial,
  onSave,
  saveLabel = "Save",
}: {
  initial: SlotFormValue;
  onSave: (input: SlotFormValue) => Promise<{ error?: string }>;
  saveLabel?: string;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [label, setLabel] = useState(initial.label);
  const [url, setUrl] = useState(initial.url);
  const [urlTouched, setUrlTouched] = useState(false);
  const [description, setDescription] = useState(initial.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [imageUrlTouched, setImageUrlTouched] = useState(false);
  const [pending, startTransition] = useTransition();

  const urlValid = !url.trim() || !!normalizeUrl(url);
  const urlError = urlTouched && !urlValid ? "That link doesn't look like a valid URL." : null;
  const imageUrlValid = !imageUrl.trim() || !!normalizeUrl(imageUrl);
  const imageUrlError = imageUrlTouched && !imageUrlValid ? "That image link doesn't look like a valid URL." : null;

  const save = () => {
    startTransition(async () => {
      const result = await onSave({
        title: title || null,
        label,
        url,
        description: description || null,
        imageUrl: imageUrl || null,
      });
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
        <Label className="text-xs">Headline (optional)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Want help with this?" />
      </div>
      <div>
        <Label className="text-xs">Description (optional)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div>
        <Label className="text-xs">Image URL (optional)</Label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          onBlur={() => setImageUrlTouched(true)}
          placeholder="https://…"
          aria-invalid={!!imageUrlError}
        />
        {imageUrlError && <p className="mt-1 text-xs text-destructive">{imageUrlError}</p>}
      </div>
      <div>
        <Label className="text-xs">Button text</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Book a free strategy call" />
      </div>
      <div>
        <Label className="text-xs">Link</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setUrlTouched(true)}
          placeholder="https://cal.com/you"
          aria-invalid={!!urlError}
        />
        {urlError && <p className="mt-1 text-xs text-destructive">{urlError}</p>}
      </div>
      <Button
        onClick={save}
        disabled={pending || !label.trim() || !url.trim() || !urlValid || !imageUrlValid}
        size="sm"
        className="gap-1.5"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {saveLabel}
      </Button>
    </div>
  );
}

export function OffersManager({ defaultSlot, promptSlots, publishedPrompts }: OffersManagerProps) {
  const [addingForPromptId, setAddingForPromptId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
    startTransition(async () => {
      const result = await deleteOfferSlot(slotId);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Removed.");
        setConfirmDeleteId(null);
      }
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
              title: defaultSlot?.title ?? null,
              label: defaultSlot?.label ?? "Book a free strategy call",
              url: defaultSlot?.url ?? "",
              description: defaultSlot?.description ?? null,
              imageUrl: defaultSlot?.image_url ?? null,
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
                        onClick={() => setConfirmDeleteId(slot.id)}
                        disabled={isPending}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <SlotForm
                    initial={{
                      title: slot.title,
                      label: slot.label,
                      url: slot.url,
                      description: slot.description,
                      imageUrl: slot.image_url,
                    }}
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
                  initial={{ title: null, label: "", url: "", description: null, imageUrl: null }}
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

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Remove this offer button?"
        confirmLabel="Remove"
        loading={isPending}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
      />
    </div>
  );
}
