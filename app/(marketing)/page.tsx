import type { Metadata } from "next";

import { Benefits } from "@/components/marketing/landing/benefits";
import { DemoVideo } from "@/components/marketing/landing/demo-video";
import { Finale } from "@/components/marketing/landing/finale";
import { Hero } from "@/components/marketing/landing/hero";
import { SiteNav } from "@/components/marketing/landing/site-nav";

export const metadata: Metadata = {
  title: "prmpt — Turn comments into clients.",
  description:
    "A wall of comment “PROMPT” doesn’t get you clients. prmpt does — it turns every one of those comments into a lead, hands over your prompt like a pro, and books the call for you.",
};

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
        <DemoVideo />
        <Benefits />
        <Finale />
      </main>
    </>
  );
}
