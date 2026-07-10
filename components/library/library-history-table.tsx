"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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

// Plain, mono-styled table — functional scaffold only, kept easy to
// restyle. Search is a simple client-side title filter.
export function LibraryHistoryTable({ rows }: LibraryHistoryTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.promptTitle.toLowerCase().includes(q));
  }, [rows, query]);

  if (rows.length === 0) {
    return <p className="text-sm text-foreground-muted py-3">No runs yet — use a prompt and it&apos;ll show up here.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search history…"
          className="pl-8 h-8 text-[13px]"
        />
      </div>
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background-subtle/40">
              <th className="text-left font-mono text-[10px] uppercase tracking-[0.1em] text-foreground-subtle px-3 py-2">
                Prompt
              </th>
              <th className="text-right font-mono text-[10px] uppercase tracking-[0.1em] text-foreground-subtle px-3 py-2">
                Run
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-background-subtle/30">
                <td className="px-3 py-2">
                  <Link href={`/prompts/${r.promptSlug}`} className="hover:text-brand-500 transition-colors">
                    {r.promptTitle}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="font-mono text-xs text-foreground-subtle">{relativeTime(r.createdAt)}</span>{" "}
                  <Link
                    href={`/prompts/${r.promptSlug}?run=${r.id}`}
                    className="text-xs text-foreground-subtle hover:text-foreground underline underline-offset-2 ml-2"
                  >
                    Run again
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-sm text-foreground-muted">
                  No runs match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
