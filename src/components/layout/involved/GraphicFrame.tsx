"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useRef, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * true once hydrated, false on the server and during hydration. The frame reads the
 * reduced-motion preference only after that: the server cannot know it, and a first client
 * render that differs from the server's markup would leave `data-active` unpatched (React
 * does not repair attribute mismatches), so the scene would never start.
 */
const subscribeNoop = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

/** What a variant needs to know to draw itself. */
export type SceneState = {
  /** The frame has scrolled into view once (or motion is reduced): play the entrance. */
  active: boolean;
  /** prefers-reduced-motion: render the finished picture, no transitions. */
  reduce: boolean;
};

type GraphicFrameProps = {
  children: (state: SceneState) => ReactNode;
  /** A few degrees of tilt toward the pointer. Off for variants with their own pointer play. */
  tilt?: boolean;
  /** The slow floating bob. */
  float?: boolean;
  /** The soft green glow behind the scene. */
  glow?: boolean;
  className?: string;
};

/**
 * The frame every Get involved graphic shares: a square that floats (no card, no corner
 * brackets, a soft glow, a gentle bob) and tilts a few degrees toward the pointer. It
 * reports `data-active` once it has scrolled into view so the variant's one-shot animations
 * start then and its loops pause off-screen; under prefers-reduced-motion it is active from
 * the start and the variant renders its finished picture. Decoration only: every variant
 * hides its drawing from assistive tech.
 */
export function GraphicFrame({
  children,
  tilt = true,
  float = true,
  glow = true,
  className,
}: GraphicFrameProps) {
  const hydrated = useHydrated();
  const reduce = (useReducedMotion() ?? false) && hydrated;
  const frameRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, margin: "0px 0px -15% 0px" });
  const active = inView || reduce;

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = tiltRef.current;
    if (!el || !tilt || reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width - 0.5;
    const dy = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transition = "none";
    el.style.transform = `rotateX(${(-dy * 10).toFixed(2)}deg) rotateY(${(dx * 10).toFixed(2)}deg)`;
  }

  function onPointerLeave() {
    const el = tiltRef.current;
    if (!el || !tilt) return;
    el.style.transition = `transform 700ms ${EASE}`;
    el.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div
      ref={frameRef}
      data-involved=""
      data-active={active}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn(
        "group/frame relative aspect-square w-full select-none [perspective:1200px]",
        className,
      )}
    >
      {glow ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[14%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.18),transparent)]"
        />
      ) : null}
      {/* The bob and the tilt live on separate elements: a running animation would
          override an inline transform on the same one. */}
      <div className={cn("size-full", float && "anim-float")}>
        <div ref={tiltRef} className="relative size-full will-change-transform">
          {children({ active, reduce })}
        </div>
      </div>
    </div>
  );
}

/** The 400 × 400 stage every SVG variant draws on. */
export const svgProps = {
  viewBox: "0 0 400 400",
  "aria-hidden": true,
  focusable: "false",
  className: "absolute inset-0 size-full overflow-visible",
} as const;

/** Line art in the site's wireframe style. */
export const STROKE = { stroke: "var(--green)", strokeWidth: 1.5 } as const;
export const HAIRLINE = { stroke: "var(--line-strong)", strokeWidth: 1 } as const;

/** A one-shot's delay, dropped under reduced motion so the finished picture is immediate. */
export const delay = (seconds: number, reduce: boolean) => ({
  animationDelay: reduce ? "0s" : `${seconds}s`,
});
