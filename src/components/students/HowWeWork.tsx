import type { HowWeWorkStep, TeamSeat } from "@/lib/content/schemas";
import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
import { ROLE_ICONS } from "./roleIcons";

type HowWeWorkProps = {
  seats: TeamSeat[];
  steps: HowWeWorkStep[];
};

/** Team structure (1 lead + 5 developers + 1–2 designers) beside the four beats of a project year. */
export function HowWeWork({ seats, steps }: HowWeWorkProps) {
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
          <p className="mt-6 max-w-md text-muted">
            Teams are small on purpose: everyone owns a real piece of the product, and the nonprofit
            always knows who to talk to.
          </p>
          <TeamDiagram seats={seats} />
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

/** One square per seat: filled green lead, surface developers, mint-outlined designers. */
function TeamDiagram({ seats }: { seats: TeamSeat[] }) {
  return (
    <ul aria-label="Team structure" className="mt-10 flex flex-wrap gap-x-6 gap-y-5">
      {seats.map((seat) => {
        const Icon = ROLE_ICONS[seat.icon];
        const min = seat.minCount ?? seat.count;
        return (
          <li key={seat.id}>
            <div className="flex gap-2" aria-hidden="true">
              {Array.from({ length: seat.count }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-sm border",
                    seat.icon === "lead" && "border-green bg-green text-bg",
                    seat.icon === "code" && "border-line-strong bg-surface-2 text-text",
                    seat.icon === "design" && "border-mint/70 text-mint",
                    i >= min && "border-dashed opacity-60",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-text">{seat.countLabel ?? seat.count}</span>{" "}
              {seat.label}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
