import type { Stat, Testimonial } from "@/lib/content/schemas";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { DottedMap } from "@/components/ui/DottedMap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { StatTile } from "@/components/ui/StatTile";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { cn } from "@/lib/utils";

type ImpactBandProps = {
  stats: Stat[];
  testimonials: Testimonial[];
};

/** Stat grid columns by count, so five tiles never leave one orphaned on a second row. */
const STAT_COLUMNS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  5: "sm:grid-cols-2 lg:grid-cols-5",
  6: "sm:grid-cols-2 lg:grid-cols-3",
};

/**
 * The Framer testimonial band: a huge ghosted "Transforming Non-profits" at the top, a dotted
 * world map behind the content, then the impact stats and testimonial cards. Renders nothing
 * until something is published (loaders hide unpublished items in production and show them
 * in development with a preview note).
 */
export function ImpactBand({ stats, testimonials }: ImpactBandProps) {
  if (stats.length === 0 && testimonials.length === 0) return null;
  const preview = [...stats, ...testimonials].some((item) => !item.published);

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
      {/* map sits in the open space to the right of the headline, fading out at its edges */}
      <DottedMap
        tone="text"
        className="absolute top-[12%] right-[-6%] w-[min(72%,58rem)] [mask-image:radial-gradient(70%_70%_at_50%_50%,#000_25%,transparent_100%)] opacity-30"
      />
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
              <p className="mt-6 inline-block rounded-sm border border-dashed border-line-strong px-3 py-2 text-xs text-muted">
                Preview: unpublished content, shown in development only
              </p>
            ) : null}
          </Reveal>

          {stats.length > 0 ? (
            <Reveal>
              <dl
                className={cn(
                  "mt-12 grid gap-4",
                  STAT_COLUMNS[stats.length] ?? "sm:grid-cols-2 lg:grid-cols-4",
                )}
              >
                {stats.map((s) => (
                  <StatTile
                    key={s.id}
                    value={s.value}
                    label={s.label}
                    className="bg-surface/90 backdrop-blur-sm"
                  />
                ))}
              </dl>
            </Reveal>
          ) : null}

          {testimonials.length > 0 ? (
            <Reveal>
              <ul
                className={cn(
                  "grid gap-4",
                  stats.length > 0 ? "mt-4" : "mt-12",
                  testimonials.length > 1 && "md:grid-cols-2",
                  testimonials.length > 2 && "lg:grid-cols-3",
                )}
              >
                {testimonials.map((t) => (
                  <TestimonialCard key={t.id} testimonial={t} />
                ))}
              </ul>
            </Reveal>
          ) : null}
        </RevealGroup>
      </div>
    </Section>
  );
}
