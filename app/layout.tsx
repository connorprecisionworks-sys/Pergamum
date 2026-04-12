import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pergamum — A living library of prompts.",
    template: "%s | Pergamum",
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
    siteName: "Pergamum",
    title: "Pergamum — A living library of prompts.",
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
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
