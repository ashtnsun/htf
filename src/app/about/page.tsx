import type { Metadata } from "next";
import { ExecGrid } from "@/components/about/ExecGrid";
import { InstagramGrid } from "@/components/about/InstagramGrid";
import { Mission } from "@/components/about/Mission";
import { Awards } from "@/components/home/Awards";
import { WhoWeServe } from "@/components/home/WhoWeServe";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHero } from "@/components/layout/PageHero";
import { SectionNav } from "@/components/layout/SectionNav";
import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { getAboutPage, getAwards, getExec, getExecYears, getInstagramPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who Hack the Future is: a Purdue student organization building software for nonprofits, its mission, exec board and recognition.",
  alternates: { canonical: "/about" },
};

const SECTIONS = [
  { href: "#mission", label: "Mission" },
  { href: "#exec", label: "Exec board" },
  { href: "#awards", label: "Awards" },
  { href: "#instagram", label: "Instagram" },
] as const;

export default function AboutPage() {
  const about = getAboutPage();
  const exec = getExec();
  const execYears = getExecYears();
  const awards = getAwards();
  const posts = getInstagramPosts();

  return (
    <>
      <PageHero eyebrow="About" lines={["Students building", "*for good.*"]} />
      <SectionNav items={SECTIONS} label="About" />

      <Mission mission={about.mission} />
      <ExecGrid members={exec} years={execYears} />
      {awards.length > 0 ? (
        <Section id="awards" aria-labelledby="awards-title" className="border-t border-line">
          <Reveal standalone>
            <Awards awards={awards} headingLevel="h2" id="awards-title" />
          </Reveal>
        </Section>
      ) : null}
      <InstagramGrid posts={posts} />
      <WhoWeServe />
      <ContactCta />
    </>
  );
}
