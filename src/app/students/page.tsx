import type { Metadata } from "next";
import Link from "next/link";
import { getPrimaryCta } from "@content/site";
import { ContactCta } from "@/components/layout/ContactCta";
import { FaqSection } from "@/components/layout/FaqSection";
import { PageHero } from "@/components/layout/PageHero";
import { SectionNav } from "@/components/layout/SectionNav";
import { SeasonNote } from "@/components/layout/SeasonNote";
import { HowWeWork } from "@/components/students/HowWeWork";
import { Perks } from "@/components/students/Perks";
import { RecruitmentTimeline } from "@/components/students/RecruitmentTimeline";
import { RoleRows } from "@/components/students/RoleRows";
import { SplitButton } from "@/components/ui/SplitButton";
import { getFaq, getRecruitmentTimeline, getRoles, getStudentsPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Students",
  description:
    "Join Hack the Future as a project lead, developer or designer. Open to all majors, all years, all experience levels.",
  alternates: { canonical: "/students" },
};

const SECTIONS = [
  { href: "#roles", label: "Roles" },
  { href: "#timeline", label: "Timeline" },
  { href: "#how-we-work", label: "How we work" },
  { href: "#what-you-get", label: "What you’ll get" },
  { href: "#faq", label: "FAQ" },
] as const;

const linkClass = "font-medium text-green transition-colors duration-200 hover:text-text";

export default function StudentsPage() {
  const cta = getPrimaryCta();
  const roles = getRoles();
  const timeline = getRecruitmentTimeline();
  const { teamStructure, howWeWork, perks } = getStudentsPage();
  const faq = getFaq("students");

  return (
    <>
      <PageHero
        eyebrow="Student involvement"
        lines={["Join us to", "*make an impact.*"]}
        blurb="Open to all majors, all years, and all levels of experience. You can apply for more than one role."
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <SplitButton href={cta.href} size="lg">
            {cta.label}
          </SplitButton>
          <SeasonNote className="sm:ml-2" />
        </div>
      </PageHero>
      <SectionNav items={SECTIONS} label="Students" />

      <RoleRows roles={roles} />
      <RecruitmentTimeline steps={timeline} />
      <HowWeWork seats={teamStructure} steps={howWeWork} />
      <Perks perks={perks} />
      <FaqSection
        items={faq}
        lines={["Before you", "*apply.*"]}
        aside={
          <p>
            Something else?{" "}
            <Link href="/contact" className={linkClass}>
              Ask us
            </Link>
            , or read the{" "}
            <Link href="/#faq" className={linkClass}>
              general FAQ
            </Link>
            .
          </p>
        }
      />
      <ContactCta
        eyebrow="Ready?"
        lines={["Bring what you know.", "*Learn the rest.*"]}
        copy="Open to all majors, all years, and all levels of experience. Not sure which role fits? Apply for more than one, or ask us first."
      />
    </>
  );
}
