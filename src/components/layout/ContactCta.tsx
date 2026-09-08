import type { ReactNode } from "react";
import { getDeadlineParts, getPrimaryCta, site } from "@content/site";
import { InvolvedGraphic } from "@/components/layout/involved/InvolvedGraphic";
import { SeasonNote } from "@/components/layout/SeasonNote";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { cn } from "@/lib/utils";

type ContactCtaProps = {
  id?: string;
  eyebrow?: string;
  /** Headline lines; *asterisks* mark the green words. */
  lines?: string[];
  copy?: ReactNode;
  /** Second button next to the season CTA. Hidden when it would duplicate the primary one. */
  secondary?: { label: string; href: string } | null;
  className?: string;
};

/**
 * Closing call-to-action after the Framer contact block: eyebrow, display headline, copy,
 * the season CTA (Apply Now / Contact Us from content/site.ts) and the floating Get involved
 * graphic (layout/involved: the terminal by default, Chat and Badge in the Shift + M menu; every
 * one a recognizable object, since audit 4 of 2026-09-07).
 */
export function ContactCta({
  id = "get-involved",
  eyebrow = "Get involved",
  lines = ["Let’s build something", "*that matters.*"],
  copy = "Students and nonprofits both start here.",
  secondary = { label: "Contact us", href: "/contact" },
  className,
}: ContactCtaProps) {
  const cta = getPrimaryCta();
  const deadline = getDeadlineParts();
  const season = deadline ? { cycleName: site.season.cycleName, deadline } : null;
  const titleId = `${id}-title`;
  const showSecondary = secondary && secondary.href !== cta.href;
  return (
    <Section
      id={id}
      aria-labelledby={titleId}
      grid
      padding="lg"
      className={cn("border-t border-line", className)}
    >
      <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <Reveal standalone>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Headline
            as="h2"
            id={titleId}
            size="display"
            lines={lines}
            className="mt-6 text-h2 md:text-display"
          />
          <p className="mt-6 max-w-md text-muted">{copy}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <SplitButton href={cta.href} size="lg">
              {cta.label}
            </SplitButton>
            {showSecondary ? (
              <SplitButton href={secondary.href} variant="secondary" size="lg">
                {secondary.label}
              </SplitButton>
            ) : null}
          </div>
          <SeasonNote className="mt-5" />
        </Reveal>
        <Reveal standalone delay={0.15} className="mx-auto w-[min(100%,28rem)]">
          <InvolvedGraphic cta={cta} season={season} academicYear={site.academicYear} />
        </Reveal>
      </div>
    </Section>
  );
}
