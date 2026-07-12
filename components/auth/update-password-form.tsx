"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { postAuthDestination } from "@/lib/supabase/post-auth-redirect";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

interface UpdatePasswordFormProps {
  code?: string;
  returnTo?: string;
}

export function UpdatePasswordForm({ code, returnTo }: UpdatePasswordFormProps) {
  const [status, setStatus] = useState<"exchanging" | "ready" | "invalid">(
    code ? "exchanging" : "invalid"
  );
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!code) return;
    const client = createClient();
    client.auth.exchangeCodeForSession(code).then(({ error }) => {
      setStatus(error ? "invalid" : "ready");
    });
  }, [code]);

  const onSubmit = async (values: Values) => {
    setFormError(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }
    const dest = await postAuthDestination(supabase, returnTo);
    router.push(dest);
    router.refresh();
  };

  if (status === "invalid") {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-sm text-muted-foreground">
          This reset link is invalid or has expired.
        </p>
        <Link
          href="/auth/login"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-400 font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (status === "exchanging") {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password" className="sr-only">
          New password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="New password"
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
          Confirm new password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm new password"
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
        Update password
      </Button>
    </form>
  );
}
