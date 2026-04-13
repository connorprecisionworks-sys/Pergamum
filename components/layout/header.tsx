"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Menu, X, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface HeaderProps {
  profile: Profile | null;
}

const NAV_LINKS = [
  { href: "/prompts",      label: "Browse"      },
  { href: "/collections",  label: "Collections" },
  { href: "/leaderboards", label: "Leaderboards"},
  { href: "/badges",       label: "Badges"      },
  { href: "/tools",        label: "Tools"       },
];

export function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/prompts?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-200",
        scrolled
          ? "border-border-strong bg-background/90 backdrop-blur-xl"
          : "border-border bg-background/60 backdrop-blur-xl"
      )}
    >
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="shrink-0">
          <Link href="/">
            <Logo variant="full" size="sm" />
          </Link>
        </div>

        {/* Center: Nav — desktop */}
        <nav className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[14px] font-medium transition-colors",
                  active
                    ? "text-foreground bg-background-subtle"
                    : "text-foreground-muted hover:text-foreground hover:bg-background-subtle"
                )}
              >
                {label}
                {active && (
                  <span className="font-mono text-[10px] text-foreground-subtle tracking-label opacity-70">
                    {href}
                  </span>
                )}
              </Link>
            );
          })}
          {profile && (
            <Link
              href="/feed"
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[14px] font-medium transition-colors",
                pathname === "/feed"
                  ? "text-foreground bg-background-subtle"
                  : "text-foreground-muted hover:text-foreground hover:bg-background-subtle"
              )}
            >
              Following
              {pathname === "/feed" && (
                <span className="font-mono text-[10px] text-foreground-subtle tracking-label opacity-70">
                  /feed
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Right: Search + actions */}
        <div className="flex items-center gap-2">
          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-foreground-subtle pointer-events-none" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search prompts…"
              className="pl-8 pr-3 h-8 w-44 text-[13px] bg-background-inset border-border focus:w-56 transition-all"
              aria-label="Search prompts"
            />
          </form>

          <ThemeToggle />

          {profile ? (
            <>
              <Button variant="default" size="sm" className="hidden md:flex h-8 gap-1" asChild>
                <Link href="/submit">
                  <Zap className="h-3.5 w-3.5" />
                  Submit
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="User menu"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage
                        src={profile.avatar_url ?? undefined}
                        alt={profile.display_name ?? profile.username}
                      />
                      <AvatarFallback className="bg-background-subtle text-foreground-muted text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 border-border-strong bg-background-subtle shadow-none"
                >
                  <DropdownMenuLabel>
                    <div className="font-medium text-[14px]">
                      {profile.display_name ?? profile.username}
                    </div>
                    <div className="label-mono mt-0.5">@{profile.username}</div>
                    {typeof profile.reputation === "number" && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-pergamum-500 text-pergamum-500" />
                        <span className="label-mono text-pergamum-400">
                          {profile.reputation} rep
                        </span>
                      </div>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/u/${profile.username}`}>Public profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Edit profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/collections">Collections</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/feed">Following feed</Link>
                  </DropdownMenuItem>
                  {profile.is_admin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="h-8 text-[13px]" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button size="sm" className="h-8 text-[13px]" asChild>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-md hover:bg-background-subtle transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search prompts…"
              className="pl-8 text-[13px] bg-background-inset"
              aria-label="Search prompts"
            />
          </form>
          <nav className="flex flex-col gap-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-md text-[14px] font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-background-subtle text-foreground"
                    : "text-foreground-muted hover:bg-background-subtle hover:text-foreground"
                )}
              >
                {label}
              </Link>
            ))}
            {profile && (
              <Link
                href="/feed"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-md text-[14px] font-medium transition-colors",
                  pathname === "/feed"
                    ? "bg-background-subtle text-foreground"
                    : "text-foreground-muted hover:bg-background-subtle hover:text-foreground"
                )}
              >
                Following
              </Link>
            )}
            {profile && (
              <Link
                href="/submit"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-[14px] font-medium text-foreground-muted hover:bg-background-subtle hover:text-foreground transition-colors"
              >
                Submit a prompt
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
