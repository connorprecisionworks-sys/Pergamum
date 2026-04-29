"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeOnboarding, skipOnboarding } from "./actions";
import type { Profile } from "@/lib/types/database";

interface OnboardingFormProps {
  profile: Profile;
}

const initialState: { error?: string } = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {pending ? "Saving…" : "Let's go"}
    </Button>
  );
}

export function OnboardingForm({ profile }: OnboardingFormProps) {
  const [state, action] = useFormState(completeOnboarding, initialState);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");

  // First word of the typed name (so "Connor Dore" greets as "Connor").
  const firstName = displayName.trim().split(/\s+/)[0] ?? "";

  return (
    <div className="space-y-6">
      {/* Live welcome — fills in as the user types their name */}
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-tight leading-tight">
          Welcome
          <span
            className={
              "inline-block transition-all duration-200 " +
              (firstName ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1")
            }
            aria-live="polite"
          >
            {firstName ? <>, <span className="text-primary">{firstName}</span></> : null}
          </span>
          <span>.</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          A few quick details and you&apos;re ready to start contributing.
        </p>
      </div>

      <form action={action} className="space-y-6">
        {state?.error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="display_name">
            Display name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="display_name"
            name="display_name"
            placeholder="e.g. Alex Chen"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={60}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            This is how your name appears across the site.
          </p>
        </div>

      <div className="space-y-2">
        <Label htmlFor="username">
          Username <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center">
          <span className="px-3 h-9 flex items-center border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
            @
          </span>
          <Input
            id="username"
            name="username"
            placeholder="yourname"
            defaultValue={profile.username}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_\-]+"
            className="rounded-l-none"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Your @handle for your public profile — you can change it later.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Tell the community a little about yourself…"
          defaultValue={profile.bio ?? ""}
          rows={3}
          maxLength={300}
        />
        <p className="text-xs text-muted-foreground">Optional. A sentence or two helps others know who you are.</p>
      </div>

        <SubmitButton />
      </form>

      {/* Skip — kept as a separate form to avoid nesting <form>s, which is invalid HTML. */}
      <form action={skipOnboarding}>
        <button
          type="submit"
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Skip for now
        </button>
      </form>
    </div>
  );
}
