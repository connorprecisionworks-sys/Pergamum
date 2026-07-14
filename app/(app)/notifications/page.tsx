import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Flame, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils";
import type { Notification } from "@/lib/types/database";
import { CreatorMessageOfferButton } from "./creator-message-offer-button";

interface HotLeadPayload {
  score?: number;
  stage?: string;
  trigger_event_type?: string;
}

interface CreatorMessagePayload {
  lead_message_id?: string;
  creator_name?: string;
  offer_label?: string;
  offer_url?: string;
  note?: string | null;
}

export const metadata: Metadata = {
  title: "Notifications",
};

type NotificationWithTarget = Notification & {
  prompts: {
    id: string;
    title: string;
    slug: string;
    profiles: { username: string; display_name: string | null } | null;
  } | null;
  packs: {
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
      `*,
      prompts:prompts!notifications_prompt_id_fkey(id, title, slug, profiles:profiles!prompts_author_id_fkey(username, display_name)),
      packs:packs!notifications_pack_id_fkey(id, title, slug, profiles:profiles!packs_creator_id_fkey(username, display_name))`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as unknown as NotificationWithTarget[];

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
            if (n.type === "hot_lead") {
              const payload = (n.payload ?? {}) as HotLeadPayload;
              const headline =
                payload.trigger_event_type === "offer_click"
                  ? "A lead just clicked your offer button"
                  : "A lead's recent activity just crossed your alert threshold";
              return (
                <Link
                  key={n.id}
                  href="/dashboard/leads"
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <Flame className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{headline}</span>
                      {typeof payload.score === "number" && (
                        <span className="text-muted-foreground"> — score {Math.round(payload.score)}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(n.created_at)}</p>
                  </div>
                </Link>
              );
            }
            if (n.type === "creator_message") {
              const payload = (n.payload ?? {}) as CreatorMessagePayload;
              return (
                <div key={n.id} className="flex items-start gap-3 p-4 rounded-lg border">
                  <Mail className="h-4 w-4 text-brand-600 dark:text-brand-300 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{payload.creator_name ?? "A creator"}</span> sent you
                      something
                    </p>
                    {payload.offer_label && payload.offer_url && payload.lead_message_id && (
                      <CreatorMessageOfferButton
                        leadMessageId={payload.lead_message_id}
                        label={payload.offer_label}
                        url={payload.offer_url}
                      />
                    )}
                    {payload.note && (
                      <p className="text-sm text-muted-foreground mt-2">{payload.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{relativeTime(n.created_at)}</p>
                  </div>
                </div>
              );
            }
            if (n.prompts) {
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
            }
            if (n.packs) {
              const authorName = n.packs.profiles?.display_name ?? n.packs.profiles?.username ?? "Someone";
              const verb = n.type === "pack_updated" ? "pushed an update to" : "released";
              return (
                <Link
                  key={n.id}
                  href={`/packs/${n.packs.profiles?.username}/${n.packs.slug}`}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <Bell className="h-4 w-4 text-brand-600 dark:text-brand-300 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{authorName}</span> {verb}{" "}
                      <span className="font-medium">{n.packs.title}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(n.created_at)}</p>
                  </div>
                </Link>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
