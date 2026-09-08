import type { Metadata } from "next";
import Link from "next/link";
import { getPrimaryCta } from "@content/site";
import { Hero } from "@/components/home/Hero";
import { ImpactBand } from "@/components/home/ImpactBand";
import { Process } from "@/components/home/Process";
import { WhatWeDo } from "@/components/home/WhatWeDo";
import { WhoWeServe } from "@/components/home/WhoWeServe";
import { ContactCta } from "@/components/layout/ContactCta";
import { FaqSection } from "@/components/layout/FaqSection";
import {
  getAwards,
  getFaq,
  getPartnerLocations,
  getProcess,
  getServices,
  getStats,
  getTestimonials,
} from "@/lib/content";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const linkClass = "font-medium text-green transition-colors duration-200 hover:text-text";

/**
 * Home (order from the 2026-09-06 audit): hero → what we do → how it works (scroll-driven
 * process) → impact (stats, testimonials, awards; hidden until published) → who we serve →
 * FAQ → contact CTA. Every section reads from content/ and content/site.ts; nothing here is
 * hard-coded except section copy.
 */
export default function HomePage() {
  // The hero variant is a per-browser choice (Shift + M); the copy, the season CTA and the
  // partner pins (the Atlas variant) come from content either way.
  const pins = getPartnerLocations().flatMap((place) =>
    place.geo ? [{ id: place.id, lat: place.geo[0], lng: place.geo[1] }] : [],
  );
  return (
    <>
      <Hero cta={getPrimaryCta()} pins={pins} />
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
      <ContactCta copy="Whether you want to ship software for a cause or you run a nonprofit with a problem worth solving, we would love to hear from you." />
    </>
  );
}
