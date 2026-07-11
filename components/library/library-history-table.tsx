"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { relativeTime } from "@/lib/utils";

interface HistoryRow {
  id: string;
  promptTitle: string;
  promptSlug: string;
  createdAt: string;
}

interface LibraryHistoryTableProps {
  rows: HistoryRow[];
}

/**
 * The mockup's history table also carries Preset and Model columns; prompt_runs
 * stores neither, so those columns are left out rather than faked.
 * Search is a simple client-side title filter.
 */
export function LibraryHistoryTable({ rows }: LibraryHistoryTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.promptTitle.toLowerCase().includes(q));
  }, [rows, query]);

  if (rows.length === 0) {
    return (
      <p className="py-3 text-sm text-foreground-muted">
        No runs yet — use a prompt and it&apos;ll show up here.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-5 flex h-9 max-w-xs items-center gap-2 rounded-full border border-border-strong px-3.5 transition-colors focus-within:border-foreground/30">
        <Search className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search history"
          aria-label="Search run history"
          className="w-full bg-transparent text-sm outline-none placeholder:text-foreground-subtle"
        />
      </div>

      <div className="grid grid-cols-[1fr_60px] gap-4 border-b border-border px-1 pb-2.5 text-[10.5px] uppercase tracking-[0.04em] text-foreground-subtle">
        <span>Prompt</span>
        <span className="text-right">When</span>
      </div>

      {filtered.map((r) => (
        <div
          key={r.id}
          className="group grid grid-cols-[1fr_60px] items-center gap-4 border-b border-border px-1 py-3.5 text-[13px] last:border-b-0"
        >
          <Link
            href={`/prompts/${r.promptSlug}?run=${r.id}`}
            className="truncate text-foreground transition-colors hover:text-foreground-muted"
          >
            {r.promptTitle}
          </Link>
          <span className="text-right text-foreground-subtle">
            {relativeTime(r.createdAt)}
          </span>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="px-1 py-6 text-center text-sm text-foreground-muted">
          No runs match &ldquo;{query}&rdquo;.
        </p>
      )}
    </div>
  );
}
