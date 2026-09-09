"use client";

import { motion, type Variants } from "framer-motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import type { RecruitmentStep } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Each cell is one child of the section's RevealGroup, so the group's stagger sweeps across the row. */
const cell: Variants = { hidden: {}, show: {} };
/** The cell's piece of the rail grows from its left edge, as if drawn across the track. */
const rail: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.7, ease: EASE } },
};
/** The node pops onto the rail as the line reaches it. */
const node: Variants = {
  hidden: { scale: 0, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: EASE, delay: 0.15 } },
};
/** The text rises after the node, like Reveal but shorter. */
const text: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.2 } },
};

type StepState = "done" | "current" | "upcoming";

type TimelineTrackProps = {
  steps: RecruitmentStep[];
  /** Index of the current step, -1 while no step is marked or dated. */
  current: number;
};

/**
 * The track: a hairline grid of cells, two across on phones, three on tablets, all six on
 * desktop. Each cell's top border is its piece of the rail with the step's node at the left
 * end; after the last step the rail keeps going past the container and off the right edge of
 * the screen (the section clips it), so the line never just stops at kickoff. Inside the
 * section's RevealGroup the cells arrive left to right: the rail draws, the node pops, the
 * text rises. Segments and nodes are green up to the current step, whose node carries a ping
 * ring and whose date is green (the step numbers and the "Now" tag went in the 2026-09-09
 * reviews; `aria-current` still marks the step). Under reduced motion everything is static
 * and final (plain elements from the first update after hydration, like Reveal).
 */
export function TimelineTrack({ steps, current }: TimelineTrackProps) {
  const reduce = useReducedMotionSafe();
  const Li = reduce ? "li" : motion.li;
  const Span = reduce ? "span" : motion.span;
  const Div = reduce ? "div" : motion.div;
  const v = (variants: Variants) => (reduce ? {} : { variants });

  return (
    <ol className="mt-12 grid grid-cols-2 md:mt-16 md:grid-cols-3 lg:grid-cols-6">
      {steps.map((step, i) => {
        const state: StepState = i < current ? "done" : i === current ? "current" : "upcoming";
        const last = i === steps.length - 1;
        return (
          <Li
            key={step.id}
            {...v(cell)}
            aria-current={state === "current" ? "step" : undefined}
            className="relative pt-7 pr-5 pb-10 md:pr-6 lg:pb-2"
          >
            {/* The rail: green as far as the current step, muted beyond it. */}
            <Span
              {...v(rail)}
              aria-hidden="true"
              data-reveal=""
              className={cn(
                "absolute inset-x-0 top-0 h-px origin-left",
                state === "done" ? "bg-green" : "bg-muted/40",
              )}
            />
            {last ? (
              // The rail's run-off: from the last cell's right edge to beyond the screen.
              <Span
                {...v(rail)}
                aria-hidden="true"
                data-reveal=""
                className="absolute top-0 left-full h-px w-screen origin-left bg-muted/40"
              />
            ) : null}
            <Span
              {...v(node)}
              aria-hidden="true"
              data-reveal=""
              className={cn(
                "absolute top-0 left-0 size-3 -translate-y-1/2",
                state === "upcoming" ? "border border-muted/70 bg-bg" : "bg-green",
              )}
            >
              {state === "current" ? (
                <span className="anim-hero-ping absolute inset-0 border border-green" />
              ) : null}
            </Span>

            <Div {...v(text)} data-reveal="">
              <p
                className={cn(
                  "text-eyebrow font-medium uppercase",
                  state === "current" ? "text-green" : "text-text",
                )}
              >
                {step.when}
              </p>
              <h3 className="mt-3 text-body-lg leading-snug font-medium text-text">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.description}</p>
            </Div>
          </Li>
        );
      })}
    </ol>
  );
}
