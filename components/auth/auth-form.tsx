"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { postAuthDestination } from "@/lib/supabase/post-auth-redirect";
import { track } from "@/lib/analytics";

interface AuthFormProps {
  mode: "login" | "signup";
  /** Relative path to return to after auth completes, e.g. a prompt page. */
  returnTo?: string;
  /** Lead with the Google button instead of the email form — for contexts where OAuth is the primary path (e.g. a follower-unlock dialog). */
  oauthFirst?: boolean;
}

const APPLE_ENABLED = process.env.NEXT_PUBLIC_APPLE_ENABLED === "true";

function redirectUrl(path: string, returnTo?: string): string {
  const url = new URL(path, window.location.origin);
  if (returnTo) url.searchParams.set("next", returnTo);
  return url.toString();
}

export function AuthForm({ mode, returnTo, oauthFirst }: AuthFormProps) {
  return mode === "signup" ? (
    <SignupForm returnTo={returnTo} oauthFirst={oauthFirst} />
  ) : (
    <LoginForm returnTo={returnTo} oauthFirst={oauthFirst} />
  );
}

function useOAuth(mode: "login" | "signup", returnTo?: string) {
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const supabase = createClient();

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthLoading(provider);
    if (mode === "signup") track("signup_started");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl("/auth/callback", returnTo) },
    });
    if (error) {
      toast.error(error.message);
      setOauthLoading(null);
    }
    // On success the browser navigates away to the provider — nothing else to do here.
  };

  return { oauthLoading, handleOAuth };
}

function OAuthButtons({
  oauthLoading,
  onSelect,
}: {
  oauthLoading: "google" | "apple" | null;
  onSelect: (provider: "google" | "apple") => void;
}) {
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => onSelect("google")}
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
          onClick={() => onSelect("apple")}
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
  );
}

function Divider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <Separator />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">or</span>
      </div>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm({ returnTo, oauthFirst }: { returnTo?: string; oauthFirst?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const supabase = createClient();
  const { oauthLoading, handleOAuth } = useOAuth("login", returnTo);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }
    const dest = await postAuthDestination(supabase, returnTo);
    window.location.assign(dest);
  };

  const handleForgotPassword = async () => {
    const valid = await trigger("email");
    if (!valid) return;

    setFormError(null);
    setResetSent(false);
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(getValues("email"), {
      redirectTo: redirectUrl("/auth/update-password", returnTo),
    });
    setResetLoading(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setResetSent(true);
  };

  const form = (
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

      <div className="space-y-2">
        <Label htmlFor="password" className="sr-only">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
        >
          {resetLoading ? "Sending…" : "Forgot password?"}
        </button>
      </div>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      {resetSent && (
        <p className="text-sm text-muted-foreground">
          Check your email for a link to reset your password.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Log in
      </Button>
    </form>
  );

  const oauth = <OAuthButtons oauthLoading={oauthLoading} onSelect={handleOAuth} />;

  return (
    <div className="space-y-6">
      {oauthFirst ? (
        <>
          {oauth}
          <Divider />
          {form}
        </>
      ) : (
        <>
          {form}
          <Divider />
          {oauth}
        </>
      )}
    </div>
  );
}

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

function SignupForm({ returnTo, oauthFirst }: { returnTo?: string; oauthFirst?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const supabase = createClient();
  const { oauthLoading, handleOAuth } = useOAuth("signup", returnTo);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupValues) => {
    setFormError(null);
    setLoading(true);
    track("signup_started");
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { emailRedirectTo: redirectUrl("/auth/callback", returnTo) },
    });
    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }
    track("signup_completed");
    if (data.session) {
      const dest = await postAuthDestination(supabase, returnTo);
      window.location.assign(dest);
    } else {
      // Project has email confirmation enabled — no session until they click the link.
      setConfirmSent(true);
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <div className="text-center space-y-2 py-4">
        <p className="text-sm text-muted-foreground">
          Check your email to confirm your account.
        </p>
      </div>
    );
  }

  const form = (
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

      <div className="space-y-2">
        <Label htmlFor="password" className="sr-only">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="sr-only">
          Confirm password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Create account
      </Button>
    </form>
  );

  const oauth = <OAuthButtons oauthLoading={oauthLoading} onSelect={handleOAuth} />;

  return (
    <div className="space-y-6">
      {oauthFirst ? (
        <>
          {oauth}
          <Divider />
          {form}
        </>
      ) : (
        <>
          {form}
          <Divider />
          {oauth}
        </>
      )}
    </div>
  );
}
