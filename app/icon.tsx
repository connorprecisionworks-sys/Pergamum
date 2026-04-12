import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 4C5 2.895 5.895 2 7 2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7"
            stroke="#9370db"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M7 20a2 2 0 0 1-2-2V6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12"
            stroke="#9370db"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <line x1="9" y1="8"  x2="17" y2="8"  stroke="#9370db" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="11" x2="17" y2="11" stroke="#9370db" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="14" x2="14" y2="14" stroke="#9370db" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
