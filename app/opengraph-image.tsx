import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PrmptKit — A living library of prompts";

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
          background: "#f5f2ee",
          padding: "80px",
        }}
      >
        {/* Big serif P */}
        <p
          style={{
            fontFamily: "serif",
            fontSize: 180,
            fontWeight: 400,
            color: "#6b26d9",
            lineHeight: 1,
            margin: "0 0 24px",
          }}
        >
          P
        </p>

        {/* Wordmark */}
        <p
          style={{
            fontFamily: "serif",
            fontSize: 48,
            fontWeight: 400,
            color: "#1a1a1a",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 20px",
          }}
        >
          PRMPTKIT
        </p>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "sans-serif",
            fontSize: 22,
            color: "#888888",
            textAlign: "center",
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          A community archive of prompts for every AI tool.
        </p>
      </div>
    ),
    { ...size }
  );
}
