import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { HomeIntro } from "@/components/home/HomeIntro";
import { ImpactBand } from "@/components/home/ImpactBand";
import { OlympusSection } from "@/components/home/olympus/OlympusSection";
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
 * The way into /olympus (home/olympus/OlympusSection) sits between the hero and "what we do", back
 * on the page for the event (2026-11-04): /prologue sends every family to it. To take it off after
 * the event, remove OlympusSection here; /olympus then goes back to being reached by its URL only.
 */
export default function HomePage() {
  return (
    <>
      <HomeIntro />
      <Hero />
      <OlympusSection />
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
