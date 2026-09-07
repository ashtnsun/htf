import type { Award, Stat, Testimonial } from "@/lib/content/schemas";
import { Awards } from "@/components/home/Awards";
import { TestimonialMarquee } from "@/components/home/TestimonialMarquee";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { DottedMap } from "@/components/ui/DottedMap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { StatTile } from "@/components/ui/StatTile";

type ImpactBandProps = {
  stats: Stat[];
  testimonials: Testimonial[];
  awards: Award[];
};

/**
 * Impact: the dotted world map as the backdrop of the whole band (it replaced the ghosted
 * headline in the 2026-09-07 audit), three glass stat tiles whose numbers count up on first
 * view, the full-width testimonial marquee, then the awards record and photo. The eyebrow is
 * the section heading. Each block hides itself until it has content (loaders hide
 * unpublished items in production and show them in development).
 */
export function ImpactBand({ stats, testimonials, awards }: ImpactBandProps) {
  if (stats.length === 0 && testimonials.length === 0 && awards.length === 0) return null;

  return (
    <Section
      id="impact"
      aria-labelledby="impact-title"
      padding="lg"
      contain={false}
      clip
      className="border-t border-line"
    >
      <DottedMap
        tone="text"
        className="absolute top-0 left-1/2 w-[min(140%,120rem)] -translate-x-1/2 -translate-y-[12%] [mask-image:radial-gradient(55%_75%_at_50%_50%,#000_25%,transparent_100%)] opacity-20"
      />
      <div className="relative container-max container-x">
        <RevealGroup>
          <Reveal>
            <Eyebrow as="h2" id="impact-title">
              Impact
            </Eyebrow>
          </Reveal>

          {stats.length > 0 ? (
            <Reveal>
              <dl className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((s, i) => (
                  <StatTile key={s.id} value={s.value} label={s.label} index={i} />
                ))}
              </dl>
            </Reveal>
          ) : null}
        </RevealGroup>
      </div>

      {testimonials.length > 0 ? <TestimonialMarquee testimonials={testimonials} /> : null}

      {awards.length > 0 ? (
        <div className="relative container-max mt-20 container-x md:mt-28">
          <Awards awards={awards} />
        </div>
      ) : null}
    </Section>
  );
}
