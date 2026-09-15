"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Testimonial } from "@/lib/content/schemas";
import { Reveal } from "@/components/motion/Reveal";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { cn } from "@/lib/utils";

/** Cards in each half of the track: fewer than this and the loop shows a gap on wide screens. */
const MIN_CARDS_PER_HALF = 4;

type TestimonialMarqueeProps = {
  testimonials: Testimonial[];
  /** The label on the pause button's line; the "Testimonials" eyebrow by default. */
  heading?: ReactNode;
  /** An optional title under that line (the nonprofits page's headline). */
  title?: ReactNode;
  className?: string;
};

/**
 * Testimonial band: glass cards drift left in a seamless loop (two identical halves, the
 * second hidden from assistive tech; a short list is repeated inside each half so the track
 * always outruns the viewport). The track is clipped to the page container, so the cards
 * fade out on the same lines the heading sits between, not at the window edges
 * (2026-09-10); once measured, each card carries that fade itself, so its thin glass blurs
 * the map behind it (2026-09-11). Used on the home Impact band and the nonprofits page. The pause button (WCAG 2.2.2) sits on the label's line, centred on it
 * (2026-09-09 review); the marquee also pauses on focus inside, not on hover (2026-09-07
 * audit). Under prefers-reduced-motion it is a plain horizontally scrollable row instead
 * (from the first update after hydration, like Reveal, so the server markup matches).
 */
export function TestimonialMarquee({
  testimonials,
  heading = <Eyebrow>Testimonials</Eyebrow>,
  title,
  className = "mt-16 md:mt-24",
}: TestimonialMarqueeProps) {
  const reduce = useReducedMotionSafe();
  const [paused, setPaused] = useState(false);
  const repeats = reduce ? 1 : Math.max(1, Math.ceil(MIN_CARDS_PER_HALF / testimonials.length));
  const duration = Math.max(36, testimonials.length * repeats * 12);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Hands the end fade from the band to the cards, so their glass blurs the map behind (see
  // the marquee utility in globals.css): measures the band, one copy of the list and each
  // card's place in the track, again whenever a width changes. Without @property the
  // progress would not animate, so those browsers keep the band's fade and unblurred cards.
  // Also pauses the loop while the band is off screen.
  useEffect(() => {
    const marquee = marqueeRef.current;
    const track = trackRef.current;
    if (!marquee || !track) return;

    const view = new IntersectionObserver((entries) => {
      for (const entry of entries) marquee.toggleAttribute("data-offscreen", !entry.isIntersecting);
    });
    view.observe(marquee);
    if (!("registerProperty" in CSS)) return () => view.disconnect();

    const measure = () => {
      const secondCopy = track.children[1];
      if (!secondCopy) return;
      // Card and track move together, so the difference of their boxes is the resting offset.
      const origin = track.getBoundingClientRect().left;
      marquee.style.setProperty("--marquee-w", `${marquee.getBoundingClientRect().width}px`);
      marquee.style.setProperty(
        "--marquee-half",
        `${secondCopy.getBoundingClientRect().left - origin}px`,
      );
      for (const card of track.querySelectorAll<HTMLElement>(":scope > ul > li")) {
        card.style.setProperty("--card-x", `${card.getBoundingClientRect().left - origin}px`);
      }
      marquee.toggleAttribute("data-card-fade", true);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(marquee);
    resize.observe(track);

    return () => {
      view.disconnect();
      resize.disconnect();
      marquee.toggleAttribute("data-card-fade", false);
    };
  }, [reduce, repeats, testimonials]);

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
      <Reveal standalone className="relative container-max container-x">
        <div className="flex items-center justify-between gap-6">
          {heading}
          {!reduce ? (
            <button
              type="button"
              aria-pressed={paused}
              aria-label="Pause the testimonials"
              onClick={() => setPaused((p) => !p)}
              className="flex size-11 shrink-0 items-center justify-center border border-line-strong glass text-text transition-colors hover:border-green hover:text-green"
            >
              {paused ? (
                <Play className="size-4" aria-hidden="true" />
              ) : (
                <Pause className="size-4" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
        {title}
      </Reveal>

      {reduce ? (
        <div className="relative mt-8 snap-x overflow-x-auto pb-4">
          <div className="w-max container-x">{cards()}</div>
        </div>
      ) : (
        <div className="relative container-max mt-8 container-x">
          <div
            ref={marqueeRef}
            className="marquee py-1"
            data-paused={paused}
            style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
          >
            <div ref={trackRef} className="marquee-track">
              {cards()}
              {cards(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
