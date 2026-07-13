"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from "@/components/ui/sheet";
import { Builder } from "@/app/(app)/build/builder";
import { BuildGate } from "@/app/(app)/build/gate";
import type { PromptWithAuthor } from "@/lib/types/database";

interface NewPromptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  buildAccessOk: boolean;
  onPromptPublished: (prompt: PromptWithAuthor) => void;
}

// The pack builder's "+ New prompt" — the existing chat-first AI builder,
// inline in a slide-over so the creator never loses their place in the
// pack. Publishing goes straight through Builder's onPublish (which has
// already called createLibraryPrompt) — this just bubbles the new prompt
// up to the Contents stage and closes.
export function NewPromptSheet({ open, onOpenChange, userId, buildAccessOk, onPromptPublished }: NewPromptSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-0">
        <SheetHeader>
          <SheetTitle>New prompt</SheetTitle>
          <SheetDescription>
            Build it here — it publishes straight to your library, ready to add to this pack.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="px-0 py-0">
          {buildAccessOk ? (
            <div className="px-6 py-6">
              <Builder
                userId={userId}
                initialDraft={null}
                recentDrafts={[]}
                onPublish={(prompt) => {
                  onPromptPublished(prompt);
                  onOpenChange(false);
                }}
              />
            </div>
          ) : (
            <BuildGate />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
