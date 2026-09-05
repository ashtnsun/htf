import type { RecruitmentStep } from "@/lib/content/schemas";
import { SeasonNote } from "@/components/layout/SeasonNote";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

/** Index of the latest step whose ISO `date` is today or earlier; -1 while steps have no dates. */
function currentStepIndex(steps: RecruitmentStep[], now = new Date()): number {
  const today = now.toISOString().slice(0, 10);
  let current = -1;
  steps.forEach((step, i) => {
    if (step.date && step.date <= today) current = i;
  });
  return current;
}

/**
 * Recruitment timeline from content/recruitment.ts: callouts → applications → deadline →
 * interviews → decisions → kickoff. Each step sits on a shared rule with a square node;
 * past and current steps light up green once the steps carry dates.
 */
export function RecruitmentTimeline({ steps }: { steps: RecruitmentStep[] }) {
  if (steps.length === 0) return null;
  const current = currentStepIndex(steps);

  return (
    <Section id="timeline" aria-labelledby="timeline-title" grid className="border-t border-line">
      <RevealGroup>
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Recruitment</Eyebrow>
            <Headline
              as="h2"
              id="timeline-title"
              size="h2"
              lines={["From callouts", "*to kickoff.*"]}
              className="mt-5"
            />
          </div>
          <SeasonNote />
        </Reveal>

        <ol className="mt-14 grid gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => {
            const state = i < current ? "done" : i === current ? "current" : "upcoming";
            return (
              <li
                key={step.id}
                aria-current={state === "current" ? "step" : undefined}
                className="relative border-t border-line-strong pt-7 pr-8 md:pr-10"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -top-[5px] left-0 size-2.5",
                    state === "upcoming" ? "border border-line-strong bg-bg" : "bg-green",
                    state === "current" && "shadow-[0_0_12px_2px_rgba(3,198,82,0.6)]",
                  )}
                />
                <Reveal>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-eyebrow font-medium uppercase">
                    <span className="text-muted">Step {i + 1}</span>
                    <span className={state === "current" ? "text-green" : "text-text"}>
                      {step.when}
                    </span>
                    {state === "current" ? (
                      <span className="rounded-sm bg-green px-1.5 py-0.5 text-[0.625rem] text-bg">
                        Now
                      </span>
                    ) : null}
                  </p>
                  <h3 className="mt-4 text-h3">{step.title}</h3>
                  <p className="mt-2 text-muted">{step.description}</p>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </RevealGroup>
    </Section>
  );
}
