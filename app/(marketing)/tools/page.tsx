import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ToolCard } from "@/components/tools/tool-card";
import type { Tool } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Free AI Tools Directory",
  description:
    "Browse the best free AI tools for writing, coding, image generation, research, and more.",
};

const TOOL_CATEGORIES = [
  "Chat",
  "Search",
  "Image",
  "Audio",
  "Coding",
  "Research",
  "Visuals",
  "Local",
  "Platform",
];

export default async function ToolsPage() {
  const supabase = await createClient();

  const { data: tools } = await supabase
    .from("tools")
    .select("*")
    .eq("status", "approved")
    .order("name");

  const toolsByCategory = TOOL_CATEGORIES.reduce<Record<string, Tool[]>>(
    (acc, cat) => {
      acc[cat] = (tools as Tool[] | null)?.filter((t) => t.category === cat) ?? [];
      return acc;
    },
    {}
  );

  // Uncategorised
  const categorised = new Set(TOOL_CATEGORIES);
  const others =
    (tools as Tool[] | null)?.filter(
      (t) => !t.category || !categorised.has(t.category)
    ) ?? [];

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Free AI Tools Directory
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            The best free (or freemium) AI tools, curated and community-maintained.
            No paywalls, no sign-up required to browse.
          </p>
        </div>

        <div className="space-y-12">
          {TOOL_CATEGORIES.map((cat) => {
            const catTools = toolsByCategory[cat];
            if (!catTools || catTools.length === 0) return null;
            return (
              <section key={cat}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {cat}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({catTools.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            );
          })}

          {others.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Other</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
