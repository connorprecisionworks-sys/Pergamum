import Link from "next/link";
import { ArrowRight, Zap, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PromptCard } from "@/components/prompts/prompt-card";
import { TypingHero } from "@/components/brand/typing-hero";
import { createClient } from "@/lib/supabase/server";
import type { PromptWithAuthor, Category } from "@/lib/types/database";

const CATEGORY_ICONS: Record<string, string> = {
  "PenLine": "✍️",
  "Code2": "💻",
  "Megaphone": "📣",
  "Search": "🔍",
  "Briefcase": "💼",
  "Image": "🎨",
  "Clapperboard": "🎬",
  "Globe": "🌐",
  "BarChart2": "📊",
  "GraduationCap": "🎓",
  "Zap": "⚡",
  "Sparkles": "✨",
};

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const blurred = !user;

  const { data: trendingPrompts } = await supabase
    .from("prompts")
    .select(
      `*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
    )
    .eq("status", "published")
    .order("trending_score", { ascending: false })
    .limit(6);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  const { data: recentPrompts } = await supabase
    .from("prompts")
    .select(
      `*, profiles:profiles!prompts_author_id_fkey(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(4);

  const { count: promptCount } = await supabase
    .from("prompts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-pergamum-50/50 to-background">
        <div className="container py-20 md:py-28 text-center space-y-6">
          <Badge variant="pergamum" className="text-xs px-3 py-1 rounded-full">
            Community-powered · Free forever
          </Badge>
          <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl mx-auto leading-tight">
            A living library <TypingHero />
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Discover, share, and vote on high-quality AI prompts. Organized by
            use case and model. Built by the community, free forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button size="lg" asChild>
              <Link href="/prompts">
                Browse the library
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signup">Contribute a prompt</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 justify-center pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">
                {(promptCount ?? 0).toLocaleString()}
              </span>{" "}
              prompts
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-pergamum-500" />
              <span className="font-medium text-foreground">
                {(userCount ?? 0).toLocaleString()}
              </span>{" "}
              contributors
            </div>
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Browse by category</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/prompts">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(categories as Category[] | null)?.map((cat) => (
            <Link
              key={cat.id}
              href={`/prompts?category=${cat.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center hover:border-pergamum-200 hover:bg-pergamum-50/50 dark:hover:bg-pergamum-900/20 transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">
                {CATEGORY_ICONS[cat.icon ?? ""] ?? "📝"}
              </span>
              <span className="text-xs font-medium leading-tight group-hover:text-pergamum-700 dark:group-hover:text-pergamum-400 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending prompts */}
      {trendingPrompts && trendingPrompts.length > 0 && (
        <section className="container py-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-pergamum-600" />
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Trending now</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/prompts?sort=trending">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(trendingPrompts as PromptWithAuthor[]).map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} blurred={blurred} />
            ))}
          </div>
        </section>
      )}

      {/* Recent prompts */}
      {recentPrompts && recentPrompts.length > 0 && (
        <section className="border-t bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="container py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-pergamum-600" />
                <h2 className="font-serif text-2xl font-semibold tracking-tight">Recently added</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/prompts?sort=newest">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(recentPrompts as PromptWithAuthor[]).map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} blurred={blurred} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t">
        <div className="container py-20 text-center space-y-6">
          <h2 className="font-serif text-3xl font-semibold tracking-tight">
            Have a great prompt to share?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join the community and help others get more out of their AI tools.
            Submitting takes less than 2 minutes.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/signup">
              Get started for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
