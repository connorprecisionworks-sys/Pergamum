"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import {
  completeClientOnboarding,
  skipClientOnboarding,
} from "@/app/onboarding/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/follow-button";
import type { Industry, RoleCategory } from "@/lib/types/database";
import { cn } from "@/lib/utils";

/** The mockup's chips, mapped onto the enums that already exist (0016). */
const ROLES: { label: string; value: RoleCategory }[] = [
  { label: "Founder", value: "founder_owner" },
  { label: "Marketing", value: "marketing" },
  { label: "Sales", value: "sales_bd" },
  { label: "Consultant / Coach", value: "consultant_coach" },
  { label: "Ops", value: "operations" },
  { label: "Engineering", value: "engineering_data" },
  { label: "Recruiting", value: "hr_recruiting" },
];

const INDUSTRIES: { label: string; value: Industry }[] = [
  { label: "SaaS", value: "saas_tech" },
  { label: "Agency", value: "agency_consulting" },
  { label: "E-commerce", value: "ecommerce_retail" },
  { label: "Finance", value: "finance_insurance" },
  { label: "Health", value: "health_wellness" },
];

/** Free-form: these land in user_attributes.goals[] verbatim. */
const NEEDS = [
  "More clients",
  "Cold outreach",
  "Automate a workflow",
  "Better content",
  "Close deals faster",
];

const STEPS = ["Welcome", "Your role", "Your goal"];

interface CandidatePrompt {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  tags: string[];
  authorUsername: string | null;
  fieldCount: number;
}

interface CandidateCreator {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  following: boolean;
}

interface ClientOnboardingFormProps {
  currentUserId: string;
  justUsed: { title: string; slug: string; authorUsername: string | null } | null;
  candidatePrompts: CandidatePrompt[];
  candidateCreators: CandidateCreator[];
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm transition-colors",
        selected
          ? "bg-primary font-medium text-primary-foreground"
          : "border border-border-strong text-foreground-muted hover:border-foreground hover:text-foreground",
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-6">
      {STEPS.map((label, index) => (
        <span
          key={label}
          className={cn(
            "text-[13px] transition-colors",
            index === step
              ? "font-medium text-foreground"
              : index < step
                ? "text-foreground-muted"
                : "text-foreground-subtle",
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export function ClientOnboardingForm({
  currentUserId,
  justUsed,
  candidatePrompts,
  candidateCreators,
}: ClientOnboardingFormProps) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<RoleCategory | null>(null);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [needText, setNeedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const roleLabel = ROLES.find((r) => r.value === role)?.label ?? null;
  const industryLabel = INDUSTRIES.find((i) => i.value === industry)?.label ?? null;

  const toggleGoal = (goal: string) =>
    setGoals((current) =>
      current.includes(goal) ? current.filter((g) => g !== goal) : [...current, goal],
    );

  // No demand-matching model exists yet (it lands with the real needs model —
  // see migration 0020). Until then the payoff ranks the popular-prompt pool by
  // naive keyword overlap with what the user actually told us, and falls back
  // to popularity order. Honest heuristic, not a fake "match".
  const matched = useMemo(() => {
    const terms = [...goals, needText]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((t) => t.length > 3);

    if (terms.length === 0) return candidatePrompts.slice(0, 3);

    const score = (p: CandidatePrompt) => {
      const haystack = [p.title, p.description ?? "", ...p.tags].join(" ").toLowerCase();
      return terms.reduce((n, term) => (haystack.includes(term) ? n + 1 : n), 0);
    };

    return [...candidatePrompts]
      .map((p) => ({ p, s: score(p) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((x) => x.p);
  }, [candidatePrompts, goals, needText]);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await completeClientOnboarding({
        roleCategory: role,
        industry,
        goals,
        needText: needText.trim() || null,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setStep(3);
    });
  };

  return (
    <div className="min-h-screen bg-background-inset px-5 py-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-[560px]">
        {/* Chrome — wordmark + stepper. No sidebar: this runs before the app. */}
        <div className="mb-8 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Image src="/logo-mark-white.png" alt="" width={16} height={16} className="h-4 w-4" />
            </span>
            <span className="text-[17px] font-semibold -tracking-[0.01em]">prmpt</span>
          </span>
          {step < 3 && <Stepper step={step} />}
        </div>

        <div className="rounded-[20px] bg-card p-7 shadow-[0_12px_34px_rgba(28,30,40,0.10)] md:p-9">
          {/* ── Welcome — value already in hand ───────────────────────── */}
          {step === 0 && (
            <div>
              <h1 className="m-0 mb-2.5 text-[32px] font-normal leading-[1.05] -tracking-[0.02em]">
                Your toolbox
              </h1>
              <p className="m-0 mb-7 text-[15px] leading-[1.55] text-foreground-muted">
                Everything you save lands here. We&rsquo;ve kept the one you just used.
              </p>

              {justUsed ? (
                <div className="mb-8 rounded-2xl border border-border p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-foreground-subtle">
                      Saved just now
                    </span>
                  </div>
                  <div className="text-[19px] font-medium leading-tight">{justUsed.title}</div>
                  {justUsed.authorUsername && (
                    <div className="mt-2 text-[13px] text-foreground-subtle">
                      @{justUsed.authorUsername}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-8 rounded-2xl border border-dashed border-border-strong p-5 text-[15px] text-foreground-muted">
                  Nothing saved yet — anything you use will land here.
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(1)}
                className="mb-3 flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continue
              </button>
              <form action={skipClientOnboarding}>
                <button
                  type="submit"
                  className="h-9 w-full text-[13px] text-foreground-subtle transition-colors hover:text-foreground"
                >
                  Skip for now
                </button>
              </form>
            </div>
          )}

          {/* ── Step 1 · You ──────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className="m-0 mb-2 text-[28px] font-normal leading-[1.1] -tracking-[0.02em]">
                    What do you do?
                  </h1>
                  <p className="m-0 text-[15px] leading-[1.55] text-foreground-muted">
                    So your prompts show up tuned to you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="shrink-0 text-[13px] text-foreground-subtle transition-colors hover:text-foreground"
                >
                  Skip
                </button>
              </div>

              <div className="mb-6">
                <div className="mb-3 text-[13px] text-foreground-muted">Your role</div>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <Chip
                      key={r.value}
                      label={r.label}
                      selected={role === r.value}
                      onClick={() => setRole(role === r.value ? null : r.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <div className="mb-3 text-[13px] text-foreground-muted">Your industry</div>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((i) => (
                    <Chip
                      key={i.value}
                      label={i.label}
                      selected={industry === i.value}
                      onClick={() => setIndustry(industry === i.value ? null : i.value)}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Step 2 · Goal ─────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className="m-0 mb-2 text-[28px] font-normal leading-[1.1] -tracking-[0.02em]">
                    What do you need help with right now?
                  </h1>
                  <p className="m-0 text-[15px] leading-[1.55] text-foreground-muted">
                    So we point you to the right prompts and the right people.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className="shrink-0 text-[13px] text-foreground-subtle transition-colors hover:text-foreground"
                >
                  Skip
                </button>
              </div>

              <div className="mb-7 flex flex-wrap gap-2">
                {NEEDS.map((need) => (
                  <Chip
                    key={need}
                    label={need}
                    selected={goals.includes(need)}
                    onClick={() => toggleGoal(need)}
                  />
                ))}
              </div>

              <div className="mb-8">
                <label
                  htmlFor="need-text"
                  className="mb-2.5 block text-[13px] text-foreground-muted"
                >
                  Or in your words
                </label>
                <input
                  id="need-text"
                  value={needText}
                  onChange={(e) => setNeedText(e.target.value)}
                  placeholder="e.g. &ldquo;book more discovery calls from LinkedIn&rdquo;"
                  maxLength={200}
                  className="h-12 w-full rounded-xl border border-border-strong bg-background px-4 text-[15px] outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {error && (
                <p className="mb-4 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                See what fits
              </button>
            </div>
          )}

          {/* ── Payoff ────────────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              {goals[0] && (
                <div className="mb-2 text-[13px] text-foreground-muted">
                  For &ldquo;{goals[0].toLowerCase()}&rdquo;
                </div>
              )}
              <h1 className="m-0 mb-5 text-[32px] font-normal leading-[1.05] -tracking-[0.02em]">
                Here&rsquo;s where to start
              </h1>

              {(roleLabel || industryLabel || goals.length > 0) && (
                <div className="mb-8 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-foreground-subtle">Matched to</span>
                  {[roleLabel, industryLabel, ...goals].filter(Boolean).map((token) => (
                    <span
                      key={token as string}
                      className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-xs text-foreground-muted"
                    >
                      <Check className="h-3 w-3" />
                      {token}
                    </span>
                  ))}
                </div>
              )}

              {matched.length > 0 && (
                <div className="mb-8">
                  <div className="mb-4 border-b border-border pb-2.5 text-[13px] text-foreground-muted">
                    Prompts &amp; packs
                  </div>
                  <div className="flex flex-col gap-4">
                    {matched.map((p) => (
                      <Link key={p.id} href={`/prompts/${p.slug}`} className="block">
                        <div className="text-[15px] font-medium leading-tight">{p.title}</div>
                        <div className="mt-1 text-[12.5px] text-foreground-subtle">
                          {p.authorUsername ? `@${p.authorUsername}` : "prmpt"} · single
                          {p.fieldCount > 0 && ` · ${p.fieldCount} field${p.fieldCount === 1 ? "" : "s"}`}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {candidateCreators.length > 0 && (
                <div className="mb-8">
                  <div className="mb-4 border-b border-border pb-2.5 text-[13px] text-foreground-muted">
                    Creators who can help
                  </div>
                  <div className="flex flex-col gap-4">
                    {candidateCreators.slice(0, 2).map((c) => {
                      const initials = (c.displayName ?? c.username).slice(0, 2).toUpperCase();
                      return (
                        <div key={c.id} className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={c.avatarUrl ?? undefined} alt={c.displayName ?? c.username} />
                            <AvatarFallback className="bg-secondary text-[11px] text-foreground-muted">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/u/${c.username}`}
                              className="block truncate text-sm font-medium"
                            >
                              {c.displayName ?? c.username}
                            </Link>
                            {c.bio && (
                              <div className="mt-0.5 truncate text-[12.5px] text-foreground-subtle">
                                {c.bio}
                              </div>
                            )}
                          </div>
                          <FollowButton
                            targetUserId={c.id}
                            currentUserId={currentUserId}
                            initiallyFollowing={c.following}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Link
                href="/library"
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Go to my toolbox
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
