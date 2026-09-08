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

type StepState = "done" | "current" | "upcoming";

/**
 * Where the node sits below the top of its row (so it lines up with the title's cap height);
 * the spine segment above it is exactly that tall. Written out as literals for Tailwind.
 */
const NODE_TOP = "top-[0.55rem]";
const ABOVE_H = "h-[0.55rem]";

/**
 * Recruitment timeline from content/recruitment.ts: callouts → applications → deadline →
 * interviews → decisions → kickoff, as one vertical timeline. A continuous spine runs down
 * the page with a square node per step; the step number and date sit to the left of the
 * spine on md+ (above the title on phones), the title and description to the right. The
 * spine and nodes light up green as far as the current step once the steps carry dates, and
 * the current step is marked "Now".
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

        <ol className="mt-14 md:mt-20">
          {steps.map((step, i) => {
            const state: StepState = i < current ? "done" : i === current ? "current" : "upcoming";
            const last = i === steps.length - 1;
            // The spine above a node is lit up to and including the current step, below it
            // only while the next step is also done.
            const litAbove = i <= current;
            const litBelow = i < current;
            return (
              <li
                key={step.id}
                aria-current={state === "current" ? "step" : undefined}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] md:grid-cols-[minmax(0,13rem)_3.5rem_minmax(0,1fr)] lg:grid-cols-[minmax(0,16rem)_4rem_minmax(0,1fr)]"
              >
                {/* Step number and date: left of the spine on md+, above the title on phones. */}
                <div className="order-2 col-start-2 md:order-none md:col-start-1 md:text-right">
                  <Reveal>
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-eyebrow font-medium uppercase md:justify-end">
                      <span className="text-muted">Step {i + 1}</span>
                      <span className={state === "current" ? "text-green" : "text-text"}>
                        {step.when}
                      </span>
                      {state === "current" ? (
                        <span className="bg-green px-1.5 py-0.5 text-[0.625rem] text-bg">Now</span>
                      ) : null}
                    </p>
                  </Reveal>
                </div>

                {/* The spine column: a node on a line that runs into the next step. */}
                <div
                  aria-hidden="true"
                  className="relative order-1 col-start-1 row-span-2 md:order-none md:col-start-2 md:row-span-1"
                >
                  {i > 0 ? (
                    <span
                      className={cn(
                        "absolute top-0 left-1/2 w-px -translate-x-1/2",
                        ABOVE_H,
                        litAbove ? "bg-green" : "bg-muted/35",
                      )}
                    />
                  ) : null}
                  {!last ? (
                    <span
                      className={cn(
                        "absolute bottom-0 left-1/2 w-px -translate-x-1/2",
                        NODE_TOP,
                        litBelow ? "bg-green" : "bg-muted/35",
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "absolute left-1/2 size-3 -translate-x-1/2",
                      NODE_TOP,
                      state === "upcoming" ? "border border-muted/60 bg-bg" : "bg-green",
                      state === "current" && "shadow-[0_0_12px_2px_rgba(3,198,82,0.6)]",
                    )}
                  />
                </div>

                {/* The gap to the next step is padding here, inside the row, so the spine column spans it. */}
                <div
                  className={cn(
                    "order-3 col-start-2 mt-3 md:order-none md:col-start-3 md:mt-0",
                    !last && "pb-12 md:pb-16",
                  )}
                >
                  <Reveal>
                    <h3 className="text-h3 leading-tight">{step.title}</h3>
                    <p className="mt-3 max-w-xl text-muted">{step.description}</p>
                  </Reveal>
                </div>
              </li>
            );
          })}
        </ol>
      </RevealGroup>
    </Section>
  );
}
