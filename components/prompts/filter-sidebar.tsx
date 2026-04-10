"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/database";
import { X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "top", label: "Top all-time" },
] as const;

const MODEL_OPTIONS = [
  "claude",
  "gpt-4",
  "gemini",
  "llama",
  "mistral",
  "any",
];

interface FilterSidebarProps {
  categories: Category[];
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "trending";
  const currentCategory = searchParams.get("category") ?? "";
  const currentModel = searchParams.get("model") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filter changes
      params.delete("page");
      router.push(`/prompts?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => {
    router.push("/prompts");
  };

  const hasFilters = currentCategory || currentModel || (currentSort !== "trending");

  return (
    <aside className="w-full space-y-6" aria-label="Filter prompts">
      {/* Active filters summary + clear */}
      {hasFilters && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Active filters
          </span>
          <button
            onClick={clearAll}
            className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        </div>
      )}

      {/* Sort */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sort by
        </h3>
        <div className="flex flex-col gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam("sort", opt.value === "trending" ? "" : opt.value)}
              className={cn(
                "text-sm text-left px-3 py-1.5 rounded-md transition-colors",
                currentSort === opt.value
                  ? "bg-violet-100 text-violet-800 font-medium dark:bg-violet-900/30 dark:text-violet-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Category
        </h3>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => updateParam("category", "")}
            className={cn(
              "text-sm text-left px-3 py-1.5 rounded-md transition-colors",
              !currentCategory
                ? "bg-violet-100 text-violet-800 font-medium dark:bg-violet-900/30 dark:text-violet-300"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-pressed={!currentCategory}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                updateParam(
                  "category",
                  currentCategory === cat.slug ? "" : cat.slug
                )
              }
              className={cn(
                "text-sm text-left px-3 py-1.5 rounded-md transition-colors",
                currentCategory === cat.slug
                  ? "bg-violet-100 text-violet-800 font-medium dark:bg-violet-900/30 dark:text-violet-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Model
        </h3>
        <div className="flex flex-wrap gap-2">
          {MODEL_OPTIONS.map((model) => (
            <button
              key={model}
              onClick={() =>
                updateParam("model", currentModel === model ? "" : model)
              }
              aria-pressed={currentModel === model}
            >
              <Badge
                variant={currentModel === model ? "violet" : "outline"}
                className="cursor-pointer capitalize hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors"
              >
                {model}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
