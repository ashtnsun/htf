import type { Metadata } from "next";
import Link from "next/link";
import { formatDeadline, getApplyForm, isInSeason, site } from "@content/site";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { getRoles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Apply",
  description: `Apply to join Hack the Future for ${site.season.cycleName}: one form for every role, open to all majors, all years and all levels of experience.`,
  alternates: { canonical: "/apply" },
};

const inlineLink = "font-medium text-green transition-colors duration-200 hover:text-text";

/**
 * /apply: where every Apply CTA lands. In season it is the cycle's Google Form, embedded
 * (content/site.ts → season.applyFormUrl, through `getApplyForm`) with a link to open the
 * form on its own for anyone whose browser will not show the frame; while the form link is
 * still a TODO the page says so and points at the Instagram profile instead. Out of season
 * it says applications are closed. Applications went to Google Forms on 2026-09-09; the
 * in-house portal that used to live here is parked under parked/ (see parked/README.md).
 */
export default function ApplyPage() {
  if (!isInSeason()) return <Closed />;
  const form = getApplyForm();
  const deadline = formatDeadline();
  const roles = getRoles().filter((role) => role.open);

  return (
    <>
      <PageHero
        eyebrow={`${site.season.cycleName} applications`}
        lines={["Apply to", "*Hack the Future.*"]}
        blurb="One form covers every role you want. Open to all majors, all years, and all levels of experience."
      >
        {deadline ? (
          <p className="text-sm text-muted">
            Applications close <span className="text-text">{deadline}</span>.
          </p>
        ) : null}
      </PageHero>

      <Section aria-labelledby="apply-form-title" className="border-t border-line">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal standalone>
            <Eyebrow>Application form</Eyebrow>
            <h2 id="apply-form-title" className="mt-5 text-h3">
              {form ? "Fill it in right here." : "The form link is not set yet."}
            </h2>
            {form ? (
              <>
                <div className="mt-8 border border-line bg-surface">
                  <iframe
                    src={form.embedUrl}
                    title={`${site.season.cycleName} application form`}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="block h-[80svh] min-h-[40rem] w-full bg-white"
                  />
                </div>
                <p className="mt-5 text-sm text-muted">
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
              <div className="mt-8 border border-dashed border-line-strong p-6">
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

          <Reveal standalone delay={0.1} className="space-y-12">
            <div>
              <p className="text-eyebrow font-medium text-muted uppercase">Roles this cycle</p>
              <ul className="mt-4 border-t border-line">
                {roles.map((role) => (
                  <li key={role.slug} className="border-b border-line py-4">
                    <Link
                      href={`/students#role-${role.slug}`}
                      className="group block transition-colors duration-200"
                    >
                      <span className="block text-text transition-colors duration-200 group-hover:text-green">
                        {role.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted">{role.blurb}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">
                You can apply for more than one. Responsibilities and time commitment are on the{" "}
                <Link href="/students#roles" className={inlineLink}>
                  Students page
                </Link>
                .
              </p>
            </div>

            <div>
              <p className="text-eyebrow font-medium text-muted uppercase">What happens next</p>
              <p className="mt-4 text-sm text-muted">
                We read every application after the deadline and follow up by email. The{" "}
                <Link href="/students#timeline" className={inlineLink}>
                  recruitment timeline
                </Link>{" "}
                has the dates. Questions?{" "}
                <Link href="/contact" className={inlineLink}>
                  Contact us
                </Link>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}

/** Out of season: say so and point at the places that announce the next cycle. */
function Closed() {
  return (
    <PageHero
      eyebrow="Applications"
      lines={["Applications are", "*closed for now.*"]}
      blurb="Follow us on Instagram to hear when the next cycle opens, or reach out any time."
    >
      <div className="flex flex-wrap gap-4">
        <SplitButton href={site.socials.instagram}>Follow on Instagram</SplitButton>
        <SplitButton href="/contact" variant="secondary">
          Contact us
        </SplitButton>
      </div>
    </PageHero>
  );
}
