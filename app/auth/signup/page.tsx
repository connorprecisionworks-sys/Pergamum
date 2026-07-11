import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create account",
};

const VALUE_PROPS = [
  "Save any prompt to your toolbox",
  "Get creators’ updates automatically",
  "Your inputs remembered, ready to reuse",
];

export default function SignupPage({
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
          <h1 className="text-2xl font-medium tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Keep the prompts you use, and the updates that follow.
          </p>
        </div>

        <ul className="space-y-2">
          {VALUE_PROPS.map((prop) => (
            <li key={prop} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
              {prop}
            </li>
          ))}
        </ul>

        <AuthForm mode="signup" returnTo={next} />

        <p className="text-center text-sm text-muted-foreground">
          We&apos;ll email you a secure sign-in link.
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login"}
            className="text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-400 font-medium"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our terms of use and privacy
          policy.
        </p>
      </div>
    </div>
  );
}
