import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";
import { AdminActions } from "./admin-actions";

export const metadata: Metadata = {
  title: "Admin — Moderation Queue",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) notFound();

  // Pending prompts (drafts from users with < 2 approved)
  const { data: pending } = await supabase
    .from("prompts")
    .select(`*, profiles(id, username, display_name, contribution_count)`)
    .eq("status", "draft")
    .order("created_at", { ascending: true });

  // Open reports
  const { data: reports } = await supabase
    .from("reports")
    .select(
      `*, reporter:profiles!reports_reporter_id_fkey(username), prompts(title, slug)`
    )
    .eq("status", "open")
    .order("created_at", { ascending: true });

  // Pending tools
  const { data: pendingTools } = await supabase
    .from("tools")
    .select(`*, profiles(username)`)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Moderation Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review prompts, reports, and tool submissions.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{(pending ?? []).length}</div>
            <div className="text-sm text-muted-foreground">Pending prompts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{(reports ?? []).length}</div>
            <div className="text-sm text-muted-foreground">Open reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{(pendingTools ?? []).length}</div>
            <div className="text-sm text-muted-foreground">Pending tools</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="prompts">
          <CardHeader>
            <TabsList>
              <TabsTrigger value="prompts">
                Prompts ({(pending ?? []).length})
              </TabsTrigger>
              <TabsTrigger value="reports">
                Reports ({(reports ?? []).length})
              </TabsTrigger>
              <TabsTrigger value="tools">
                Tools ({(pendingTools ?? []).length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="prompts" className="space-y-3 mt-0">
              {(pending ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Queue is empty.
                </p>
              ) : (
                (pending ?? []).map((prompt) => (
                  <div
                    key={prompt.id}
                    className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/prompts/${prompt.slug}`}
                          className="font-medium text-sm hover:text-violet-600 transition-colors"
                          target="_blank"
                        >
                          {prompt.title}
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          New author
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {prompt.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        by{" "}
                        <span className="font-medium">
                          {(prompt as unknown as {profiles: {username: string}}).profiles?.username}
                        </span>{" "}
                        · {relativeTime(prompt.created_at)}
                      </div>
                    </div>
                    <AdminActions
                      type="prompt"
                      id={prompt.id}
                      authorId={prompt.author_id}
                    />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-3 mt-0">
              {(reports ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No open reports.
                </p>
              ) : (
                (reports ?? []).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          Report on:{" "}
                          {(report as unknown as {prompts: {title: string; slug: string}}).prompts?.title ?? "comment"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mb-1">
                        {report.reason}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        by{" "}
                        <span className="font-medium">
                          {(report as unknown as {reporter: {username: string}}).reporter?.username}
                        </span>{" "}
                        · {relativeTime(report.created_at)}
                      </div>
                    </div>
                    <AdminActions
                      type="report"
                      id={report.id}
                      promptId={report.prompt_id ?? undefined}
                    />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="tools" className="space-y-3 mt-0">
              {(pendingTools ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No pending tools.
                </p>
              ) : (
                (pendingTools ?? []).map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1">{tool.name}</div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {tool.url}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                    <AdminActions type="tool" id={tool.id} />
                  </div>
                ))
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
