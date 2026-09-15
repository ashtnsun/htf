import type { Metadata } from "next";
import Link from "next/link";
import { ContactCta } from "@/components/layout/ContactCta";
import { FaqSection } from "@/components/layout/FaqSection";
import { PageHero } from "@/components/layout/PageHero";
import { SectionNav } from "@/components/layout/SectionNav";
import { HowWeWork } from "@/components/students/HowWeWork";
import { Perks } from "@/components/students/Perks";
import { RecruitmentTimeline } from "@/components/students/RecruitmentTimeline";
import { RoleRows } from "@/components/students/RoleRows";
import { getFaq, getRecruitmentTimeline, getRoles, getStudentsPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Students",
  description:
    "Join Hack the Future as a project lead, developer or designer. Open to all majors, all years, all experience levels.",
  alternates: { canonical: "/students" },
};

const SECTIONS = [
  { href: "#how-we-work", label: "How we work" },
  { href: "#what-you-get", label: "What you’ll get" },
  { href: "#timeline", label: "Timeline" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" },
] as const;

const linkClass = "font-medium text-green transition-colors hover:text-text";

export default function StudentsPage() {
  const roles = getRoles();
  const timeline = getRecruitmentTimeline();
  const { howWeWork, perks } = getStudentsPage();
  const faq = getFaq("students");

  return (
    <>
      <PageHero eyebrow="Student involvement" lines={["Join us to", "*make an impact.*"]} />
      <SectionNav items={SECTIONS} label="Students" />

      <HowWeWork steps={howWeWork} />
      <Perks perks={perks} />
      <RecruitmentTimeline steps={timeline} />
      <RoleRows roles={roles} />
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
      <ContactCta />
    </>
  );
}
