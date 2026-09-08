import { Suspense } from "react";
import type { ExecMember } from "@/lib/content/schemas";
import { ExecBoard, ExecBoardView } from "@/components/about/ExecBoard";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

type ExecGridProps = {
  members: ExecMember[];
  /** Board years, newest first (`getExecYears()`); the first is the default board. */
  years: string[];
};

/**
 * Exec board section: heading, blurb, then a chip per school year and the selected board's
 * cards (4:5 photo, name, role, LinkedIn cell). The board switch lives in `ExecBoard`
 * (client, `?board=` in the URL); the static HTML carries the newest board.
 */
export function ExecGrid({ members, years }: ExecGridProps) {
  const [newest] = years;
  if (members.length === 0 || !newest) return null;
  return (
    <Section id="exec" aria-labelledby="exec-title" grid className="border-t border-line">
      <RevealGroup>
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Exec board</Eyebrow>
            <Headline
              as="h2"
              id="exec-title"
              size="h2"
              lines={["The people", "*running it.*"]}
              className="mt-5"
            />
          </div>
          <p className="max-w-sm text-muted">
            The exec board runs recruitment, nonprofit intake and the project cycle. [TODO: how to
            reach the board, or a line about elections.]
          </p>
        </Reveal>
        <Reveal className="mt-12">
          <Suspense fallback={<ExecBoardView members={members} years={years} year={newest} />}>
            <ExecBoard members={members} years={years} />
          </Suspense>
        </Reveal>
      </RevealGroup>
    </Section>
  );
}
