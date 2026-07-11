import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { PromptCard } from "@/components/prompts/prompt-card";
import { FilterSidebar } from "@/components/prompts/filter-sidebar";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterDialog } from "@/components/prompts/filter-dialog";
import type { PromptWithAuthor, Category } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Browse Prompts",
};

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    model?: string;
    sort?: string;
    tag?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: "trending",  label: "Trending" },
  { value: "newest",    label: "Newest" },
  { value: "most-used", label: "Most used" },
] as const;

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = parseInt(params.page ?? "1") || 1;
  const offset = (page - 1) * PAGE_SIZE;
  const sort = params.sort ?? "trending";

  // Fetch categories for sidebar
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  // Build prompts query
  let query = supabase
    .from("prompts")
    .select(
      `*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`,
      { count: "exact" }
    )
    .eq("status", "published");

  if (params.q) {
    query = query.textSearch("search_vector", params.q, {
      type: "websearch",
      config: "english",
    });
  }

  if (params.category) {
    const cat = (categories as Category[] | null)?.find(
      (c) => c.slug === params.category
    );
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  if (params.model) {
    query = query.contains("model_tags", [params.model]);
  }

  if (params.tag) {
    query = query.contains("tags", [params.tag]);
  }

  if (sort === "newest") {
    query = query.order("published_at", { ascending: false });
  } else if (sort === "most-used") {
    // Usage, not applause — copies is the signal the product is built around.
    query = query.order("copies", { ascending: false });
  } else {
    query = query.order("trending_score", { ascending: false });
  }

  const { data: prompts, count } = await query.range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const activeCategory = params.category
    ? (categories as Category[] | null)?.find((c) => c.slug === params.category)
    : null;

  return (
    <div className="container py-8 max-w-[1280px]">
      {/* Page header with brand-tinted radial gradient */}
      <div className="relative rounded-lg px-6 py-7 mb-8 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)]">
        <h1 className="font-serif text-[32px] font-medium tracking-h2">
          {params.q
            ? `Search: "${params.q}"`
            : activeCategory
            ? activeCategory.name
            : params.tag
            ? `#${params.tag}`
            : "Browse Prompts"}
        </h1>
        {count !== null && (
          <p className="label-mono mt-2">
            [ {count.toLocaleString()} PROMPT{count !== 1 ? "S" : ""} ]
          </p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="hidden lg:block w-44 shrink-0">
          <Suspense fallback={null}>
            <FilterSidebar categories={(categories as Category[] | null) ?? []} />
          </Suspense>
        </div>

        {/* Prompt grid */}
        <div className="flex-1 min-w-0">
          {/* Sort tabs — visible at all breakpoints */}
          <div className="flex gap-1 mb-4 flex-wrap">
            {SORT_OPTIONS.map(({ value, label }) => (
              <Link
                key={value}
                href={buildSortUrl(params, value)}
                className={cn(
                  "font-mono text-[12px] uppercase tracking-[0.08em] px-3 py-1.5 rounded-md transition-colors",
                  sort === value
                    ? "bg-background-subtle text-foreground"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile filters */}
          <div className="lg:hidden mb-6">
            <Suspense fallback={null}>
              <FilterDialog categories={(categories as Category[] | null) ?? []} />
            </Suspense>
          </div>

          {prompts && prompts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(prompts as PromptWithAuthor[]).map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {page > 1 && (
                    <a
                      href={buildUrl(params, page - 1)}
                      className="px-4 py-2 border rounded-md text-sm hover:bg-muted transition-colors"
                    >
                      Previous
                    </a>
                  )}
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <a
                      href={buildUrl(params, page + 1)}
                      className="px-4 py-2 border rounded-md text-sm hover:bg-muted transition-colors"
                    >
                      Next
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<Search className="h-6 w-6 text-muted-foreground" />}
              title="No prompts match your filters"
              description={
                params.q
                  ? "Try different search terms or browse all prompts."
                  : "Adjust your filters or be the first to contribute."
              }
              action={{ label: "Clear filters", href: "/prompts" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function buildSortUrl(
  params: Record<string, string | undefined>,
  sort: string
): string {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  if (params.category) p.set("category", params.category);
  if (params.model) p.set("model", params.model);
  if (params.tag) p.set("tag", params.tag);
  if (sort !== "trending") p.set("sort", sort);
  const qs = p.toString();
  return qs ? `/prompts?${qs}` : "/prompts";
}

function buildUrl(
  params: Record<string, string | undefined>,
  page: number
): string {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  if (params.category) p.set("category", params.category);
  if (params.model) p.set("model", params.model);
  if (params.sort) p.set("sort", params.sort);
  if (params.tag) p.set("tag", params.tag);
  if (page > 1) p.set("page", String(page));
  return `/prompts?${p.toString()}`;
}
