"use client";

import { useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { Testimonial } from "@/lib/content/schemas";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TestimonialCard } from "@/components/ui/TestimonialCard";

/**
 * Full-width testimonial band: glass cards drift left in a seamless loop (two copies of the
 * list, the second hidden from assistive tech) over the Impact band's dotted map. It pauses
 * through the pause button (WCAG 2.2.2) and on focus inside, not on hover (2026-09-07 audit).
 * Under prefers-reduced-motion it is a plain horizontally scrollable row instead.
 */
export function TestimonialMarquee({ testimonials }: { testimonials: Testimonial[] }) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const duration = Math.max(36, testimonials.length * 12);

  const cards = (hidden = false) => (
    <ul className="flex items-stretch gap-4 pr-4" aria-hidden={hidden || undefined}>
      {testimonials.map((t) => (
        <TestimonialCard key={t.id} testimonial={t} layout="band" />
      ))}
    </ul>
  );

  return (
    <div className="relative mt-16 md:mt-24">
      <div className="relative container-max flex items-center justify-between gap-6 container-x">
        <Eyebrow>Testimonials</Eyebrow>
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
