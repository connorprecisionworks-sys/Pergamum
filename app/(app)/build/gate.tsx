"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitAccessCode } from "./gate-actions";

// The gate the user sees on /build when they don't (yet) have access.
// One input, one submit. Nothing fancy — match PrmptKit's editorial calm.
export function BuildGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Enter your access code.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await submitAccessCode(code);
      if (!r.success) {
        setError(r.error ?? "Couldn't validate that code.");
        return;
      }
      toast.success("You're in.");
      router.refresh();
    });
  };

  return (
    <div className="max-w-[460px] mx-auto px-6 py-16 md:py-24">
      <div className="rounded-2xl border border-border/60 bg-card p-7 md:p-8 space-y-6 text-center">
        <div className="inline-flex items-center justify-center h-11 w-11 mx-auto rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground font-medium">
            Builder · Private beta
          </p>
          <h1 className="font-serif text-2xl md:text-[28px] font-normal leading-[1.15] tracking-[-0.01em]">
            Enter your access code.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The prompt builder is in private beta while we tune it. If you have
            an access code, drop it below.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-left">
          <Input
            id="access-code"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Access code"
            className="h-11 text-[15px] font-mono"
            aria-invalid={!!error}
            aria-describedby={error ? "code-error" : undefined}
            disabled={pending}
          />
          {error && (
            <p id="code-error" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full h-11 gap-1.5">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {pending ? "Checking…" : "Unlock builder"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border/60">
          Don&apos;t have a code yet?{" "}
          <a
            href="mailto:hello@prmptkit.com?subject=Builder%20beta%20access"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            Request access
          </a>
          .
        </p>
      </div>
    </div>
  );
}
