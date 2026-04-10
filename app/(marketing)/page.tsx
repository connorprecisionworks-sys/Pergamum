import Link from "next/link";
import { ArrowRight, Zap, Users, TrendingUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PromptCard } from "@/components/prompts/prompt-card";
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

  // Fetch featured/trending prompts
  const { data: trendingPrompts } = await supabase
    .from("prompts")
    .select(
      `*, profiles(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
    )
    .eq("status", "published")
    .order("trending_score", { ascending: false })
    .limit(6);

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  // Fetch recent prompts
  const { data: recentPrompts } = await supabase
    .from("prompts")
    .select(
      `*, profiles(id, username, display_name, avatar_url), categories(id, name, slug, icon)`
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(4);

  // Stats
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
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-violet-50/50 to-background">
        <div className="container py-20 md:py-28 text-center space-y-6">
          <Badge variant="violet" className="text-xs px-3 py-1 rounded-full">
            Community-powered · Free forever
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            The prompt library{" "}
            <span className="text-violet-600">built by the community</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Browse, contribute, and vote on high-quality AI prompts. Organized
            by use case and model. Always free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-700"
              asChild
            >
              <Link href="/prompts">
                Browse prompts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/signup">Submit a prompt</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 justify-center pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-violet-500" />
              <span className="font-medium text-foreground">
                {(promptCount ?? 0).toLocaleString()}
              </span>{" "}
              prompts
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-violet-500" />
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
          <h2 className="text-2xl font-bold tracking-tight">Browse by category</h2>
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
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center hover:border-violet-200 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">
                {CATEGORY_ICONS[cat.icon ?? ""] ?? "📝"}
              </span>
              <span className="text-xs font-medium leading-tight group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
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
              <TrendingUp className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-bold tracking-tight">Trending now</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/prompts?sort=trending">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(trendingPrompts as PromptWithAuthor[]).map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
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
                <Zap className="h-5 w-5 text-violet-600" />
                <h2 className="text-2xl font-bold tracking-tight">Recently added</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/prompts?sort=newest">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(recentPrompts as PromptWithAuthor[]).map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t">
        <div className="container py-20 text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Have a great prompt to share?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join the community and help others get more out of their AI tools.
            Submitting takes less than 2 minutes.
          </p>
          <Button
            size="lg"
            className="bg-violet-600 hover:bg-violet-700"
            asChild
          >
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
