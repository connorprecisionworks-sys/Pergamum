"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { readPendingClaim } from "@/lib/anon-claim";
import { chooseAccountType } from "@/app/welcome/actions";

interface WelcomePickerProps {
  next?: string;
}

function withNext(path: string, next?: string): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

export function WelcomePicker({ next }: WelcomePickerProps) {
  const router = useRouter();
  const [checkingClaim, setCheckingClaim] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const claim = readPendingClaim();
    if (claim) {
      // A claimer is a client by default and never sees the picker. This
      // does NOT clear the claim — ClaimReconciler still needs to read it
      // once we're inside (app) to actually attach the run/preset/follow;
      // this effect only decides the account lane.
      chooseAccountType("client")
        .then(() => router.replace(withNext("/onboarding", next)))
        .catch(() => setError("Something went wrong. Try again."));
      return;
    }
    setCheckingClaim(false);
  }, [router, next]);

  const pick = (accountType: "client" | "creator") => {
    setPending(true);
    setError(null);
    chooseAccountType(accountType)
      .then((result) => {
        if (result?.error) {
          setError(result.error);
          setPending(false);
          return;
        }
        router.replace(
          withNext(accountType === "creator" ? "/creator/onboarding" : "/onboarding", next)
        );
      })
      .catch(() => {
        setError("Something went wrong. Try again.");
        setPending(false);
      });
  };

  if (checkingClaim) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-inset">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-subtle" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-inset px-5 py-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-[560px]">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Image src="/logo-mark-white.png" alt="" width={16} height={16} className="h-4 w-4" />
          </span>
          <span className="text-[17px] font-semibold -tracking-[0.01em]">prmpt</span>
        </div>

        <div className="rounded-[20px] bg-card p-7 shadow-[0_12px_34px_rgba(28,30,40,0.10)] md:p-9">
          <h1 className="m-0 mb-2.5 text-[32px] font-normal leading-[1.05] -tracking-[0.02em]">
            What brings you here?
          </h1>
          <p className="m-0 mb-8 text-[15px] leading-[1.55] text-foreground-muted">
            This decides what you see first — you can change it later in settings.
          </p>

          {error && (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => pick("creator")}
              disabled={pending}
              className="rounded-2xl border border-border-strong p-5 text-left transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="text-[17px] font-medium">I&rsquo;m here to get clients</div>
              <div className="mt-1 text-[13px] text-foreground-muted">
                Ship prompts, drop a pack, and get alerted the moment a lead goes hot.
              </div>
            </button>

            <button
              type="button"
              onClick={() => pick("client")}
              disabled={pending}
              className="rounded-2xl border border-border-strong p-5 text-left transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="text-[17px] font-medium">I&rsquo;m here to use prompts</div>
              <div className="mt-1 text-[13px] text-foreground-muted">
                Save prompts to your toolbox and get updates from creators you follow.
              </div>
            </button>
          </div>

          {pending && (
            <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-foreground-subtle">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Setting things up…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
