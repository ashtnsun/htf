import type { HowWeWorkStep } from "@/lib/content/schemas";
import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";

type HowWeWorkProps = {
  steps: HowWeWorkStep[];
};

/**
 * The heading and a photo of members on the Lawson steps (2026-09-15), beside the four beats of a
 * project year. The team-structure diagram that sat under the heading is parked in
 * ./TeamDiagram (removed 2026-09-15).
 */
export function HowWeWork({ steps }: HowWeWorkProps) {
  return (
    <Section id="how-we-work" aria-labelledby="how-title" className="border-t border-line">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <Reveal standalone>
          <Eyebrow>How we work</Eyebrow>
          <Headline
            as="h2"
            id="how-title"
            size="h2"
            lines={["One nonprofit, one team,", "*one school year.*"]}
            className="mt-5"
          />
          <div className="relative mt-10 aspect-[4/3] max-w-sm overflow-hidden border border-line bg-surface">
            <Media
              src="life.students"
              alt="Eight Hack the Future members in business attire making heart shapes with their hands on the steps of the Lawson Computer Science Building"
              fill
              sizes="384px"
              className="object-cover"
            />
          </div>
        </Reveal>

        <ol className="grid gap-4">
          {steps.map((step, i) => (
            <li key={step.id}>
              <Reveal standalone delay={i * 0.06}>
                <Card padding="lg" className="grid gap-4 sm:grid-cols-[3.5rem_1fr]">
                  <p className="font-display text-h3 font-medium text-green">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <div>
                    <h3 className="text-body-lg font-medium text-text">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted">{step.description}</p>
                  </div>
                </Card>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
