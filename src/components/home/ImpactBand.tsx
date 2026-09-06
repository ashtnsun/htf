import type { Award, Stat, Testimonial } from "@/lib/content/schemas";
import { Awards } from "@/components/home/Awards";
import { TestimonialMarquee } from "@/components/home/TestimonialMarquee";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { StatTile } from "@/components/ui/StatTile";

type ImpactBandProps = {
  stats: Stat[];
  testimonials: Testimonial[];
  awards: Award[];
};

/**
 * Impact: a ghosted "Transforming Non-profits" at the top, three glass stat tiles whose
 * numbers count up on first view, the full-width testimonial marquee over the dotted map,
 * then the awards record and photo. Each block hides itself until it has content (loaders
 * hide unpublished items in production and show them in development with a preview note).
 */
export function ImpactBand({ stats, testimonials, awards }: ImpactBandProps) {
  if (stats.length === 0 && testimonials.length === 0 && awards.length === 0) return null;
  const preview = [...stats, ...testimonials, ...awards].some((item) => !item.published);

  return (
    <Section
      id="impact"
      aria-labelledby="impact-title"
      ghost="Transforming Non-profits"
      ghostPosition="top"
      padding="lg"
      contain={false}
      className="border-t border-line"
    >
      <div className="relative container-max container-x">
        <RevealGroup>
          <Reveal>
            <Eyebrow>Impact</Eyebrow>
            <Headline
              as="h2"
              id="impact-title"
              size="h2"
              lines={["Small teams,", "*global reach.*"]}
              className="mt-5"
            />
            {preview ? (
              <p className="mt-6 inline-block border border-dashed border-line-strong px-3 py-2 text-xs text-muted">
                Preview: unpublished content, shown in development only
              </p>
            ) : null}
          </Reveal>

          {stats.length > 0 ? (
            <Reveal>
              <dl className="mt-12 grid gap-4 sm:grid-cols-3">
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
