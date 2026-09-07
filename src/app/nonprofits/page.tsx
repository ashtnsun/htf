import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@content/site";
import { FaqSection } from "@/components/layout/FaqSection";
import { JumpLinks } from "@/components/layout/JumpLinks";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { HowItWorks } from "@/components/nonprofits/HowItWorks";
import { IntakeForm } from "@/components/nonprofits/IntakeForm";
import { NonprofitTestimonials } from "@/components/nonprofits/NonprofitTestimonials";
import { Partners } from "@/components/nonprofits/Partners";
import { Scope } from "@/components/nonprofits/Scope";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import {
  getFaq,
  getNonprofitsPage,
  getPartnerLocations,
  getProcess,
  getTestimonials,
} from "@/lib/content";
import { isIntakeFormConfigured } from "@/lib/inquiries/deliver";
import { isTodo } from "@/lib/utils";

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

export default function NonprofitsPage() {
  const steps = getProcess();
  const page = getNonprofitsPage();
  const locations = getPartnerLocations();
  const testimonials = getTestimonials().filter((t) => t.kind === "nonprofit");
  const faq = getFaq("nonprofits");
  const email = isTodo(site.socials.email) ? null : site.socials.email;
  const mode = isIntakeFormConfigured() ? "server" : email ? "mailto" : null;

  return (
    <>
      <PageHero
        eyebrow="For nonprofits"
        lines={["Bring us a problem.", "*We build the tool.*"]}
        blurb="A team of Purdue students scopes the work with you, builds it over the school year, and hands off a finished product free of charge."
      >
        <SplitButton href="#start" size="lg">
          Start a project
        </SplitButton>
        <JumpLinks items={SECTIONS} />
      </PageHero>

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
              A rough idea is enough. We scope the details together on a call.
            </p>
            <div className="relative mt-8">
              {mode ? (
                <IntakeForm mode={mode} email={email} />
              ) : (
                <div className="border border-dashed border-line-strong p-6">
                  <p className="text-text">The intake form is not connected yet.</p>
                  <p className="mt-2 text-sm text-muted">
                    [TODO: set the club email in content/site.ts for the mailto fallback, or add the
                    Supabase / Resend keys from .env.example.] Until then, message us on Instagram
                    or use the contact page.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <SplitButton href={site.socials.instagram}>Message us on Instagram</SplitButton>
                    <SplitButton href="/contact" variant="secondary">
                      Contact page
                    </SplitButton>
                  </div>
                </div>
              )}
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
            <p className="mt-8 text-sm text-muted">
              Prefer email, or not sure yet? The{" "}
              <Link href="/contact" className={linkClass}>
                contact page
              </Link>{" "}
              works for anything else.
            </p>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
