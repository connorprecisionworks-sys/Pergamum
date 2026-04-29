"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { completeOnboarding, skipOnboarding } from "./actions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

interface OnboardingFormProps {
  profile: Profile;
}

const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

export function OnboardingForm({ profile }: OnboardingFormProps) {
  const [step, setStep] = useState(0);
  // Don't pre-fill the display name with an email-shaped string — Supabase's
  // signup trigger sometimes drops the user's email into display_name as a
  // fallback. If it's email-shaped, blank the field so the user types fresh.
  const initialDisplayName =
    profile.display_name && !/[@\s]/.test(profile.display_name)
      ? profile.display_name
      : "";
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(
    /[@.]/.test(profile.username) ? "" : profile.username
  );
  const [bio, setBio] = useState(profile.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // The full name (preserving spaces) for the live "Welcome, X." heading.
  // Empty out anything that looks like an email or URL so the heading never reads weird.
  const greetingName = useMemo(() => {
    const raw = displayName.trim();
    if (!raw) return "";
    if (/[@/]/.test(raw)) return "";
    return raw;
  }, [displayName]);

  // Auto-focus the input each time the step changes
  useEffect(() => {
    if (step === 2) textareaRef.current?.focus();
    else inputRef.current?.focus();
  }, [step]);

  // Validation per step
  const stepValid = useMemo(() => {
    if (step === 0) {
      const v = displayName.trim();
      return v.length >= 2 && v.length <= 60;
    }
    if (step === 1) {
      const v = username.trim();
      return v.length >= 3 && v.length <= 30 && USERNAME_RE.test(v);
    }
    return true; // bio is optional
  }, [step, displayName, username]);

  function handleNext() {
    if (!stepValid || pending) return;
    setError(null);
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    submit();
  }

  function handleBack() {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("display_name", displayName.trim());
      fd.set("username", username.trim());
      fd.set("bio", bio.trim());
      const result = await completeOnboarding({}, fd);
      if (result?.error) setError(result.error);
      // success → server redirects to /submit
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // Enter advances on input fields. On bio (textarea), Cmd/Ctrl+Enter submits;
    // plain Enter inserts a newline.
    if (e.key === "Enter") {
      const isTextarea = e.currentTarget.tagName === "TEXTAREA";
      if (!isTextarea || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleNext();
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-8 md:px-16 py-12 md:py-16">
      {/* Brand mark — top-left */}
      <header className="flex items-start">
        <div className="flex flex-col gap-1">
          <span className="font-serif text-2xl font-medium text-primary leading-none">P</span>
          <span className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground">
            Pergamum onboarding
          </span>
        </div>
      </header>

      {/* Center: question + input */}
      <main className="flex-1 flex flex-col justify-center max-w-3xl w-full mx-auto py-12">
        {/* Step 0 — Display name (live "Welcome, [name].") */}
        {step === 0 && (
          <div className="space-y-10 md:space-y-12">
            <div className="space-y-3">
              <h1 className="font-serif font-normal text-foreground text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.05] tracking-[-0.025em]">
                Welcome
                <span
                  className={cn(
                    "inline-block transition-all duration-200",
                    greetingName ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                  )}
                >
                  {greetingName ? <>, <span className="text-primary">{greetingName}</span></> : null}
                </span>
                <span>.</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                What should we call you?
              </p>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Your name"
              minLength={2}
              maxLength={60}
              autoComplete="name"
              spellCheck={false}
              aria-label="Display name"
              className="w-full bg-transparent border-0 border-b border-border/80 focus:border-primary outline-none px-4 md:px-5 py-4 text-2xl md:text-4xl font-serif placeholder:text-muted-foreground/40 transition-colors"
            />
          </div>
        )}

        {/* Step 1 — Username */}
        {step === 1 && (
          <div className="space-y-10 md:space-y-12">
            <div className="space-y-3">
              <h1 className="font-serif font-normal text-foreground text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.05] tracking-[-0.025em]">
                Pick a handle.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Your public URL — letters, numbers, dashes, underscores.
              </p>
            </div>

            <div className="flex items-baseline gap-3 border-b border-border/80 focus-within:border-primary transition-colors px-4 md:px-5">
              <span className="text-2xl md:text-4xl font-serif text-muted-foreground/60 select-none">
                pergamum.net/u/
              </span>
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="yourname"
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_\-]+"
                autoComplete="username"
                spellCheck={false}
                aria-label="Username"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none py-4 text-2xl md:text-4xl font-serif placeholder:text-muted-foreground/40 focus:ring-0"
              />
            </div>

            {username.trim().length > 0 && !stepValid && (
              <p className="text-sm text-destructive">
                Use 3–30 characters. Letters, numbers, dashes, and underscores only.
              </p>
            )}
          </div>
        )}

        {/* Step 2 — Bio (optional) */}
        {step === 2 && (
          <div className="space-y-10 md:space-y-12">
            <div className="space-y-3">
              <h1 className="font-serif font-normal text-foreground text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.05] tracking-[-0.025em]">
                Tell people who you are.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Optional. A sentence or two — what you do, what kinds of prompts you write.
              </p>
            </div>

            <textarea
              ref={textareaRef}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="A consultant who lives in prompts. I write a lot of extraction and summarisation flows."
              maxLength={300}
              rows={4}
              spellCheck={true}
              aria-label="Bio"
              className="w-full bg-transparent border border-border/80 rounded-lg focus:border-primary outline-none px-5 py-4 text-lg md:text-xl placeholder:text-muted-foreground/40 transition-colors resize-none"
            />

            <p className="text-xs text-muted-foreground">
              {bio.length} / 300 &nbsp;·&nbsp; press <kbd className="px-1.5 py-0.5 rounded border border-border text-[11px]">⌘</kbd>+<kbd className="px-1.5 py-0.5 rounded border border-border text-[11px]">↵</kbd> to finish
            </p>
          </div>
        )}

        {error && (
          <p className="mt-8 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </main>

      {/* Bottom nav */}
      <footer className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0 || pending}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground self-start"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back
          </button>
          <span className="text-xs text-muted-foreground/70">
            Press <kbd className="px-1.5 py-0.5 rounded border border-border text-[11px]">↵</kbd> to continue
          </span>
        </div>

        <span className="text-sm text-muted-foreground tabular-nums">
          {step + 1} of 3
        </span>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleNext}
            disabled={!stepValid || pending}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-6 h-11 text-sm font-medium transition-all",
              stepValid && !pending
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {step === 2 ? (pending ? "Finishing…" : "Finish") : "Continue"}
            {!pending && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
          {step === 2 && !pending && (
            <form action={skipOnboarding}>
              <button
                type="submit"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip and finish
              </button>
            </form>
          )}
        </div>
      </footer>
    </div>
  );
}
