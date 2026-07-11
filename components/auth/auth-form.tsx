"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface AuthFormProps {
  mode: "login" | "signup";
  /** Relative path to return to after auth completes, e.g. a prompt page. */
  returnTo?: string;
}

const APPLE_ENABLED = process.env.NEXT_PUBLIC_APPLE_ENABLED === "true";

function callbackUrl(returnTo?: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  if (returnTo) url.searchParams.set("next", returnTo);
  return url.toString();
}

export function AuthForm({ mode, returnTo }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const supabase = createClient();

  const onSubmit = async (values: EmailFormValues) => {
    setLoading(true);
    if (mode === "signup") track("signup_started");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: { emailRedirectTo: callbackUrl(returnTo) },
      });
      if (error) throw error;
      if (mode === "signup") track("signup_completed");
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    if (mode === "signup") track("signup_started");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl(returnTo) },
    });
    if (error) {
      toast.error(error.message);
      setOauthLoading(null);
    }
    // On success the browser navigates away to the provider — nothing else to do here.
  };

  if (sent) {
    return (
      <div className="text-center space-y-2 py-4">
        <Mail className="h-8 w-8 mx-auto text-brand-500" />
        <p className="text-sm text-muted-foreground">
          Check your email for a link to finish signing in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Magic link — primary path */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="sr-only">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {mode === "signup" ? "Set up your account" : "Email me a sign-in link"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* OAuth */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleOAuth("google")}
          disabled={oauthLoading !== null}
        >
          {oauthLoading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span className="ml-2">Continue with Google</span>
        </Button>

        {APPLE_ENABLED && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuth("apple")}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === "apple" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.365 1.43c0 1.14-.462 2.243-1.21 3.05-.83.897-2.18 1.586-3.29 1.497-.148-1.11.42-2.27 1.17-3.02.83-.86 2.24-1.51 3.33-1.527zM20.72 17.11c-.51 1.18-.76 1.71-1.42 2.75-.92 1.44-2.22 3.24-3.83 3.25-1.43.017-1.8-.94-3.75-.93-1.95.01-2.36.94-3.79.93-1.62-.02-2.85-1.63-3.77-3.07-2.59-4.04-2.86-8.78-1.26-11.3.98-1.55 2.53-2.46 3.99-2.46 1.5 0 2.44.94 3.68.94 1.2 0 1.94-.94 3.68-.94 1.3 0 2.68.71 3.66 1.94-3.22 1.76-2.7 6.35.72 7.9z" />
              </svg>
            )}
            <span className="ml-2">Continue with Apple</span>
          </Button>
        )}
      </div>
    </div>
  );
}
