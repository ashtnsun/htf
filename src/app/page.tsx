import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { HomeIntro } from "@/components/home/HomeIntro";
import { ImpactBand } from "@/components/home/ImpactBand";
import { Process } from "@/components/home/Process";
import { WhatWeDo } from "@/components/home/WhatWeDo";
import { WhoWeServe } from "@/components/home/WhoWeServe";
import { ContactCta } from "@/components/layout/ContactCta";
import { FaqSection } from "@/components/layout/FaqSection";
import {
  getAwards,
  getFaq,
  getProcess,
  getServices,
  getStats,
  getTestimonials,
} from "@/lib/content";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const linkClass = "font-medium text-green transition-colors hover:text-text";

/**
 * Home (order from the 2026-09-06 audit): hero → what we do → how it works (scroll-driven
 * process) → impact (stats, testimonials, awards; hidden until published) → who we serve →
 * FAQ → contact CTA. Every section reads from content/ and content/site.ts; nothing here is
 * hard-coded except section copy.
 *
 * The way into /olympus (home/olympus/OlympusSection, 2026-10-30) is off the page since
 * 2026-11-01, kept to come back: /olympus is reached by its URL only. To restore it, import
 * OlympusSection and render it between <Hero /> and <WhatWeDo />.
 */
export default function HomePage() {
  return (
    <>
      <HomeIntro />
      <Hero />
      <WhatWeDo services={getServices()} />
      <Process steps={getProcess()} />
      <ImpactBand stats={getStats()} testimonials={getTestimonials()} awards={getAwards()} />
      <WhoWeServe />
      <FaqSection
        items={getFaq("home")}
        aside={
          <p>
            More on the{" "}
            <Link href="/students#faq" className={linkClass}>
              Students
            </Link>{" "}
            and{" "}
            <Link href="/nonprofits" className={linkClass}>
              Nonprofits
            </Link>{" "}
            pages.
          </p>
        }
      />
      <ContactCta />
    </>
  );
}
