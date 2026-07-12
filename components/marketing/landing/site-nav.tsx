import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// The mockup points every nav link at a placeholder anchor. The three that have
// real routes are wired to them; Pricing has no route yet, so it keeps the
// mockup's in-page anchor behaviour rather than shipping a 404.
const LINKS = [
  { label: "Browse", href: "/prompts" },
  { label: "Creators", href: "/leaderboards" },
  { label: "Pricing", href: "#benefits" },
  { label: "Resources", href: "/the-science" },
];

export async function SiteNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 grid h-[72px] grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-background/80 px-6 backdrop-blur-xl md:px-10">
      <Link href="/" className="flex items-center gap-2.5 justify-self-start">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] bg-primary">
          <Image
            src="/logo-mark-white.png"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px]"
          />
        </span>
        <span className="text-[21px] font-medium -tracking-[0.01em] text-foreground">
          prmpt
        </span>
      </Link>

      <nav className="hidden items-center gap-[30px] whitespace-nowrap text-[14.5px] font-medium text-foreground-muted lg:flex">
        {LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3.5 justify-self-end">
        <Link
          href="/prompts"
          className="hidden h-10 items-center gap-2.5 rounded-full border border-border-strong px-[18px] text-sm text-foreground-muted transition-colors hover:text-foreground xl:inline-flex"
        >
          <Search className="h-3.5 w-3.5 text-foreground-subtle" />
          Find a pack
        </Link>
        {user ? (
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-full bg-primary px-[22px] text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="hidden h-10 items-center rounded-full border border-border-strong px-[18px] text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex h-10 items-center rounded-full bg-primary px-[22px] text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
