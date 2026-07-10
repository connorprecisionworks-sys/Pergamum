import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/brand/logo";
import type { Profile } from "@/lib/types/database";

interface PackFocusHeaderProps {
  profile: Profile | null;
}

// Z1 Focus header (48px): logo left, quiet Sign in / avatar on the right.
// Funnel arrivals (?via=) get this instead of the full nav — no browse
// modules, no distraction, one quiet route back to discovery via the logo.
export function PackFocusHeader({ profile }: PackFocusHeaderProps) {
  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-12 items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2" aria-label="PrmptKit home">
          <Logo size="sm" />
        </Link>
        {profile ? (
          <Link href="/dashboard" aria-label="Dashboard">
            <Avatar className="h-6 w-6">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name ?? profile.username} />
              <AvatarFallback className="bg-background-subtle text-foreground-muted text-[9px]">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link href="/auth/login" className="text-[13px] text-foreground-muted hover:text-foreground transition-colors">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
