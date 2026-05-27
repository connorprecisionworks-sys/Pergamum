import type { Metadata } from "next";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { SkillCard } from "@/components/skills/skill-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { SkillWithAuthor } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Claude Code Skills",
  description:
    "Browse and share Claude Code skills — copy the install command, see what they do, and contribute your own.",
};

interface SkillsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    runtime?: string;
    sort?: string;
    tag?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 24;

const SKILL_CATEGORIES = [
  "agents",
  "coding",
  "writing",
  "data",
  "research",
  "design",
  "ops",
  "marketing",
  "other",
];

const RUNTIME_OPTIONS = ["claude-code", "cowork", "claude-api"];

const SORT_OPTIONS = [
  { value: "trending",  label: "Trending" },
  { value: "newest",    label: "Newest" },
  { value: "top",       label: "Top all-time" },
] as const;

export default async function SkillsBrowsePage({ searchParams }: SkillsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = parseInt(params.page ?? "1") || 1;
  const offset = (page - 1) * PAGE_SIZE;
  const sort = params.sort ?? "trending";

  let query = supabase
    .from("skills")
    .select(
      `*, profiles:profiles!skills_author_id_fkey(id, username, display_name, avatar_url)`,
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
    query = query.eq("category", params.category);
  }

  if (params.runtime) {
    query = query.contains("runtimes", [params.runtime]);
  }

  if (params.tag) {
    query = query.contains("tags", [params.tag]);
  }

  if (sort === "newest") {
    query = query.order("published_at", { ascending: false });
  } else if (sort === "top") {
    query = query.order("upvotes", { ascending: false });
  } else {
    query = query.order("trending_score", { ascending: false });
  }

  const { data: skills, count } = await query.range(offset, offset + PAGE_SIZE - 1);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="container py-8 max-w-[1280px]">
      {/* Hero header with brand-tinted radial gradient */}
      <div className="relative rounded-lg px-6 py-7 mb-8 flex flex-wrap items-end justify-between gap-4 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)]">
        <div>
          <h1 className="font-serif text-[32px] font-medium tracking-h2">
            {params.q
              ? `Search: "${params.q}"`
              : params.category
              ? `${params.category[0].toUpperCase()}${params.category.slice(1)} skills`
              : params.tag
              ? `#${params.tag}`
              : "Claude Code Skills"}
          </h1>
          <p className="text-sm text-foreground-muted mt-2 max-w-2xl">
            A unified directory of helpful Claude Code skills. Copy the install
            command, read what each one does, and share the ones that have made
            your workflow better.
          </p>
          {count !== null && (
            <p className="label-mono mt-3">
              [ {count.toLocaleString()} SKILL{count !== 1 ? "S" : ""} ]
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/skills/submit">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Share a skill
          </Link>
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar — runtime + category only; sort moved to tabs */}
        <aside className="hidden lg:block w-44 shrink-0 space-y-6" aria-label="Filter skills">
          <FilterGroup
            title="Runtime"
            options={RUNTIME_OPTIONS.map((r) => ({ label: r, value: r }))}
            current={params.runtime ?? ""}
            paramKey="runtime"
            searchParams={params}
          />

          <FilterGroup
            title="Category"
            options={SKILL_CATEGORIES.map((c) => ({ label: c, value: c }))}
            current={params.category ?? ""}
            paramKey="category"
            searchParams={params}
          />
        </aside>

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

          {skills && skills.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(skills as SkillWithAuthor[]).map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>

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
              title="No skills match your filters"
              description={
                params.q
                  ? "Try different search terms or browse all skills."
                  : "Be the first to share a skill with the community."
              }
              action={
                params.q || params.category || params.runtime || params.tag
                  ? { label: "Clear filters", href: "/skills" }
                  : { label: "Share a skill", href: "/skills/submit" }
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  current,
  paramKey,
  searchParams,
}: {
  title: string;
  options: { label: string; value: string }[];
  current: string;
  paramKey: string;
  searchParams: Record<string, string | undefined>;
}) {
  const buildHref = (value: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== paramKey && k !== "page") p.set(k, v);
    }
    if (value) p.set(paramKey, value);
    const qs = p.toString();
    return qs ? `/skills?${qs}` : "/skills";
  };

  return (
    <fieldset className="border-0 p-0 m-0 min-w-0">
      <legend className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground-subtle mb-2">
        {title}
      </legend>
      <div className="flex flex-col gap-0.5">
        <Link
          href={buildHref("")}
          className={cn(
            "text-[13px] text-left px-3 py-1.5 flex items-center rounded-md transition-colors capitalize",
            !current
              ? "bg-background-subtle text-foreground font-medium"
              : "text-foreground-muted hover:bg-background-subtle hover:text-foreground"
          )}
        >
          All
        </Link>
        {options.map((opt) => (
          <Link
            key={opt.value}
            href={buildHref(opt.value)}
            className={cn(
              "text-[13px] text-left px-3 py-1.5 flex items-center rounded-md transition-colors capitalize",
              current === opt.value
                ? "bg-background-subtle text-foreground font-medium"
                : "text-foreground-muted hover:bg-background-subtle hover:text-foreground"
            )}
          >
            {opt.label}
          </Link>
        ))}
      </div>
    </fieldset>
  );
}

function buildSortUrl(
  params: Record<string, string | undefined>,
  sort: string
): string {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  if (params.category) p.set("category", params.category);
  if (params.runtime) p.set("runtime", params.runtime);
  if (params.tag) p.set("tag", params.tag);
  if (sort !== "trending") p.set("sort", sort);
  const qs = p.toString();
  return qs ? `/skills?${qs}` : "/skills";
}

function buildUrl(
  params: Record<string, string | undefined>,
  page: number
): string {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  if (params.category) p.set("category", params.category);
  if (params.runtime) p.set("runtime", params.runtime);
  if (params.sort) p.set("sort", params.sort);
  if (params.tag) p.set("tag", params.tag);
  if (page > 1) p.set("page", String(page));
  return `/skills?${p.toString()}`;
}
