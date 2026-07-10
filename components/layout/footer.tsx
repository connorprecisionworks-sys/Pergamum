import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const PRODUCT_LINKS = [
  { href: "/prompts",       label: "Browse"       },
  { href: "/submit",        label: "Submit"        },
  { href: "/collections",   label: "Collections"   },
  { href: "/badges",        label: "Badges"        },
  { href: "/tools",         label: "Tools"         },
];

const COMMUNITY_LINKS = [
  { href: "/leaderboards",  label: "Leaderboards"  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Left: wordmark + tagline */}
          <div className="space-y-4">
            <Logo variant="full" size="sm" />
            <p className="text-[13px] text-foreground-muted leading-relaxed max-w-[220px]">
              Publish prompts as a product, not a screenshot.
            </p>
          </div>

          {/* Product links */}
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

          {/* Community links */}
          <div className="space-y-4">
            <span className="label-mono">Community</span>
            <ul className="space-y-2">
              {COMMUNITY_LINKS.map(({ href, label }) => (
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
              Built by a solo indie shop. Free to browse, copy, and save.
            </p>
          </div>
        </div>

        {/* Legal row — thin and quiet at the bottom */}
        <div className="mt-12 pt-6 border-t border-border/60 flex items-center justify-between gap-4 flex-wrap">
          <span className="label-mono">
            &copy; {new Date().getFullYear()} Prmpt
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/about"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="/the-science"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors"
            >
              Research
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <a
              href="mailto:connor.precisionworks@gmail.com"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
