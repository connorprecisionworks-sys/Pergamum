"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/database";
import { X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "trending", label: "Trending"     },
  { value: "newest",   label: "Newest"       },
  { value: "top",      label: "Top all-time" },
] as const;

const MODEL_OPTIONS = ["claude", "gpt-4", "gemini", "llama", "mistral", "any"];

interface FilterSidebarProps {
  categories: Category[];
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort     = searchParams.get("sort")     ?? "trending";
  const currentCategory = searchParams.get("category") ?? "";
  const currentModel    = searchParams.get("model")    ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/prompts?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => router.push("/prompts");

  const hasFilters = !!(currentCategory || currentModel || currentSort !== "trending");

  const activeStyle   = "bg-background-subtle text-foreground font-medium";
  const inactiveStyle = "text-foreground-muted hover:bg-background-subtle hover:text-foreground";

  return (
    <aside className="w-full space-y-7" aria-label="Filter prompts">
      {hasFilters && (
        <div className="flex items-center justify-between">
          <span className="label-mono">Active filters</span>
          <button
            onClick={clearAll}
            className="label-mono text-pergamum-500 hover:text-pergamum-400 flex items-center gap-1 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* Sort */}
      <div className="space-y-2">
        <div className="label-mono mb-3">[ Sort ]</div>
        <div className="flex flex-col gap-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam("sort", opt.value === "trending" ? "" : opt.value)}
              className={cn(
                "text-[13px] text-left px-3 py-1.5 rounded-md transition-colors",
                currentSort === opt.value ? activeStyle : inactiveStyle
              )}
              aria-pressed={currentSort === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <div className="label-mono mb-3">[ Category ]</div>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => updateParam("category", "")}
            className={cn(
              "text-[13px] text-left px-3 py-1.5 rounded-md transition-colors",
              !currentCategory ? activeStyle : inactiveStyle
            )}
            aria-pressed={!currentCategory}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                updateParam("category", currentCategory === cat.slug ? "" : cat.slug)
              }
              className={cn(
                "text-[13px] text-left px-3 py-1.5 rounded-md transition-colors",
                currentCategory === cat.slug ? activeStyle : inactiveStyle
              )}
              aria-pressed={currentCategory === cat.slug}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <div className="label-mono mb-3">[ Model ]</div>
        <div className="flex flex-wrap gap-1.5">
          {MODEL_OPTIONS.map((model) => {
            const active = currentModel === model;
            return (
              <button
                key={model}
                onClick={() => updateParam("model", currentModel === model ? "" : model)}
                aria-pressed={active}
                className={cn(
                  "label-mono px-2.5 py-1 rounded border transition-colors capitalize",
                  active
                    ? "border-pergamum-500/60 text-pergamum-400 bg-pergamum-900/20"
                    : "border-border text-foreground-subtle hover:border-border-strong hover:text-foreground-muted"
                )}
              >
                {model}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
