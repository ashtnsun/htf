import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { ImpactBand } from "@/components/home/ImpactBand";
import { WhoWeServe } from "@/components/home/WhoWeServe";
import { ContactCta } from "@/components/layout/ContactCta";
import { FaqSection } from "@/components/layout/FaqSection";
import { getFaq, getFeaturedProjects, getStats, getTestimonials } from "@/lib/content";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const linkClass =
  "text-text underline decoration-green/70 underline-offset-4 transition-colors hover:text-green";

/**
 * Home, in the Framer's order: hero → featured projects → who we serve → impact band
 * (stats + testimonials, hidden until published) → FAQ → contact CTA. Every section reads
 * from content/ and content/site.ts; nothing here is hard-coded except section copy.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProjects projects={getFeaturedProjects(4)} />
      <WhoWeServe />
      <ImpactBand stats={getStats()} testimonials={getTestimonials()} />
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
              Non-profits
            </Link>{" "}
            pages.
          </p>
        }
      />
      <ContactCta copy="Whether you want to ship software for a cause or you run a nonprofit with a problem worth solving, we would love to hear from you." />
    </>
  );
}
