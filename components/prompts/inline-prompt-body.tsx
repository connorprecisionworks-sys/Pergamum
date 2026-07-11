"use client";

import { useMemo } from "react";

import type { PromptVariable } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface InlinePromptBodyProps {
  body: string;
  variables: PromptVariable[];
  values: Record<string, string>;
  onValuesChange: (values: Record<string, string>) => void;
}

type Segment =
  | { kind: "text"; text: string }
  | { kind: "field"; name: string };

/** Split a body into literal text and {{variable}} slots, in order. */
function segment(body: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of body.matchAll(/\{\{(\w+)\}\}/g)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ kind: "text", text: body.slice(cursor, start) });
    }
    segments.push({ kind: "field", name: match[1] });
    cursor = start + match[0].length;
  }
  if (cursor < body.length) {
    segments.push({ kind: "text", text: body.slice(cursor) });
  }
  return segments;
}

function labelFor(variable: PromptVariable | undefined, name: string) {
  return variable?.description ?? name.replace(/_/g, " ");
}

/**
 * The prompt as one read-and-type object: the body is prose, and each
 * {{variable}} is an inline fill-in field you type straight into. Replaces the
 * split "form above, <pre> below" layout for the viewer. State is the same
 * `values` record the rest of the page already reads from.
 */
export function InlinePromptBody({
  body,
  variables,
  values,
  onValuesChange,
}: InlinePromptBodyProps) {
  const segments = useMemo(() => segment(body), [body]);
  const byName = useMemo(
    () => new Map(variables.map((v) => [v.name, v])),
    [variables],
  );

  const set = (name: string, value: string) =>
    onValuesChange({ ...values, [name]: value });

  // The mockup sets the workspace at 26px, which reads beautifully for the
  // one- or two-sentence prompts it was drawn around. Real bodies run to
  // hundreds of characters, where that size becomes a wall — so long prompts
  // step down a scale rather than blowing the document open.
  const dense = body.length > 320;

  return (
    <div
      className={cn(
        "font-light -tracking-[0.01em] text-foreground-muted",
        dense
          ? "text-[clamp(1rem,1.35vw,18px)] leading-[1.75]"
          : "text-[clamp(1.15rem,2vw,26px)] leading-[1.7]",
      )}
    >
      {segments.map((seg, index) => {
        if (seg.kind === "text") {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {seg.text}
            </span>
          );
        }

        const variable = byName.get(seg.name);
        const value = values[seg.name] ?? "";
        const placeholder = labelFor(variable, seg.name);
        const filled = value.trim().length > 0;
        // Grow with the content so typing never reflows the paragraph twice.
        const width = `${Math.max(placeholder.length, value.length) + 2}ch`;

        return (
          <input
            key={index}
            value={value}
            onChange={(event) => set(seg.name, event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            style={{ width }}
            className={cn(
              "mx-0.5 inline-block h-10 max-w-full rounded-xl px-3.5 align-baseline text-[0.75em] outline-none transition-colors",
              "focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary/10",
              filled
                ? "border border-border-strong bg-background text-foreground"
                : "border border-dashed border-border-strong bg-transparent text-foreground placeholder:text-foreground-subtle",
            )}
          />
        );
      })}
    </div>
  );
}
