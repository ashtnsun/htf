import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@content/site";
import { FaqSection } from "@/components/layout/FaqSection";
import { PageHero } from "@/components/layout/PageHero";
import { SectionNav } from "@/components/layout/SectionNav";
import { Reveal } from "@/components/motion/Reveal";
import { HowItWorks } from "@/components/nonprofits/HowItWorks";
import { NonprofitTestimonials } from "@/components/nonprofits/NonprofitTestimonials";
import { Partners } from "@/components/nonprofits/Partners";
import { Scope } from "@/components/nonprofits/Scope";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { CopyEmailButton, CopyEmailInline } from "@/components/ui/CopyEmail";
import { Section } from "@/components/ui/Section";
import {
  getFaq,
  getNonprofitsPage,
  getPartnerLocations,
  getProcess,
  getTestimonials,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Nonprofits",
  description:
    "Partner with Hack the Future: a team of Purdue students scopes the software your nonprofit needs, builds it over the school year and hands it off free of charge.",
  alternates: { canonical: "/nonprofits" },
};

const SECTIONS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#scope", label: "What we build" },
  { href: "#partners", label: "Partners" },
  { href: "#faq", label: "FAQ" },
  { href: "#start", label: "Start a project" },
] as const;

const linkClass = "font-medium text-green transition-colors duration-200 hover:text-text";

/**
 * Nonprofits: hero (no CTA in the banner since the 2026-09-09 review; the section bar and
 * the closing section carry the way in), how it works, scope, the partner globe, quotes,
 * the FAQ, and "Start a project", which since that review is an email address rather than
 * an intake form: a nonprofit writes to the club and everything else happens on a call.
 */
export default function NonprofitsPage() {
  const steps = getProcess();
  const page = getNonprofitsPage();
  const locations = getPartnerLocations();
  const testimonials = getTestimonials().filter((t) => t.kind === "nonprofit");
  const faq = getFaq("nonprofits");
  const email = site.socials.email;

  return (
    <>
      <PageHero eyebrow="For nonprofits" lines={["Bring us a problem.", "*We build the tool.*"]} />
      <SectionNav items={SECTIONS} label="Nonprofits" />

      <HowItWorks steps={steps} />
      <Scope build={page.scope.build} avoid={page.scope.avoid} />
      <Partners locations={locations} />
      <NonprofitTestimonials testimonials={testimonials} />
      <FaqSection
        items={faq}
        lines={["Before you", "*write in.*"]}
        aside={
          <p>
            Something else?{" "}
            <Link href="#start" className={linkClass}>
              Email us
            </Link>
            , or read the{" "}
            <Link href="/#faq" className={linkClass}>
              general FAQ
            </Link>
            .
          </p>
        }
      />

      <Section id="start" aria-labelledby="start-title" grid className="border-t border-line">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal standalone>
            <Eyebrow>Start a project</Eyebrow>
            <Headline
              as="h2"
              id="start-title"
              size="h2"
              lines={["Tell us what", "*you need.*"]}
              className="mt-5"
            />
            <p className="mt-6 max-w-md text-muted">
              A rough idea is enough. Send us an email with who you are, who you serve and the
              problem you would like solved, and we scope the details together on a call.
            </p>
            <div className="mt-8">
              <CopyEmailButton email={email} size="lg">
                Copy our email
              </CopyEmailButton>
              <p className="mt-5 text-sm text-muted">
                <CopyEmailInline email={email} /> — write to us from your own email app.
              </p>
            </div>
          </Reveal>

          <Reveal standalone delay={0.1}>
            <p className="text-eyebrow font-medium text-muted uppercase">What happens next</p>
            <ol className="mt-4 border-t border-line">
              {page.nextSteps.map((step, i) => (
                <li key={i} className="flex gap-4 border-b border-line py-4">
                  <span className="font-display text-h3 font-medium text-green tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="pt-1.5 text-sm text-muted">{step}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
