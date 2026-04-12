import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, ArrowUp, Edit, Trash2, FileText, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCount, relativeTime } from "@/lib/utils";
import type { Prompt } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Dashboard",
};

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  published: {
    label: "Published",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  pending: {
    label: "In review",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  draft: {
    label: "Draft",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  flagged: {
    label: "Flagged",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  removed: {
    label: "Removed",
    className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const published = (prompts ?? []).filter((p) => p.status === "published");
  const drafts = (prompts ?? []).filter(
    (p) => p.status === "pending" || p.status === "draft" || p.status === "flagged"
  );

  const totalUpvotes = published.reduce((acc, p) => acc + p.upvotes, 0);
  const totalViews = (prompts ?? []).reduce((acc, p) => acc + p.views, 0);

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.display_name ?? profile?.username}
          </p>
        </div>
        <Button asChild>
          <Link href="/submit">
            <Plus className="h-4 w-4 mr-2" />
            New prompt
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Published</span>
            </div>
            <div className="text-2xl font-bold">{published.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">In review</span>
            </div>
            <div className="text-2xl font-bold">{drafts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm">Total upvotes</span>
            </div>
            <div className="text-2xl font-bold">{formatCount(totalUpvotes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Total uses</span>
            </div>
            <div className="text-2xl font-bold">{formatCount(totalViews)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Prompts table */}
      <Card>
        <CardHeader>
          <CardTitle>Your prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="published">
            <TabsList className="mb-4">
              <TabsTrigger value="published">
                Published ({published.length})
              </TabsTrigger>
              <TabsTrigger value="drafts">
                In review ({drafts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="published">
              <PromptTable prompts={published} />
            </TabsContent>
            <TabsContent value="drafts">
              <PromptTable prompts={drafts} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function PromptTable({ prompts }: { prompts: Prompt[] }) {
  if (prompts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {prompts.map((prompt) => {
        const badge = STATUS_BADGE[prompt.status];
        return (
          <div
            key={prompt.id}
            className="flex items-start justify-between gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {prompt.status !== "published" && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge?.className}`}
                  >
                    {badge?.label}
                  </span>
                )}
                <Link
                  href={`/prompts/${prompt.slug}`}
                  className="font-medium text-sm hover:text-pergamum-600 transition-colors truncate"
                >
                  {prompt.title}
                </Link>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  {prompt.upvotes}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {formatCount(prompt.views)}
                </span>
                <span>{relativeTime(prompt.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/submit/edit/${prompt.id}`} aria-label="Edit prompt">
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
