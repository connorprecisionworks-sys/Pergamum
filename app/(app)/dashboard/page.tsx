import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, ArrowUp, Edit, FileText, Clock, User, BookOpen, Star, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
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
  const hasNoPrompts = (prompts ?? []).length === 0;

  if (hasNoPrompts) {
    return (
      <div className="container py-10">
        <div className="rounded-lg px-6 py-7 mb-8 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)]">
          <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {profile?.display_name ?? profile?.username}
          </p>
        </div>

        <Card className="max-w-lg mx-auto mt-16 text-center p-12">
          <CardContent className="space-y-6 pt-0">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-medium tracking-tight">Share your first prompt</h2>
              <p className="text-muted-foreground">
                Contribute to the library and earn reputation with every upvote.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/submit">
                <Plus className="h-4 w-4 mr-2" />
                Submit a prompt
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="rounded-lg px-6 py-7 mb-8 bg-[radial-gradient(circle_at_top_left,#f5f3ff99,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,#2d195933,transparent_60%)] flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
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

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/profile">
            <User className="h-4 w-4 mr-1.5" />
            Edit profile
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/collections">
            <BookOpen className="h-4 w-4 mr-1.5" />
            My collections
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/badges">
            <Star className="h-4 w-4 mr-1.5" />
            Badges
          </Link>
        </Button>
        {profile?.username && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/u/${profile.username}`}>
              <Eye className="h-4 w-4 mr-1.5" />
              Public profile
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="border-t border-b border-border py-3 mb-8 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-foreground-subtle" />
          <span className="label-mono text-foreground-subtle">Published</span>
          <span className="font-mono text-[14px] text-foreground ml-1">{published.length}</span>
        </div>
        <span className="opacity-40 text-foreground-subtle select-none">·</span>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-foreground-subtle" />
          <span className="label-mono text-foreground-subtle">In review</span>
          <span className="font-mono text-[14px] text-foreground ml-1">{drafts.length}</span>
        </div>
        <span className="opacity-40 text-foreground-subtle select-none">·</span>
        <div className="flex items-center gap-1.5">
          <ArrowUp className="h-3 w-3 text-foreground-subtle" />
          <span className="label-mono text-foreground-subtle">Upvotes</span>
          <span className="font-mono text-[14px] text-foreground ml-1">{formatCount(totalUpvotes)}</span>
        </div>
        <span className="opacity-40 text-foreground-subtle select-none">·</span>
        <div className="flex items-center gap-1.5">
          <Eye className="h-3 w-3 text-foreground-subtle" />
          <span className="label-mono text-foreground-subtle">Uses</span>
          <span className="font-mono text-[14px] text-foreground ml-1">{formatCount(totalViews)}</span>
        </div>
        {typeof profile?.reputation === "number" && (
          <>
            <span className="opacity-40 text-foreground-subtle select-none">·</span>
            <div className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-foreground-subtle" />
              <span className="label-mono text-foreground-subtle">Reputation</span>
              <span className="font-mono text-[14px] text-foreground ml-1">{profile.reputation}</span>
            </div>
          </>
        )}
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
              <PromptTable
                prompts={published}
                emptyContent={
                  <EmptyState
                    icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                    title="Share your first prompt"
                    description="Contribute to the library and earn reputation with each upvote."
                    action={{ label: "Submit a prompt", href: "/submit" }}
                  />
                }
              />
            </TabsContent>
            <TabsContent value="drafts">
              <PromptTable
                prompts={drafts}
                emptyContent={
                  <EmptyState
                    icon={<Clock className="h-6 w-6 text-muted-foreground" />}
                    title="Nothing in review"
                    description="Submitted prompts appear here while awaiting review."
                  />
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function PromptTable({ prompts, emptyContent }: { prompts: Prompt[]; emptyContent?: ReactNode }) {
  if (prompts.length === 0) {
    return emptyContent ?? (
      <p className="text-sm text-muted-foreground py-6 text-center">Nothing here yet.</p>
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
                  className="font-medium text-sm hover:text-brand-600 dark:hover:text-brand-300 transition-colors truncate"
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
