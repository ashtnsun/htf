"use client";

import { useEffect, useRef } from "react";
import { LOGO_GLYPHS, LOGO_WIDTH } from "@/components/brand/logo-paths";
import { cn } from "@/lib/utils";

/* Same view box as brand/Logo.tsx, so the mark lands on the header logo at one scale. */
const VIEW_TOP = -720;
const VIEW_HEIGHT = 740;
/** Pause on the finished mark before it leaves for the header. */
const HOLD_MS = 300;
/** Matches the transform transition on `.intro-mark` in globals.css. */
const FLIGHT_MS = 1100;
/** The page keeps settling after the mark lands: the longest reveal transition in globals.css. */
const SETTLE_MS = 700;

/**
 * The home page's arrival: a black screen, the <HTF/> wordmark drawing and filling in the centre
 * (the Wordmark hero's animation), then the mark flying into the header logo while the page
 * settles in underneath ("reveal"), the header logo taking over as it lands ("landed"). Whether it plays is decided before first paint by the inline script in
 * the root layout (`home/intro-script.ts`), which sets `data-intro="play"` on <html>: once per tab
 * session, on `/` only, never under reduced motion or automation (`?intro` forces it). Without
 * that attribute this renders nothing visible. Any key, click, wheel or touch skips to the end.
 * Decoration only: hidden from assistive tech, and the page is in the DOM throughout.
 */
export function HomeIntro() {
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const mark = markRef.current;
    if (root.dataset.intro !== "play" || !mark) return;

    let stopped = false;
    const timers: number[] = [];
    const skipEvents = ["keydown", "pointerdown", "wheel", "touchstart"] as const;

    const stop = () => {
      stopped = true;
      timers.forEach(clearTimeout);
      skipEvents.forEach((type) => window.removeEventListener(type, finish));
    };
    function finish() {
      stop();
      delete root.dataset.intro;
    }

    const fly = () => {
      if (stopped) return;
      const target = document.querySelector(".intro-logo")?.getBoundingClientRect();
      const from = mark.getBoundingClientRect();
      if (!target || target.width === 0 || from.width === 0) return finish();
      const scale = target.width / from.width;
      mark.style.transform = `translate(${target.left - from.left}px, ${target.top - from.top}px) scale(${scale})`;
      root.dataset.intro = "reveal";
      // The real header logo takes over where the mark lands; the page finishes fading after.
      timers.push(
        window.setTimeout(() => {
          root.dataset.intro = "landed";
          timers.push(window.setTimeout(finish, SETTLE_MS));
        }, FLIGHT_MS),
      );
    };

    // A reload that restores a scrolled position has nothing to land on: show the page.
    if (window.scrollY > 0) {
      finish();
      return;
    }

    skipEvents.forEach((type) => window.addEventListener(type, finish, { passive: true }));
    // The CSS draw started at first paint, not at hydration: wait for it to actually finish.
    Promise.all(mark.getAnimations({ subtree: true }).map((a) => a.finished)).then(() => {
      if (!stopped) timers.push(window.setTimeout(fly, HOLD_MS));
    }, finish);

    return () => {
      stop();
      // Strict Mode remounts at once and picks the intro back up; a real unmount (leaving the
      // page mid-intro) must not leave the next page hidden.
      window.setTimeout(() => {
        if (!document.querySelector(".intro-overlay")) delete root.dataset.intro;
      }, 0);
    };
  }, []);

  return (
    <div aria-hidden="true" className="intro-overlay">
      <div ref={markRef} className="intro-mark">
        <svg
          viewBox={`0 ${VIEW_TOP} ${LOGO_WIDTH} ${VIEW_HEIGHT}`}
          focusable="false"
          className="block h-auto w-full overflow-visible"
        >
          <g transform="scale(1,-1)">
            {LOGO_GLYPHS.map((glyph, i) => (
              <path
                key={i}
                d={glyph.d}
                pathLength={1}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                className={cn(
                  "anim-wordmark",
                  glyph.role === "letter"
                    ? "fill-green stroke-green"
                    : "fill-green-deep stroke-green-deep",
                )}
                style={{ animationDelay: `${0.15 + i * 0.1}s, ${1.1 + i * 0.1}s` }}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
