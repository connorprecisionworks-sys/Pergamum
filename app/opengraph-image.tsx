import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pergamum — A living library of prompts";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #1a0a2e 0%, #0f0f0f 60%, #000000 100%)",
        }}
      >
        {/* Wordmark */}
        <p
          style={{
            fontFamily: "serif",
            fontSize: 36,
            fontWeight: 700,
            color: "#9370db",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 32px",
          }}
        >
          PERGAMUM
        </p>

        {/* Headline */}
        <p
          style={{
            fontFamily: "serif",
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.05,
            textAlign: "center",
            margin: "0 0 24px",
          }}
        >
          The library is open.
        </p>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 24,
            color: "#888888",
            textAlign: "center",
            margin: 0,
          }}
        >
          A community archive of prompts for every AI tool.
        </p>
      </div>
    ),
    { ...size }
  );
}
