import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://useprmpt.com";

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`,            changeFrequency: "daily",  priority: 1   },
  { url: `${BASE_URL}/prompts`,     changeFrequency: "daily",  priority: 0.9 },
  { url: `${BASE_URL}/tools`,       changeFrequency: "weekly", priority: 0.7 },
  { url: `${BASE_URL}/collections`, changeFrequency: "daily",  priority: 0.6 },
  { url: `${BASE_URL}/feed`,        changeFrequency: "daily",  priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  const [{ data: prompts }, { data: profiles }] = await Promise.all([
    supabase
      .from("prompts")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("username")
      .gt("contribution_count", 0),
  ]);

  const promptUrls: MetadataRoute.Sitemap = (prompts ?? []).map((p) => ({
    url: `${BASE_URL}/prompts/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const profileUrls: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${BASE_URL}/u/${p.username}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Cap at 50,000 URLs (Next.js / Google limit)
  return [...STATIC_PAGES, ...promptUrls, ...profileUrls].slice(0, 50_000);
}
