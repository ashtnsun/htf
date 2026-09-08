import type { RecruitmentStep } from "@/lib/content/schemas";
import { SeasonNote } from "@/components/layout/SeasonNote";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { TimelineTrack } from "@/components/students/TimelineTrack";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

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
 * interviews → decisions → kickoff, as one horizontal track (students/TimelineTrack) under
 * the heading. The rail and nodes light up green as far as the current step once the steps
 * carry dates, and the current step is marked "Now".
 */
export function RecruitmentTimeline({ steps }: { steps: RecruitmentStep[] }) {
  if (steps.length === 0) return null;
  const current = currentStepIndex(steps);

  return (
    <Section id="timeline" aria-labelledby="timeline-title" grid className="border-t border-line">
      <RevealGroup stagger={0.12}>
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
        <TimelineTrack steps={steps} current={current} />
      </RevealGroup>
    </Section>
  );
}
