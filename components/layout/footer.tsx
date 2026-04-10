import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-4 w-4 text-violet-600" />
              <span>Pergamum</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A free, community-driven library of high-quality AI prompts.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/prompts" className="hover:text-foreground transition-colors">
                  Browse prompts
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-foreground transition-colors">
                  AI tools directory
                </Link>
              </li>
              <li>
                <Link href="/prompts?sort=trending" className="hover:text-foreground transition-colors">
                  Trending
                </Link>
              </li>
              <li>
                <Link href="/prompts?sort=newest" className="hover:text-foreground transition-colors">
                  Newest
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Contribute</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/submit" className="hover:text-foreground transition-colors">
                  Submit a prompt
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-foreground transition-colors">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Categories</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/prompts?category=coding" className="hover:text-foreground transition-colors">
                  Coding
                </Link>
              </li>
              <li>
                <Link href="/prompts?category=writing" className="hover:text-foreground transition-colors">
                  Writing
                </Link>
              </li>
              <li>
                <Link href="/prompts?category=marketing" className="hover:text-foreground transition-colors">
                  Marketing
                </Link>
              </li>
              <li>
                <Link href="/prompts?category=research" className="hover:text-foreground transition-colors">
                  Research
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Pergamum. Community-powered, forever free.</p>
          <p>
            Built with Next.js, Supabase, and{" "}
            <span className="text-violet-600">♥</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
