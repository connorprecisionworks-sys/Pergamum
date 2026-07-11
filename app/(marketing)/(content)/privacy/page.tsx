import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Prmpt collects, why, and what we don't do. The short, readable version.",
};

const LAST_UPDATED = "April 29, 2026";

export default function PrivacyPage() {
  return (
    <main className="px-6 md:px-12 lg:px-20 py-20 md:py-28 max-w-[760px] mx-auto">
      <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-4">
        Last updated · {LAST_UPDATED}
      </p>
      <h1 className="font-serif text-[44px] md:text-[56px] font-normal leading-[1.05] tracking-[-0.025em] mb-6">
        Privacy at Prmpt.
      </h1>
      <p className="text-lg text-muted-foreground leading-[1.55] mb-12">
        The short version, in one page. We tried to keep it readable.
      </p>

      <div className="space-y-10 text-[15px] leading-[1.7] text-foreground/85">
        <Section title="What we collect">
          <p>
            <strong className="font-medium text-foreground">Account info.</strong>{" "}
            Your email (so you can sign in) and the username, display name, bio, and avatar you set yourself — these appear on your public profile at <code className="font-mono text-[0.92em] px-1 rounded bg-muted">/u/[username]</code>.
          </p>
          <p>
            <strong className="font-medium text-foreground">Content you submit.</strong>{" "}
            Prompts you publish, prompts you copy or save, comments you write, and collections you create. All of this is associated with your account.
          </p>
          <p>
            <strong className="font-medium text-foreground">Anonymous usage events.</strong>{" "}
            We log a small set of events — page views, signup completions, prompt submissions — to understand whether the product is working. These are stored in our own database, not sent to any third-party analytics service.
          </p>
        </Section>

        <Section title="What we don't do">
          <ul className="space-y-2 list-disc pl-5 marker:text-muted-foreground/60">
            <li>We don&apos;t sell your data.</li>
            <li>We don&apos;t track you across other websites.</li>
            <li>We don&apos;t use third-party advertising or trackers.</li>
            <li>We don&apos;t show ads on Prmpt.</li>
          </ul>
        </Section>

        <Section title="Where your data lives">
          <p>
            Authentication and database run on{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Supabase
            </a>
            . Hosting runs on{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Vercel
            </a>
            . Both have their own privacy policies. We don&apos;t share data with them beyond what&apos;s required to run the product.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Prmpt uses one technical cookie to keep you signed in. No tracking cookies, no third-party trackers, no fingerprinting.
          </p>
        </Section>

        <Section title="Email">
          <p>
            We don&apos;t send marketing emails. We may eventually send transactional emails — for example, &ldquo;your prompt was approved&rdquo; — but those would be opt-out and clearly identified as such.
          </p>
        </Section>

        <Section title="Your data is yours">
          <p>
            You can edit or delete your profile any time from{" "}
            <Link href="/dashboard/profile" className="text-primary underline-offset-4 hover:underline">
              /dashboard/profile
            </Link>
            . To delete your account entirely (and everything you&apos;ve published), email us at the address below and we&apos;ll handle it within 7 days.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If we update this policy, we&apos;ll bump the date at the top of this page. Material changes will be announced in the app before they take effect.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions, requests, or issues? Email{" "}
            <a
              href="mailto:connor.precisionworks@gmail.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              connor.precisionworks@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>

      <div className="mt-20 pt-8 border-t border-border/60">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Prmpt
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl md:text-[28px] font-normal tracking-[-0.015em]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
