import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const PRODUCT_LINKS = [
  { href: "/prompts",       label: "Browse"       },
  { href: "/submit",        label: "Submit"        },
  { href: "/collections",   label: "Collections"   },
  { href: "/leaderboards",  label: "Leaderboards"  },
  { href: "/badges",        label: "Badges"        },
  { href: "/tools",         label: "Tools"         },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Left: wordmark + tagline */}
          <div className="space-y-4">
            <Logo variant="full" size="sm" />
            <p className="text-[13px] text-foreground-muted leading-relaxed max-w-[220px]">
              A community archive of prompts for every AI tool.
              Discover, contribute, remix.
            </p>
          </div>

          {/* Middle: product links */}
          <div className="space-y-4">
            <span className="label-mono">Product</span>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] text-foreground-muted hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: built by */}
          <div className="space-y-4">
            <span className="label-mono">[ Built by ]</span>
            <p className="text-[13px] text-foreground-muted leading-relaxed">
              Pergamum is community-powered and free forever.
              <br />
              Built with Next.js and Supabase.
            </p>
            <p className="label-mono">
              &copy; {new Date().getFullYear()} Pergamum
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
