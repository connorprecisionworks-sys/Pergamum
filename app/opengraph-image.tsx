import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Prmpt — Turn comments into clients.";

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
          background: "#ffffff",
          padding: "80px",
        }}
      >
        {/* Big sans-serif P mark */}
        <p
          style={{
            fontFamily: "sans-serif",
            fontSize: 180,
            fontWeight: 700,
            color: "#0a0a0a",
            lineHeight: 1,
            margin: "0 0 24px",
          }}
        >
          P
        </p>

        {/* Wordmark */}
        <p
          style={{
            fontFamily: "sans-serif",
            fontSize: 48,
            fontWeight: 600,
            color: "#0a0a0a",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 20px",
          }}
        >
          PRMPT
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
          Turn comments into clients.
        </p>
      </div>
    ),
    { ...size }
  );
}
