import type { Metadata } from "next";
import { formatDeadline, getApplyForm, isInSeason, site } from "@content/site";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";

export const metadata: Metadata = {
  title: "Apply",
  description: `Apply to join Hack the Future for ${site.season.cycleName}: one form for every role, open to all majors, all years and all levels of experience.`,
  alternates: { canonical: "/apply" },
};

/** The one centred column everything on the page sits in. */
const column = "mx-auto w-full max-w-2xl";

/**
 * /apply: where every Apply CTA lands. One centred column, no banner (the second 2026-09-09
 * review): a short heading with the deadline, then the cycle's Google Form embedded
 * (content/site.ts → season.applyFormUrl), then the way into the cycle's Google Form. The
 * form is linked, not embedded: it runs over several sections whose heights differ, so an
 * iframe means a nested scrollbar or a white gap under the short ones, and nothing of
 * Google's page can be styled from here (cross-origin). `getApplyForm().embedUrl` still
 * carries `embedded=true` for the day it goes back in a frame. The FAQ under the form came
 * off in the same 2026-09-10 copy pass. Out of season the page says applications are closed.
 * Applications went to Google Forms on 2026-09-09; the in-house portal that used to live
 * here is parked under parked/.
 */
export default function ApplyPage() {
  if (!isInSeason()) return <Closed />;
  const form = getApplyForm();
  const deadline = formatDeadline();

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
            {deadline ? (
              <p className="mt-5 max-w-lg text-muted">
                Applications close <span className="text-text">{deadline}</span>.
              </p>
            ) : null}
          </Reveal>

          <Reveal standalone delay={0.1} className="mt-12 md:mt-14">
            {form ? (
              <div className="frame-marks flex flex-col items-center border border-line bg-surface px-6 py-12 text-center md:px-12 md:py-16">
                <p className="max-w-sm text-body-lg text-text">
                  The application runs on Google Forms and opens in a new tab.
                </p>
                <SplitButton href={form.url} size="lg" className="mt-8">
                  Open the application form
                </SplitButton>
                <p className="mt-6 max-w-sm text-sm text-muted">
                  Sign in to Google first if you want it to save your progress as you go.
                </p>
              </div>
            ) : null}
          </Reveal>
        </div>
      </Section>
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
