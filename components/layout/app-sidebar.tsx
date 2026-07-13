"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Compass,
  Flame,
  FolderOpen,
  Hammer,
  Home,
  Layers,
  Library,
  Menu,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  profile: Profile | null;
  unreadNotifications?: number;
}

/**
 * Every (app) route reaches the user from here or from the avatar menu below —
 * the shell is the only chrome these routes get, so nothing may be orphaned.
 *
 * Exception: /leaderboards and /badges are deliberately unlinked. They're
 * community-ranking surfaces from the Pergamum era that don't fit the creator↔
 * client model; the routes still resolve, but nothing navigates to them.
 */
const PRIMARY = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/prompts", label: "Browse", icon: Compass },
  { href: "/library", label: "Library", icon: Library },
  { href: "/feed", label: "Following", icon: Users },
];

const CREATE = [
  { href: "/build", label: "Build", icon: Hammer },
  { href: "/submit", label: "Submit", icon: Upload },
  { href: "/skills", label: "Skills", icon: Sparkles },
  { href: "/dashboard/packs", label: "Packs", icon: Layers },
  { href: "/collections", label: "Collections", icon: FolderOpen },
];

const CREATOR = [{ href: "/dashboard/leads", label: "Leads", icon: Flame }];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: typeof PRIMARY;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-secondary font-medium text-foreground"
                : "text-foreground-muted hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1.5 pt-5 text-[10px] font-medium uppercase tracking-[0.08em] text-foreground-subtle">
      {children}
    </div>
  );
}

export function AppSidebar({ profile, unreadNotifications = 0 }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile?.username?.slice(0, 2).toUpperCase() ?? "??";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const close = () => setOpen(false);

  const body = (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={close}
        className="flex items-center gap-2.5 px-3 py-5"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Image
            src="/logo-mark-white.png"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4"
          />
        </span>
        <span className="text-[17px] font-semibold -tracking-[0.01em] text-foreground">
          prmpt
        </span>
      </Link>

      <div className="flex-1 overflow-y-auto pb-4">
        <NavList items={PRIMARY} pathname={pathname} onNavigate={close} />
        <SectionLabel>Create</SectionLabel>
        <NavList items={CREATE} pathname={pathname} onNavigate={close} />
        {profile?.account_type === "creator" && (
          <>
            <SectionLabel>Creator</SectionLabel>
            <NavList items={CREATOR} pathname={pathname} onNavigate={close} />
          </>
        )}
      </div>

      <div className="border-t border-border pt-3">
        {profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage
                    src={profile.avatar_url ?? undefined}
                    alt={profile.display_name ?? profile.username}
                  />
                  <AvatarFallback className="bg-secondary text-[10px] text-foreground-muted">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {profile.display_name ?? profile.username}
                  </span>
                  <span className="block truncate text-xs text-foreground-subtle">
                    @{profile.username}
                  </span>
                </span>
                {unreadNotifications > 0 && (
                  <span className="ml-auto inline-flex h-4 min-w-[1rem] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm font-medium">
                  {profile.display_name ?? profile.username}
                </div>
                <div className="mt-0.5 text-xs text-foreground-subtle">
                  @{profile.username}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/notifications">
                  <Bell className="mr-2 h-3.5 w-3.5" />
                  Notifications
                  {unreadNotifications > 0 && (
                    <span className="ml-auto text-xs text-foreground-subtle">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
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
                <Link href="/dashboard/collections">My collections</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/packs">My packs</Link>
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
        ) : (
          <div className="flex flex-col gap-2 px-3 pb-1">
            <Link
              href="/auth/signup"
              onClick={close}
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/auth/login"
              onClick={close}
              className="inline-flex h-9 items-center justify-center rounded-full border border-border-strong text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger — the shell has no other nav below lg. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="fixed left-4 top-3.5 z-40 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[244px] shrink-0 border-r border-border bg-background px-3 pb-3 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={close}
          aria-label="Close navigation"
          className="absolute right-3 top-5 inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-secondary lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
        {body}
      </aside>
    </>
  );
}
