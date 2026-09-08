"use client";

import { useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { Testimonial } from "@/lib/content/schemas";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { cn } from "@/lib/utils";

/** Cards in each half of the track: fewer than this and the loop shows a gap on wide screens. */
const MIN_CARDS_PER_HALF = 4;

type TestimonialMarqueeProps = {
  testimonials: Testimonial[];
  /** Left side of the header row, beside the pause button; the "Testimonials" eyebrow by default. */
  heading?: ReactNode;
  className?: string;
};

/**
 * Full-width testimonial band: glass cards drift left in a seamless loop (two identical
 * halves, the second hidden from assistive tech; a short list is repeated inside each half
 * so the track always outruns the viewport) over a dotted map. Used on the home Impact band
 * and the nonprofits page. It pauses through the pause button (WCAG 2.2.2) and on focus
 * inside, not on hover (2026-09-07 audit). Under prefers-reduced-motion it is a plain
 * horizontally scrollable row instead.
 */
export function TestimonialMarquee({
  testimonials,
  heading = <Eyebrow>Testimonials</Eyebrow>,
  className = "mt-16 md:mt-24",
}: TestimonialMarqueeProps) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const repeats = reduce ? 1 : Math.max(1, Math.ceil(MIN_CARDS_PER_HALF / testimonials.length));
  const duration = Math.max(36, testimonials.length * repeats * 12);

  const cards = (hidden = false) => (
    <ul className="flex items-stretch gap-4 pr-4" aria-hidden={hidden || undefined}>
      {Array.from({ length: repeats }, (_, copy) =>
        testimonials.map((t) => (
          <TestimonialCard
            key={`${copy}-${t.id}`}
            testimonial={t}
            layout="band"
            aria-hidden={copy > 0 || undefined}
          />
        )),
      )}
    </ul>
  );

  return (
    <div className={cn("relative", className)}>
      <div className="relative container-max flex items-end justify-between gap-6 container-x">
        {heading}
        {!reduce ? (
          <button
            type="button"
            aria-pressed={paused}
            aria-label="Pause the testimonials"
            onClick={() => setPaused((p) => !p)}
            className="flex size-11 items-center justify-center border border-line-strong glass text-text transition-colors duration-200 hover:border-green hover:text-green"
          >
            {paused ? (
              <Play className="size-4" aria-hidden="true" />
            ) : (
              <Pause className="size-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {reduce ? (
        <div className="relative mt-8 snap-x overflow-x-auto pb-4">
          <div className="w-max container-x">{cards()}</div>
        </div>
      ) : (
        <div
          className="relative mt-8 marquee py-1"
          data-paused={paused}
          style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
        >
          <div className="marquee-track">
            {cards()}
            {cards(true)}
          </div>
        </div>
      )}
    </div>
  );
}
