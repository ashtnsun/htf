import type { Metadata } from "next";
import { ExecGrid } from "@/components/about/ExecGrid";
import { Mission } from "@/components/about/Mission";
import { Awards } from "@/components/home/Awards";
import { WhoWeServe } from "@/components/home/WhoWeServe";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { Section } from "@/components/ui/Section";
import { getAboutPage, getAwards, getExec, getExecYears } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who Hack the Future is: a Purdue student organization building software for nonprofits, its mission, exec board and recognition.",
  alternates: { canonical: "/about" },
};

/**
 * The Instagram grid is off the page since 2026-09-15 until the Behold feed is linked. To bring
 * it back: import `InstagramGrid` from "@/components/about/InstagramGrid" and
 * `getInstagramTiles` from "@/lib/content", make this function async, and render
 * `<InstagramGrid posts={await getInstagramTiles()} />` after the awards.
 */
export default function AboutPage() {
  const about = getAboutPage();
  const exec = getExec();
  const execYears = getExecYears();
  const awards = getAwards();

  return (
    <>
      <PageHero eyebrow="About" lines={["Students building", "*for good.*"]} />

      <Mission mission={about.mission} />
      <ExecGrid members={exec} years={execYears} />
      {awards.length > 0 ? (
        <Section id="awards" aria-labelledby="awards-title" className="border-t border-line">
          <Reveal standalone>
            <Awards awards={awards} headingLevel="h2" id="awards-title" />
          </Reveal>
        </Section>
      ) : null}
      <WhoWeServe />
      <ContactCta />
    </>
  );
}
