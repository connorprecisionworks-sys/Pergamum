import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createPublicClient();
  const { data: prompt } = await supabase
    .from("prompts")
    .select(
      "title, profiles:profiles!prompts_author_id_fkey(username, display_name)"
    )
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  const rawTitle = prompt?.title ?? "Untitled Prompt";
  const title =
    rawTitle.length > 60 ? rawTitle.slice(0, 57) + "…" : rawTitle;

  const author = prompt?.profiles as
    | { username?: string; display_name?: string }
    | null;
  const handle = author?.username ? `@${author.username}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "linear-gradient(135deg, #1a0a2e 0%, #0f0f0f 60%, #000000 100%)",
        }}
      >
        {/* Top: wordmark */}
        <p
          style={{
            fontFamily: "serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#9370db",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          PRMPT
        </p>

        {/* Middle: title + handle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <p
            style={{
              fontFamily: "serif",
              fontSize: 56,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {title}
          </p>
          {handle && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 26,
                color: "#9370db",
                margin: 0,
              }}
            >
              {handle}
            </p>
          )}
        </div>

        {/* Bottom: URL hint */}
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 18,
            color: "#555555",
            margin: 0,
            letterSpacing: "0.06em",
          }}
        >
          prmpt.com / prompts
        </p>
      </div>
    ),
    { ...size }
  );
}
