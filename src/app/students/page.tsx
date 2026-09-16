import type { Metadata } from "next";
import Link from "next/link";
import { ContactCta } from "@/components/layout/ContactCta";
import { FaqSection } from "@/components/layout/FaqSection";
import { PageHero } from "@/components/layout/PageHero";
import { HowWeWork } from "@/components/students/HowWeWork";
import { Perks } from "@/components/students/Perks";
import { WhereWeLand } from "@/components/students/WhereWeLand";
import { RecruitmentTimeline } from "@/components/students/RecruitmentTimeline";
import { RoleRows } from "@/components/students/RoleRows";
import { getFaq, getRecruitmentTimeline, getRoles, getStudentsPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Students",
  description:
    "Join Hack the Future as a project lead, developer or designer. Open to all majors, all years, all experience levels.",
  alternates: { canonical: "/students" },
};

const linkClass = "font-medium text-green transition-colors hover:text-text";

export default function StudentsPage() {
  const roles = getRoles();
  const timeline = getRecruitmentTimeline();
  const { howWeWork, perks } = getStudentsPage();
  const faq = getFaq("students");

  return (
    <>
      <PageHero eyebrow="Student involvement" lines={["Join us to", "*make an impact.*"]} />

      <HowWeWork steps={howWeWork} />
      <Perks perks={perks} />
      <WhereWeLand />
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
