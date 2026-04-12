import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, Award, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PromptCard } from "@/components/prompts/prompt-card";
import { formatCount, relativeTime } from "@/lib/utils";
import type { PromptWithAuthor } from "@/lib/types/database";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}`,
    description: `View ${username}'s prompt contributions on Pergamum.`,
  };
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: prompts } = await supabase
    .from("prompts")
    .select(
      `*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
    )
    .eq("author_id", profile.id)
    .eq("status", "published")
    .order("upvotes", { ascending: false });

  const totalUpvotes = (prompts ?? []).reduce((acc, p) => acc + p.upvotes, 0);

  const initials = profile.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile.username.slice(0, 2).toUpperCase();

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={profile.avatar_url ?? undefined}
              alt={profile.display_name ?? profile.username}
            />
            <AvatarFallback className="text-2xl bg-pergamum-100 text-pergamum-700">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">
                {profile.display_name ?? profile.username}
              </h1>
              {profile.is_admin && (
                <Badge variant="pergamum" className="text-xs">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm leading-relaxed max-w-lg">{profile.bio}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Joined {relativeTime(profile.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>{(prompts ?? []).length} prompts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4" />
                <span>{formatCount(totalUpvotes)} upvotes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Published prompts</h2>
          {prompts && prompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(prompts as PromptWithAuthor[]).map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No published prompts yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
