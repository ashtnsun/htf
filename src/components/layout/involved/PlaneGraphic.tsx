"use client";

import { EASE, GraphicFrame, svgProps } from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/**
 * The flight path, bottom-left to top-right. The same curve is set as `offset-path` on
 * `.anim-fly` in globals.css; keep the two in step.
 */
const FLIGHT = "M48 318C128 318 128 214 200 214S300 130 352 96";

/**
 * "Plane": a paper plane, the message on its way. A dotted flight path runs from the bottom
 * left to the top right with its dots drifting along it; when the section scrolls into view
 * the plane flies the path once and settles at the end, where a few wind strokes trail it.
 * Static at the end of the path under prefers-reduced-motion.
 */
export function PlaneGraphic({ className }: InvolvedGraphicProps) {
  return (
    <GraphicFrame className={className}>
      {({ active, reduce }) => (
        <svg {...svgProps}>
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
      )}
    </GraphicFrame>
  );
}
