import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // One typeface. serif/mono are aliases of the same family so existing
        // font-serif / font-mono usages inherit it rather than break.
        sans: ["var(--font-hanken)", "system-ui", "sans-serif"],
        serif: ["var(--font-hanken)", "system-ui", "sans-serif"],
        mono: ["var(--font-hanken)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        display: "-0.03em",
        h1: "-0.02em",
        h2: "-0.015em",
        h3: "-0.01em",
        label: "0.08em",
      },
      colors: {
        // ── shadcn/ui tokens ──────────────────────────────────────
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ── New design-system semantic tokens ─────────────────────
        // Reference CSS vars directly (hex, not HSL) so no hsl() wrapper needed.
        // No opacity modifier support (bg-background-subtle/50 won't work) — by design.
        "background-subtle":  "var(--background-subtle)",
        "background-inset":   "var(--background-inset)",
        "border-strong":      "var(--border-strong)",
        "foreground-muted":   "var(--foreground-muted)",
        "foreground-subtle":  "var(--foreground-subtle)",
        // ── Brand palette ───────────────────────────────────────────
        // Retired as a hue: slate #34557D is gone, but the scale is KEPT and
        // remapped onto the monochrome neutral ramp so every existing
        // brand-* usage inherits the white/black system automatically.
        // 950 is new — it was referenced in 4 files but never defined.
        brand: {
          50:  "#F7F7F8",
          100: "#F3F3F3",
          200: "#ECECEC",
          300: "#E4E4E4",
          400: "#B7B5BC",
          500: "#8C8A93",
          600: "#605E67",
          700: "#3A3A40",
          800: "#232329",
          900: "#141416",
          950: "#0D0D0F",
        },
      },
      borderRadius: {
        lg: "var(--radius)",      /* 8px */
        md: "calc(var(--radius) - 2px)", /* 6px */
        sm: "calc(var(--radius) - 4px)", /* 4px */
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out both",
        shake: "shake 0.3s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
