"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importPromptsForCreator } from "@/app/(app)/submit/actions";
import { detectVariableNames } from "@/lib/utils";
import type { PromptWithAuthor } from "@/lib/types/database";

interface PasteImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromptsImported: (prompts: PromptWithAuthor[]) => void;
}

interface PreviewRow {
  index: number;
  title: string;
  body: string;
  variables: string[];
  warning?: string;
  selected: boolean;
}

const PLACEHOLDER = `Senior Developer Code Review
You are a senior {{language}} engineer. Review the following code:

{{code}}

---

Customer Interview Synthesizer
Summarize this customer interview transcript into themes, quotes, and one action item.

{{transcript}}`;

function parsePastedPrompts(text: string): { title: string; body: string }[] {
  return text
    .split(/^[ \t]*---[ \t]*$/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split("\n");
      return {
        title: lines[0].trim(),
        body: lines.slice(1).join("\n").trim(),
      };
    });
}

function buildPreview(text: string): PreviewRow[] {
  return parsePastedPrompts(text).map((p, index) => {
    const tooShort = p.body.length < 10;
    return {
      index,
      title: p.title,
      body: p.body,
      variables: detectVariableNames(p.body),
      warning: tooShort ? "Body looks too short — needs a real prompt." : undefined,
      selected: !tooShort,
    };
  });
}

// Creator-facing bulk import: paste a batch of title+body prompts, separated
// by "---" lines, preview and deselect any that don't look right, then
// publish the rest straight to the library (and offer to add them to
// whichever pack this was opened from).
export function PasteImportSheet({ open, onOpenChange, onPromptsImported }: PasteImportSheetProps) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCount = (rows ?? []).filter((r) => r.selected).length;

  const handlePreview = () => {
    const parsed = buildPreview(text);
    if (parsed.length === 0) {
      toast.error("Nothing to preview — paste at least one title and body.");
      return;
    }
    setRows(parsed);
  };

  const toggleRow = (index: number) => {
    setRows((prev) => prev?.map((r) => (r.index === index ? { ...r, selected: !r.selected } : r)) ?? null);
  };

  const reset = () => {
    setText("");
    setRows(null);
  };

  const handleImport = () => {
    const toImport = (rows ?? []).filter((r) => r.selected);
    if (toImport.length === 0) return;

    startTransition(async () => {
      const result = await importPromptsForCreator(
        toImport.map((r) => ({ title: r.title, body: r.body }))
      );

      if (result.imported.length > 0) {
        onPromptsImported(result.imported);
      }

      if (result.errors.length > 0) {
        toast.error(
          `${result.imported.length} imported, ${result.errors.length} failed. Fix and re-paste the failed ones.`
        );
      } else {
        toast.success(
          `${result.imported.length} prompt${result.imported.length !== 1 ? "s" : ""} imported.`
        );
        reset();
        onOpenChange(false);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl p-0">
        <SheetHeader>
          <SheetTitle>Paste prompts</SheetTitle>
          <SheetDescription>
            One paste box, many prompts. Title line, then the body, prompts separated by a line of{" "}
            <code className="font-mono">---</code>.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setRows(null); }}
            placeholder={PLACEHOLDER}
            rows={12}
            className="font-mono text-xs resize-y"
            spellCheck={false}
          />

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={handlePreview} disabled={!text.trim() || isPending}>
              Preview
            </Button>
            {rows !== null && (
              <span className="text-sm text-muted-foreground">
                {rows.length} prompt{rows.length !== 1 ? "s" : ""} found, {selectedCount} selected
              </span>
            )}
          </div>

          {rows !== null && rows.length > 0 && (
            <div className="space-y-2 rounded-md border border-border divide-y divide-border max-h-[360px] overflow-y-auto">
              {rows.map((row) => (
                <label
                  key={row.index}
                  className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-background-subtle/60"
                >
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => toggleRow(row.index)}
                    className="mt-1 accent-primary shrink-0"
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block text-sm font-medium truncate">
                      {row.title || <span className="italic text-muted-foreground">(untitled)</span>}
                    </span>
                    {row.variables.length > 0 && (
                      <span className="flex flex-wrap gap-1">
                        {row.variables.map((v) => (
                          <span
                            key={v}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px]"
                          >
                            {v}
                          </span>
                        ))}
                      </span>
                    )}
                    {row.warning && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {row.warning}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}

          {rows !== null && rows.length > 0 && (
            <Button
              type="button"
              onClick={handleImport}
              disabled={selectedCount === 0 || isPending}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {selectedCount > 0 ? `${selectedCount} prompt${selectedCount !== 1 ? "s" : ""}` : ""}
            </Button>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
