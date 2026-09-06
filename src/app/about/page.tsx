import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { StubSection } from "@/components/layout/StubSection";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who Hack the Future is: a Purdue student organization building software for nonprofits.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        lines={["Students building", "*for good.*"]}
        blurb="[TODO: mission statement] A student org at Purdue building software for nonprofits."
      />
      <StubSection
        phase="Phase 3"
        items={[
          "Mission",
          "Who we are",
          "Awards and recognition",
          "Exec board grid",
          "Student / nonprofit CTA panels",
          "Instagram grid",
        ]}
      />
    </>
  );
}
