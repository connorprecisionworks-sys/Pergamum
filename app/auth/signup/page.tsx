import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create account",
};

const VALUE_PROPS = [
  "Free forever — no paywalls, no credits",
  "Vote on the prompts that actually work",
  "Build a personal library you can come back to",
];

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex justify-center">
            <Logo variant="full" size="md" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Join the library — submit, vote, and save prompts.
          </p>
        </div>

        <ul className="space-y-2">
          {VALUE_PROPS.map((prop) => (
            <li key={prop} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-pergamum-500 shrink-0 mt-0.5" />
              {prop}
            </li>
          ))}
        </ul>

        <AuthForm mode="signup" />

        <p className="text-center text-sm text-muted-foreground">
          We&apos;ll send a confirmation email. Click the link and you&apos;re in.
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-pergamum-600 hover:text-pergamum-700 font-medium"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our community guidelines and
          terms of use.
        </p>
      </div>
    </div>
  );
}
