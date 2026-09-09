import type { RecruitmentStep } from "@/lib/content/schemas";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { TimelineTrack } from "@/components/students/TimelineTrack";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

/**
 * Index of the step the club is on: the last step flagged `current` in content, or, once
 * the steps carry ISO dates, the latest whose date is today or earlier; -1 with neither.
 */
function currentStepIndex(steps: RecruitmentStep[], now = new Date()): number {
  const flagged = steps.findLastIndex((step) => step.current);
  if (flagged >= 0) return flagged;
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
 * the heading. The rail and nodes light up green as far as the current step, which is
 * marked "Now" (the deadline note under the heading went in the 2026-09-09 review). The
 * section clips sideways so the rail can run off the right edge of the screen.
 */
export function RecruitmentTimeline({ steps }: { steps: RecruitmentStep[] }) {
  if (steps.length === 0) return null;
  const current = currentStepIndex(steps);

  return (
    <Section
      id="timeline"
      aria-labelledby="timeline-title"
      grid
      className="overflow-x-clip border-t border-line"
    >
      <RevealGroup stagger={0.12}>
        <Reveal>
          <Eyebrow>Recruitment</Eyebrow>
          <Headline
            as="h2"
            id="timeline-title"
            size="h2"
            lines={["From callouts", "*to kickoff.*"]}
            className="mt-5"
          />
        </Reveal>
        <TimelineTrack steps={steps} current={current} />
      </RevealGroup>
    </Section>
  );
}
