"use client";

import { useEffect, useRef } from "react";
import { PageHeroContent, PageHeroSection } from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

/** Purdue, West Lafayette (the Atlas home hero draws its routes from the same point). */
const PURDUE = "40.4237° N  86.9212° W";
const FPS = 24;

const two = (n: number) => String(Math.floor(n)).padStart(2, "0");
function timecode(frames: number): string {
  const s = frames / FPS;
  return `${two(s / 3600)}:${two((s / 60) % 60)}:${two(s % 60)}:${two(frames % FPS)}`;
}

/** One green corner of the viewfinder: two 2px strokes meeting at the corner. */
function Corner({ className }: { className: string }) {
  return <span className={`absolute size-7 border-green md:size-9 ${className}`} />;
}

const hud = "text-[0.6875rem] font-medium tracking-[0.12em] text-muted uppercase tabular-nums";

/**
 * "Viewfinder": the hero is a camera's view. Green corner brackets lock onto the copy on load
 * (the site's `hover-corners` language, held still), a hairline crosshair marks the centre, and
 * the readouts sit in the frame's corners: a blinking REC square with a running timecode, the
 * coordinates of Purdue and the exposure. The timecode counts from zero while the page is open;
 * under reduced motion it stays at zero, nothing blinks and the brackets are already locked.
 * Decoration only.
 */
export function ViewfinderHero(props: PageHeroProps) {
  const reduce = useReducedMotionSafe();
  const codeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = codeRef.current;
    if (!el || reduce) return;
    const start = performance.now();
    let last = -1;
    let frame = requestAnimationFrame(function tick(now) {
      const frames = Math.floor(((now - start) / 1000) * FPS);
      if (frames !== last) {
        last = frames;
        el.textContent = timecode(frames);
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [reduce]);

  return (
    <PageHeroSection data-viewfinder="" className="grid-overlay [--grid-cols:8] [--grid-row:8rem]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
        {/* the centre crosshair */}
        <span className="absolute top-1/2 left-1/2 hidden h-px w-10 -translate-1/2 bg-line-strong md:block" />
        <span className="absolute top-1/2 left-1/2 hidden h-10 w-px -translate-1/2 bg-line-strong md:block" />

        <div className="relative container-max h-full container-x">
          {/* the readouts, in the corners of the framed column */}
          <p className={`absolute top-3 right-(--gutter) flex items-center gap-2 md:top-5 ${hud}`}>
            <span className="anim-blink inline-block size-2 bg-green" />
            <span className="text-text">Rec</span>
            <span ref={codeRef}>{timecode(0)}</span>
          </p>
          <p className={`absolute bottom-5 left-(--gutter) ${hud}`}>{PURDUE}</p>
          <p className={`absolute right-(--gutter) bottom-5 hidden sm:block ${hud}`}>
            ISO 400 · 1/60 · f/2.8
          </p>

          {/* the brackets, locked onto the copy */}
          <div className="anim-viewfinder-lock absolute inset-x-[calc(var(--gutter)-1rem)] top-10 bottom-14 md:inset-x-[calc(var(--gutter)-1.5rem)] md:top-14 md:bottom-20">
            <Corner className="top-0 left-0 border-t-2 border-l-2" />
            <Corner className="top-0 right-0 border-t-2 border-r-2" />
            <Corner className="bottom-0 left-0 border-b-2 border-l-2" />
            <Corner className="right-0 bottom-0 border-r-2 border-b-2" />
          </div>
        </div>
      </div>
      <PageHeroContent {...props} className="z-10" />
    </PageHeroSection>
  );
}
