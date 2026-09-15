"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Media } from "@/components/ui/Media";
import { cn } from "@/lib/utils";

export type AwardPhotoSlide = { src: string; alt: string };

/** How long each photo shows before the next one fades in. */
const ROTATE_MS = 7000;

const control =
  "glass flex size-11 items-center justify-center border border-line-strong text-text transition-colors hover:border-green hover:text-green [--glass-alpha:70%]";

/**
 * Photo carousel for the awards block: one 3:2 photo at a time, crossfading to the next every
 * seven seconds (2026-09-15), with previous / next buttons, a pause button (WCAG 2.2.2) and a
 * counter over the photo (only when there is more than one). The rotation also holds while
 * the pointer or focus is inside and while the carousel is off screen; a manual step restarts
 * the timer. Under reduced motion it never rotates on its own and the pause button is gone.
 * The counter is a polite live region only while the rotation is stopped, so a screen reader
 * is not interrupted every seven seconds. No caption (2026-09-07 audit); the photo's alt text
 * carries its description.
 */
export function AwardCarousel({ photos }: { photos: AwardPhotoSlide[] }) {
  const reduce = useReducedMotionSafe();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = photos.length;
  const rotating = count > 1 && !reduce && !paused && !held && onScreen;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const view = new IntersectionObserver(([entry]) => setOnScreen(entry?.isIntersecting ?? false));
    view.observe(node);
    return () => view.disconnect();
  }, []);

  // `index` is a dependency so a manual step restarts the full interval.
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, index, count]);

  if (count === 0) return null;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label="Award photos"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
      }}
      className="relative mt-6 aspect-[3/2] overflow-hidden border border-line bg-surface"
    >
      {photos.map((photo, i) => (
        <div
          key={photo.src}
          aria-hidden={i !== index || undefined}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-smooth",
            i === index ? "opacity-100" : "opacity-0",
          )}
        >
          <Media
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1440px) 1296px, 100vw"
            className="object-cover"
          />
        </div>
      ))}
      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className={cn(control, "absolute top-1/2 left-4 -translate-y-1/2")}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className={cn(control, "absolute top-1/2 right-4 -translate-y-1/2")}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <div className="absolute right-4 bottom-4 flex items-stretch gap-2">
            {!reduce ? (
              <button
                type="button"
                aria-pressed={paused}
                aria-label="Pause the photo rotation"
                onClick={() => setPaused((p) => !p)}
                className={control}
              >
                {paused ? (
                  <Play className="size-4" aria-hidden="true" />
                ) : (
                  <Pause className="size-4" aria-hidden="true" />
                )}
              </button>
            ) : null}
            <span
              aria-live={rotating ? "off" : "polite"}
              className="flex items-center border border-line-strong glass px-2.5 text-xs text-muted tabular-nums [--glass-alpha:70%]"
            >
              {index + 1} / {count}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
