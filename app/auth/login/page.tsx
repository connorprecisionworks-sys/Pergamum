import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//")
    ? searchParams.next
    : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex justify-center">
            <Logo variant="full" size="md" />
          </Link>
          <h1 className="text-2xl font-medium tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Pick up where you left off.
          </p>
        </div>

        <AuthForm mode="login" returnTo={next} />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={next ? `/auth/signup?next=${encodeURIComponent(next)}` : "/auth/signup"}
            className="text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-400 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
