import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils";
import type { Notification } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Notifications",
};

type NotificationWithPrompt = Notification & {
  prompts: {
    id: string;
    title: string;
    slug: string;
    profiles: { username: string; display_name: string | null } | null;
  } | null;
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/notifications");

  const { data } = await supabase
    .from("notifications")
    .select(
      `*, prompts:prompts!notifications_prompt_id_fkey(id, title, slug, profiles:profiles!prompts_author_id_fkey(username, display_name))`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as unknown as NotificationWithPrompt[];

  // Mark everything unread as read now that the user's viewing the list.
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight font-serif">Notifications</h1>
        <p className="text-muted-foreground mt-1">Updates to prompts you follow or saved.</p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6 text-muted-foreground" />}
          title="Nothing yet"
          description="When a creator you follow or a prompt you saved gets updated, it'll show up here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            if (!n.prompts) return null;
            const authorName = n.prompts.profiles?.display_name ?? n.prompts.profiles?.username ?? "Someone";
            return (
              <Link
                key={n.id}
                href={`/prompts/${n.prompts.slug}`}
                className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                <Bell className="h-4 w-4 text-brand-600 dark:text-brand-300 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{authorName}</span> updated{" "}
                    <span className="font-medium">{n.prompts.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(n.created_at)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
