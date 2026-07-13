"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2 } from "lucide-react";

import {
  saveOfferHeadline,
  saveOfferSlot,
  saveAlertSettings,
  completeCreatorOnboarding,
} from "@/app/creator/onboarding/actions";
import { cn, normalizeUrl } from "@/lib/utils";

const OFFER_TYPES = [
  "1:1 consulting",
  "Cohort / group",
  "Retainer",
  "Done-for-you",
  "Course",
  "Other",
];

const STEPS = ["Offer", "First pack", "Offer slot", "Alerts", "Share"];

interface OfferSlotInitial {
  label: string;
  url: string;
  description: string | null;
}

interface AlertSettingsInitial {
  hotThreshold: number;
  inApp: boolean;
  email: boolean;
  emailMode: string;
}

interface CreatorOnboardingFormProps {
  username: string;
  initialStep: number;
  initialOfferHeadline: string | null;
  hasPublishedPack: boolean;
  publishedPackSlug: string | null;
  initialOfferSlot: OfferSlotInitial | null;
  initialAlertSettings: AlertSettingsInitial | null;
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm transition-colors",
        selected
          ? "bg-primary font-medium text-primary-foreground"
          : "border border-border-strong text-foreground-muted hover:border-foreground hover:text-foreground"
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
      {STEPS.map((label, index) => (
        <span
          key={label}
          className={cn(
            "text-[13px] transition-colors",
            index === step
              ? "font-medium text-foreground"
              : index < step
                ? "text-foreground-muted"
                : "text-foreground-subtle"
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function Header({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <span className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Image src="/logo-mark-white.png" alt="" width={16} height={16} className="h-4 w-4" />
        </span>
        <span className="text-[17px] font-semibold -tracking-[0.01em]">prmpt</span>
      </span>
      <Stepper step={step} />
    </div>
  );
}

function ContinueButton({
  onClick,
  pending,
  disabled,
  children = "Continue",
}: {
  onClick: () => void;
  pending: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function CreatorOnboardingForm({
  username,
  initialStep,
  initialOfferHeadline,
  hasPublishedPack,
  publishedPackSlug,
  initialOfferSlot,
  initialAlertSettings,
}: CreatorOnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(initialStep, STEPS.length - 1));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [offerHeadline, setOfferHeadline] = useState(initialOfferHeadline ?? "");
  const [offerType, setOfferType] = useState<string | null>(null);

  const [offerLabel, setOfferLabel] = useState(initialOfferSlot?.label ?? "Book a free strategy call");
  const [offerUrl, setOfferUrl] = useState(initialOfferSlot?.url ?? "");
  const [offerUrlTouched, setOfferUrlTouched] = useState(false);
  const [offerDescription, setOfferDescription] = useState(initialOfferSlot?.description ?? "");
  const offerUrlValid = !offerUrl.trim() || !!normalizeUrl(offerUrl);
  const offerUrlError = offerUrlTouched && !offerUrlValid ? "That link doesn't look like a valid URL." : null;

  const [hotThreshold, setHotThreshold] = useState(initialAlertSettings?.hotThreshold ?? 50);
  const [inApp, setInApp] = useState(initialAlertSettings?.inApp ?? true);
  const [emailOn, setEmailOn] = useState(initialAlertSettings?.email ?? true);
  const [emailMode, setEmailMode] = useState<"instant" | "daily_digest">(
    (initialAlertSettings?.emailMode as "instant" | "daily_digest") ?? "instant"
  );

  const shareUrl =
    typeof window !== "undefined"
      ? publishedPackSlug
        ? `${window.location.origin}/packs/${username}/${publishedPackSlug}?via=share`
        : `${window.location.origin}/u/${username}?via=share`
      : "";
  const linkedInUrl =
    typeof window !== "undefined"
      ? publishedPackSlug
        ? `${window.location.origin}/packs/${username}/${publishedPackSlug}?via=linkedin`
        : `${window.location.origin}/u/${username}?via=linkedin`
      : "";
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkedInUrl)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select and copy the link manually.");
    }
  };

  const handleOfferHeadline = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveOfferHeadline(offerHeadline);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setStep(1);
    });
  };

  const handleOfferSlotSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveOfferSlot({
        label: offerLabel,
        url: offerUrl,
        description: offerDescription || null,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setStep(3);
    });
  };

  const handleAlertSettingsSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveAlertSettings({ hotThreshold, inApp, email: emailOn, emailMode });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setStep(4);
    });
  };

  const handleFinish = () => {
    setError(null);
    startTransition(async () => {
      const result = await completeCreatorOnboarding();
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
    });
  };

  return (
    <div className="min-h-screen bg-background-inset px-5 py-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-[560px]">
        <Header step={step} />

        <div className="rounded-[20px] bg-card p-7 shadow-[0_12px_34px_rgba(28,30,40,0.10)] md:p-9">
          {error && (
            <p className="mb-5 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {/* ── Step 1 · Offer capture ────────────────────────────────── */}
          {step === 0 && (
            <div>
              <h1 className="m-0 mb-2 text-[28px] font-normal leading-[1.1] -tracking-[0.02em]">
                What do you help people with?
              </h1>
              <p className="m-0 mb-6 text-[15px] leading-[1.55] text-foreground-muted">
                This is your identity on Prmpt — it becomes the pitch on your offer button.
              </p>

              <div className="mb-6">
                <input
                  value={offerHeadline}
                  onChange={(e) => setOfferHeadline(e.target.value)}
                  placeholder="I help B2B founders write cold outreach that books calls"
                  maxLength={200}
                  className="h-12 w-full rounded-xl border border-border-strong bg-background px-4 text-[15px] outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="mb-8">
                <div className="mb-3 text-[13px] text-foreground-muted">What kind of offer? (optional)</div>
                <div className="flex flex-wrap gap-2">
                  {OFFER_TYPES.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      selected={offerType === t}
                      onClick={() => setOfferType(offerType === t ? null : t)}
                    />
                  ))}
                </div>
              </div>

              <ContinueButton onClick={handleOfferHeadline} pending={pending} disabled={!offerHeadline.trim()} />
            </div>
          )}

          {/* ── Step 2 · First pack ───────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h1 className="m-0 mb-2 text-[28px] font-normal leading-[1.1] -tracking-[0.02em]">
                Drop your first pack.
              </h1>
              <p className="m-0 mb-6 text-[15px] leading-[1.55] text-foreground-muted">
                A pack is your released, shareable bundle of prompts. Encouraged, not required —
                you can add one later.
              </p>

              <Link
                href="/dashboard/packs/new"
                className="mb-4 flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Build a pack
              </Link>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="block w-full text-center text-[13px] text-foreground-subtle underline underline-offset-2 hover:text-foreground"
              >
                I&rsquo;ll do this later
              </button>
            </div>
          )}

          {/* ── Step 3 · Offer slot ───────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h1 className="m-0 mb-2 text-[28px] font-normal leading-[1.1] -tracking-[0.02em]">
                Add your offer button.
              </h1>
              <p className="m-0 mb-6 text-[15px] leading-[1.55] text-foreground-muted">
                This button appears right after someone uses your prompt, at the moment they&rsquo;re
                most impressed. It&rsquo;s how a lead tells you they want to hire you.
              </p>

              <div className="mb-4">
                <label htmlFor="offer-label" className="mb-2 block text-[13px] text-foreground-muted">
                  Button text
                </label>
                <input
                  id="offer-label"
                  value={offerLabel}
                  onChange={(e) => setOfferLabel(e.target.value)}
                  placeholder="Book a free strategy call"
                  className="h-12 w-full rounded-xl border border-border-strong bg-background px-4 text-[15px] outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="offer-url" className="mb-2 block text-[13px] text-foreground-muted">
                  Link
                </label>
                <input
                  id="offer-url"
                  value={offerUrl}
                  onChange={(e) => setOfferUrl(e.target.value)}
                  onBlur={() => setOfferUrlTouched(true)}
                  placeholder="https://cal.com/you"
                  aria-invalid={!!offerUrlError}
                  aria-describedby={offerUrlError ? "offer-url-error" : undefined}
                  className="h-12 w-full rounded-xl border border-border-strong bg-background px-4 text-[15px] outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                {offerUrlError && (
                  <p id="offer-url-error" className="mt-1.5 text-[13px] text-destructive">
                    {offerUrlError}
                  </p>
                )}
              </div>

              <div className="mb-8">
                <label htmlFor="offer-description" className="mb-2 block text-[13px] text-foreground-muted">
                  Description (optional)
                </label>
                <textarea
                  id="offer-description"
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  rows={2}
                  placeholder="30 minutes, we'll look at your funnel together"
                  className="w-full rounded-xl border border-border-strong bg-background px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <ContinueButton
                onClick={handleOfferSlotSave}
                pending={pending}
                disabled={!offerLabel.trim() || !offerUrl.trim() || !offerUrlValid}
              />
              <button
                type="button"
                onClick={() => setStep(3)}
                className="mt-3 block w-full text-center text-[13px] text-foreground-subtle underline underline-offset-2 hover:text-foreground"
              >
                Skip for now — no button means no way for a hot lead to say yes
              </button>
            </div>
          )}

          {/* ── Step 4 · Alerts ───────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h1 className="m-0 mb-2 text-[28px] font-normal leading-[1.1] -tracking-[0.02em]">
                Get tapped when a lead goes hot.
              </h1>
              <p className="m-0 mb-6 text-[15px] leading-[1.55] text-foreground-muted">
                We watch who uses your prompts and message you the moment someone looks like a
                buyer, with exactly what they did.
              </p>

              <div className="mb-5 flex items-center justify-between rounded-xl border border-border p-4">
                <span className="text-sm">In-app notifications</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={inApp}
                  onClick={() => setInApp(!inApp)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    inApp ? "bg-primary" : "bg-border-strong"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      inApp ? "translate-x-[22px]" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              <div className="mb-5 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailOn}
                    onClick={() => setEmailOn(!emailOn)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      emailOn ? "bg-primary" : "bg-border-strong"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                        emailOn ? "translate-x-[22px]" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
                {emailOn && (
                  <div className="mt-3 flex gap-2">
                    <Chip label="Instant" selected={emailMode === "instant"} onClick={() => setEmailMode("instant")} />
                    <Chip
                      label="Daily digest"
                      selected={emailMode === "daily_digest"}
                      onClick={() => setEmailMode("daily_digest")}
                    />
                  </div>
                )}
              </div>

              <div className="mb-5 flex items-center justify-between rounded-xl border border-dashed border-border-strong p-4 opacity-60">
                <span className="text-sm">Slack</span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-foreground-subtle">
                  Coming soon
                </span>
              </div>

              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between text-[13px] text-foreground-muted">
                  <span>Alert me when a lead is: warmer ←→ hotter</span>
                  <span className="font-mono text-foreground">{hotThreshold}</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={80}
                  value={hotThreshold}
                  onChange={(e) => setHotThreshold(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <ContinueButton onClick={handleAlertSettingsSave} pending={pending} />
            </div>
          )}

          {/* ── Step 5 · Share (payoff) ───────────────────────────────── */}
          {step === 4 && (
            <div>
              <h1 className="m-0 mb-2.5 text-[32px] font-normal leading-[1.05] -tracking-[0.02em]">
                You&rsquo;re set. Here&rsquo;s your link.
              </h1>
              <p className="m-0 mb-7 text-[15px] leading-[1.55] text-foreground-muted">
                Swap this into your next &ldquo;comment WORD, I&rsquo;ll send you the prompt&rdquo;
                post. Same post, more clients.
              </p>

              <div className="mb-6 rounded-2xl border border-border bg-background-inset p-4">
                <p className="mb-3 break-all font-mono text-[13px] text-foreground-muted">{shareUrl}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong px-4 text-[13px] font-medium transition-colors hover:border-foreground"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <a
                    href={linkedInShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong px-4 text-[13px] font-medium transition-colors hover:border-foreground"
                  >
                    Share on LinkedIn
                  </a>
                </div>
              </div>

              {!hasPublishedPack && (
                <p className="mb-6 text-[13px] text-foreground-subtle">
                  This links to your creator page. Drop a pack any time from your dashboard and this
                  link stays the same.
                </p>
              )}

              <ContinueButton onClick={handleFinish} pending={pending}>
                Go to my dashboard
              </ContinueButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
