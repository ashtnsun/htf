import type { Metadata } from "next";
import { getPrimaryCta } from "@content/site";
import { PageHero } from "@/components/layout/PageHero";
import { StubSection } from "@/components/layout/StubSection";
import { SplitButton } from "@/components/ui/SplitButton";

export const metadata: Metadata = {
  title: "Students",
  description:
    "Join Hack the Future as a project lead, developer or designer. Open to all majors, all years, all experience levels.",
};

export default function StudentsPage() {
  const cta = getPrimaryCta();
  return (
    <>
      <PageHero
        eyebrow="Student involvement"
        lines={["Join us to", "*make an impact.*"]}
        blurb="Open to all majors, all years, and all levels of experience. You can apply for more than one role."
      >
        <SplitButton href={cta.href} size="lg">
          {cta.label}
        </SplitButton>
      </PageHero>
      <StubSection
        phase="Session 2"
        items={[
          "Roles",
          "Recruitment timeline",
          "How we work",
          "What you'll get",
          "Student FAQ",
          "CTA",
        ]}
      />
    </>
  );
}
