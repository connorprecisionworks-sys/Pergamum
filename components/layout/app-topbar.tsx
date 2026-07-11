"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Home",
  prompts: "Browse",
  library: "Library",
  feed: "Following",
  build: "Build",
  submit: "Submit",
  skills: "Skills",
  packs: "Packs",
  collections: "Collections",
  leaderboards: "Leaderboards",
  badges: "Badges",
  notifications: "Notifications",
  admin: "Admin",
  profile: "Profile",
  u: "Creator",
  edit: "Edit",
  new: "New",
  import: "Import",
};

function label(segment: string) {
  return (
    SEGMENT_LABELS[segment] ??
    segment.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

export function AppTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const segments = pathname.split("/").filter(Boolean);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/prompts?q=${encodeURIComponent(trimmed)}`);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-6 backdrop-blur-xl">
      <nav
        aria-label="Breadcrumb"
        className="ml-12 flex min-w-0 items-center gap-1.5 text-sm lg:ml-0"
      >
        {segments.length === 0 ? (
          <span className="font-medium text-foreground">Home</span>
        ) : (
          segments.map((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/");
            const last = index === segments.length - 1;
            return (
              <span key={href} className="flex min-w-0 items-center gap-1.5">
                {index > 0 && (
                  <span aria-hidden="true" className="text-foreground-subtle">
                    /
                  </span>
                )}
                {last ? (
                  <span className="truncate font-medium text-foreground">
                    {label(segment)}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="truncate text-foreground-muted transition-colors hover:text-foreground"
                  >
                    {label(segment)}
                  </Link>
                )}
              </span>
            );
          })
        )}
      </nav>

      <form onSubmit={onSubmit} className="ml-auto hidden sm:block">
        <div className="flex h-9 w-[240px] items-center gap-2 rounded-full border border-border-strong px-3.5 transition-colors focus-within:border-foreground/30">
          <Search className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompts"
            aria-label="Search prompts"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-subtle"
          />
        </div>
      </form>
    </header>
  );
}
