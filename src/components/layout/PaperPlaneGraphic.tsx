"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * The flight path, bottom-left to top-right. The same curve is set as `offset-path` on
 * `.anim-fly` in globals.css; keep the two in step.
 */
const FLIGHT = "M48 318C128 318 128 214 200 214S300 130 352 96";

/**
 * "Get involved" graphic: a paper plane. A dotted flight path runs from the bottom left to
 * the top right with its dots drifting along it; when the section scrolls into view the
 * plane flies the path once and settles at the end, where a few wind strokes trail it.
 * The whole thing floats (no card, a soft glow, a few degrees of tilt toward the pointer).
 * Decoration only; static at the end of the path under prefers-reduced-motion.
 */
export function PaperPlaneGraphic({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, margin: "0px 0px -15% 0px" });
  const active = inView || Boolean(reduce);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = tiltRef.current;
    if (!el || reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width - 0.5;
    const dy = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transition = "none";
    el.style.transform = `rotateX(${(-dy * 10).toFixed(2)}deg) rotateY(${(dx * 10).toFixed(2)}deg)`;
  }

  function onPointerLeave() {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transition = `transform 700ms ${EASE}`;
    el.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div
      ref={frameRef}
      data-active={active}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("relative aspect-square w-full select-none [perspective:1200px]", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[14%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.18),transparent)]"
      />
      <div ref={tiltRef} className="anim-float size-full will-change-transform">
        <svg
          viewBox="0 0 400 400"
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 size-full overflow-visible"
        >
          {/* viewfinder corners */}
          <path
            d="M16 44V16H44M356 16H384V44M384 356V384H356M44 384H16V356"
            fill="none"
            stroke="var(--line-strong)"
          />

          {/* where the flight starts */}
          <rect x="42" y="312" width="12" height="12" fill="var(--green)" />

          {/* the dotted flight path, its dots drifting toward the plane */}
          <path
            d={FLIGHT}
            fill="none"
            stroke="var(--green)"
            strokeOpacity="0.65"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="0.1 9"
            className="anim-dots"
          />

          {/* wind behind the plane once it has arrived */}
          <g
            stroke="var(--line-strong)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              opacity: active ? 1 : 0,
              transition: reduce ? "none" : `opacity 500ms ${EASE} ${active ? 2400 : 0}ms`,
            }}
          >
            <line x1="224" y1="152" x2="262" y2="130" />
            <line x1="244" y1="182" x2="276" y2="164" />
            <line x1="212" y1="118" x2="236" y2="106" />
          </g>

          {/* the plane: its nose rides the path and turns with it */}
          <g className="anim-fly" fill="var(--surface)" stroke="var(--green)" strokeWidth="2">
            <path d="M0 0L-82 -34L-59 0L-82 34Z" strokeLinejoin="round" />
            <path
              d="M0 0L-59 0L-82 34Z"
              fill="var(--green)"
              fillOpacity="0.55"
              strokeLinejoin="round"
            />
            <line x1="0" y1="0" x2="-59" y2="0" />
          </g>
        </svg>
      </div>
    </div>
  );
}
