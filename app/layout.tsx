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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://prmptkit.com";

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
    <html
      lang="en"
      // dark is the default class; ThemeToggle can remove it for light mode
      className={`dark ${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Synchronous script: reads localStorage before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}`,
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
