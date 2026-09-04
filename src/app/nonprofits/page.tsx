import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { StubSection } from "@/components/layout/StubSection";
import { SplitButton } from "@/components/ui/SplitButton";

export const metadata: Metadata = {
  title: "Non-profits",
  description:
    "Partner with Hack the Future: a student team builds the software your nonprofit needs.",
};

export default function NonprofitsPage() {
  return (
    <>
      <PageHero
        eyebrow="For non-profits"
        lines={["Bring us a problem.", "*We build the tool.*"]}
        blurb="[TODO: pitch to nonprofit staff] A student team scopes the work with you and builds it over the school year."
      >
        <SplitButton href="/contact" size="lg">
          Start a conversation
        </SplitButton>
      </PageHero>
      <StubSection
        phase="Phase 3"
        items={[
          "How it works",
          "What we build and don't",
          "Previous partners (globe with pins)",
          "Testimonials",
          "Nonprofit FAQ",
          "Intake form",
        ]}
      />
    </>
  );
}
