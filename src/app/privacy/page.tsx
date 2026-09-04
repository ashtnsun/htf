import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { StubSection } from "@/components/layout/StubSection";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Hack the Future handles the information you share with us.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy policy"
        lines={["Your data,", "*handled with care.*"]}
        blurb="[TODO: rewrite] This page will cover what the application portal collects (email, application answers, sign-in metadata) and Supabase/Vercel as processors."
      />
      <StubSection
        phase="Session 4"
        items={["Last updated", "What we collect", "How we use it", "Processors", "Your rights"]}
      />
    </>
  );
}
