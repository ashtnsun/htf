import type { Metadata } from "next";
import Link from "next/link";
import { formatDeadline, getApplyForm, isInSeason, site } from "@content/site";
import { FaqAccordion } from "@/components/layout/FaqSection";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { getFaq } from "@/lib/content";

export const metadata: Metadata = {
  title: "Apply",
  description: `Apply to join Hack the Future for ${site.season.cycleName}: one form for every role, open to all majors, all years and all levels of experience.`,
  alternates: { canonical: "/apply" },
};

const inlineLink = "font-medium text-green transition-colors duration-200 hover:text-text";
/** The one centred column everything on the page sits in: the form is the page. */
const column = "mx-auto w-full max-w-3xl";

/**
 * /apply: where every Apply CTA lands. One centred column, no banner (the second 2026-09-09
 * review): a short heading with the deadline, then the cycle's Google Form embedded
 * (content/site.ts → season.applyFormUrl, through `getApplyForm`) with a link to open it on
 * its own for anyone whose browser will not show the frame, then the short FAQ from
 * content/faq.ts (`audience: "apply"`: what happens next, more than one role, who can apply).
 * While the form link is still a TODO the page says so and points at the Instagram profile
 * instead. Out of season it says applications are closed. Applications went to Google Forms
 * on 2026-09-09; the in-house portal that used to live here is parked under parked/.
 */
export default function ApplyPage() {
  if (!isInSeason()) return <Closed />;
  const form = getApplyForm();
  const deadline = formatDeadline();
  const faq = getFaq("apply");

  return (
    <>
      <Section
        aria-labelledby="apply-title"
        padding="none"
        className="pt-12 pb-16 md:pt-20 md:pb-24"
      >
        <div className={column}>
          <Reveal standalone className="flex flex-col items-center text-center">
            <Eyebrow>{`${site.season.cycleName} applications`}</Eyebrow>
            <Headline
              as="h1"
              id="apply-title"
              size="display"
              align="center"
              lines={["Apply to", "*Hack the Future.*"]}
              className="mt-5 text-h2 md:text-display"
            />
            <p className="mt-5 max-w-lg text-muted">
              One form covers every role you want. Open to all majors, all years, and all levels of
              experience.
              {deadline ? (
                <>
                  {" "}
                  Applications close <span className="text-text">{deadline}</span>.
                </>
              ) : null}
            </p>
          </Reveal>

          <Reveal standalone delay={0.1} className="mt-10 md:mt-12">
            {form ? (
              <>
                <div className="border border-line bg-surface">
                  <iframe
                    src={form.embedUrl}
                    title={`${site.season.cycleName} application form`}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="block h-[80svh] min-h-[40rem] w-full bg-white"
                  />
                </div>
                <p className="mt-5 text-center text-sm text-muted">
                  Blank space above? Some browsers block embedded forms.{" "}
                  <a
                    href={form.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={inlineLink}
                  >
                    Open the form in a new tab
                  </a>{" "}
                  instead.
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center border border-dashed border-line-strong p-6 text-center md:p-8">
                <p className="text-text">
                  [TODO: paste the {site.season.cycleName} Google Form link into content/site.ts
                  (season.applyFormUrl) and this page embeds it.]
                </p>
                <p className="mt-2 text-sm text-muted">
                  Until then, the form is linked from our Instagram bio.
                </p>
                <SplitButton href={site.season.applyFallbackUrl} className="mt-6">
                  Open Instagram
                </SplitButton>
              </div>
            )}
          </Reveal>
        </div>
      </Section>

      {faq.length > 0 ? (
        <Section id="faq" aria-labelledby="apply-faq-title" className="border-t border-line">
          <div className={column}>
            <Reveal standalone>
              <Eyebrow>FAQ</Eyebrow>
              <Headline
                as="h2"
                id="apply-faq-title"
                size="h2"
                lines={["What happens", "*next.*"]}
                className="mt-5"
              />
              <p className="mt-6 max-w-md text-muted">
                Something else?{" "}
                <Link href="/contact" className={inlineLink}>
                  Contact us
                </Link>
                , or read the{" "}
                <Link href="/students#faq" className={inlineLink}>
                  student FAQ
                </Link>
                .
              </p>
            </Reveal>
            <Reveal standalone delay={0.1}>
              <FaqAccordion items={faq} className="mt-10" />
            </Reveal>
          </div>
        </Section>
      ) : null}
    </>
  );
}

/** Out of season: say so and point at the places that announce the next cycle. */
function Closed() {
  return (
    <Section aria-labelledby="apply-title" padding="lg">
      <Reveal standalone className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Eyebrow>Applications</Eyebrow>
        <Headline
          as="h1"
          id="apply-title"
          size="display"
          align="center"
          lines={["Applications are", "*closed for now.*"]}
          className="mt-5 text-h2 md:text-display"
        />
        <p className="mt-5 max-w-lg text-body-lg text-muted">
          Follow us on Instagram to hear when the next cycle opens, or reach out any time.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <SplitButton href={site.socials.instagram}>Follow on Instagram</SplitButton>
          <SplitButton href="/contact" variant="secondary">
            Contact us
          </SplitButton>
        </div>
      </Reveal>
    </Section>
  );
}
