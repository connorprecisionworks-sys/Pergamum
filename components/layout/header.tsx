"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, BookOpen, Menu, X, Zap } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";

interface HeaderProps {
  profile: Profile | null;
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5 text-violet-600" />
          <span className="text-lg tracking-tight">Pergamum</span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/prompts">Browse</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tools">Tools</Link>
          </Button>
          {profile && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/submit">Submit</Link>
            </Button>
          )}
        </nav>

        {/* Search — desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-sm items-center relative"
        >
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search prompts…"
            className="pl-9 pr-4"
            aria-label="Search prompts"
          />
        </form>

        <div className="flex-1 md:hidden" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <Button
                variant="default"
                size="sm"
                className="hidden md:flex bg-violet-600 hover:bg-violet-700"
                asChild
              >
                <Link href="/submit">
                  <Zap className="h-4 w-4 mr-1" />
                  Submit
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="User menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile.avatar_url ?? undefined}
                        alt={profile.display_name ?? profile.username}
                      />
                      <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium">
                      {profile.display_name ?? profile.username}
                    </div>
                    <div className="text-xs text-muted-foreground font-normal">
                      @{profile.username}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/u/${profile.username}`}>Public profile</Link>
                  </DropdownMenuItem>
                  {profile.is_admin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
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
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700"
                asChild
              >
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search prompts…"
              className="pl-9"
              aria-label="Search prompts"
            />
          </form>
          <nav className="flex flex-col gap-1">
            <Button
              variant="ghost"
              className="justify-start"
              asChild
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/prompts">Browse Prompts</Link>
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              asChild
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/tools">AI Tools</Link>
            </Button>
            {profile && (
              <Button
                variant="ghost"
                className="justify-start"
                asChild
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/submit">Submit a Prompt</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
