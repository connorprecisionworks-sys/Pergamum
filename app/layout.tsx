import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// One typeface for the whole system — headings, body, labels, numerals.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://useprmpt.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Prmpt — A living library of prompts.",
    template: "%s | Prmpt",
  },
  description:
    "Discover, share, and refine prompts for every AI tool. Built by the community, free forever.",
  keywords: [
    "AI prompts",
    "prompt library",
    "ChatGPT prompts",
    "Claude prompts",
    "prompt engineering",
    "LLM prompts",
    "community prompts",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Prmpt",
    title: "Prmpt — A living library of prompts.",
    description:
      "Discover, share, and refine prompts for every AI tool. Built by the community, free forever.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prmpt — A living library of prompts.",
    description:
      "Discover, share, and refine prompts for every AI tool. Built by the community, free forever.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={hanken.variable}>
      <head>
        {/* Synchronous script: reads localStorage before first paint to avoid flash.
            Light is now the default (pure-white source-of-truth system); dark is
            opt-in and remains for scoped surfaces. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to content
        </a>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
