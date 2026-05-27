"use client";

import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InstallCommandBlockProps {
  skillId: string;
  command: string;
  className?: string;
}

/**
 * Code block + copy button for a skill's install command.
 * Fires a best-effort POST to /api/skills/copy to bump the skill's
 * `copies` counter so it can be surfaced (and sorted on) later.
 */
export function InstallCommandBlock({ skillId, command, className }: InstallCommandBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success("Install command copied to clipboard.");

      // Vanity counter — fire-and-forget; UI doesn't depend on the result.
      void fetch("/api/skills/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      }).catch(() => {});
    } catch {
      toast.error("Couldn't copy. Try selecting the text manually.");
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-zinc-50 dark:bg-zinc-900/60 overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background-subtle/40">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
          <Terminal className="h-3.5 w-3.5" />
          <span>Install command</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy install command"
          className={cn(
            "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors",
            copied
              ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "border-border bg-background hover:bg-background-subtle text-foreground-muted"
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {command}
      </pre>
    </div>
  );
}
