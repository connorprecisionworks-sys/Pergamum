"use client";

import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from "@/components/ui/sheet";
import { Builder } from "@/app/(app)/build/builder";
import { BuildGate } from "@/app/(app)/build/gate";

interface NewPromptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  buildAccessOk: boolean;
}

// The pack builder's "+ New prompt" — the existing chat-first AI builder,
// inline in a slide-over so the creator never loses their place in the
// pack. Its own publish step still routes through /submit (variables,
// category, model tags) which the pack builder doesn't duplicate — that
// opens in a new tab so this one stays put; "Refresh library" in the
// Contents stage picks the finished prompt up once it's published.
export function NewPromptSheet({ open, onOpenChange, userId, buildAccessOk }: NewPromptSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-0">
        <SheetHeader>
          <SheetTitle>New prompt</SheetTitle>
          <SheetDescription>
            Draft it here, then finish publishing in the tab that opens — come back and hit
            &ldquo;Refresh library&rdquo; to add it to this pack.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="px-0 py-0">
          {buildAccessOk ? (
            <div className="px-6 py-6">
              <Builder
                userId={userId}
                initialDraft={null}
                recentDrafts={[]}
                onPublish={(draftId) => {
                  window.open(`/submit?from_draft=${draftId}`, "_blank", "noopener");
                  toast.success("Draft saved — finish publishing in the new tab.");
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
