"use client";

import { useId } from "react";
import { EASE, GraphicFrame, svgProps } from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/* Two jigsaw pieces meeting at x = 200: the left one carries the knob, the right one the
   socket cut to the same shape; each also has a knob on an outer edge so they read as
   puzzle pieces on their own. */
const LEFT = "M60 130H118V122A17 17 0 1 1 142 122V130H200V190H208A17 17 0 1 1 208 210H200V270H60Z";
const RIGHT =
  "M200 130H340V270H282V278A17 17 0 1 1 258 278V270H200V210H208A17 17 0 1 0 208 190H200Z";

const LABEL = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: 1.3,
  fill: "var(--text)",
} as const;

/**
 * "Puzzle": the two audiences fit. The Students piece and the Nonprofits piece start apart,
 * slide together when the section scrolls into view and lock; the outlines turn green and the
 * seam lights up. Docked and lit under prefers-reduced-motion.
 */
export function PuzzleGraphic({ className }: InvolvedGraphicProps) {
  const blurId = useId();
  return (
    <GraphicFrame className={className}>
      {({ active, reduce }) => {
        const slide = reduce ? "none" : `transform 1100ms ${EASE}`;
        const lock = reduce ? "none" : `stroke 600ms ${EASE} 900ms, opacity 700ms ${EASE} 900ms`;
        const stroke = active ? "var(--green)" : "var(--line-strong)";
        return (
          <svg {...svgProps}>
            <defs>
              <filter id={blurId} x="-200%" y="-20%" width="500%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>

            {/* the seam, lit once the pieces meet */}
            <rect
              x="197"
              y="128"
              width="6"
              height="144"
              fill="var(--green)"
              filter={`url(#${blurId})`}
              style={{ opacity: active ? 0.9 : 0, transition: lock }}
            />

            {/* Students */}
            <g style={{ transform: `translateX(${active ? 0 : -44}px)`, transition: slide }}>
              <path
                d={LEFT}
                fill="var(--surface)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                style={{ stroke, transition: lock }}
              />
              <rect x="92" y="156" width="6" height="6" fill="var(--green)" />
              <text x="104" y="166" {...LABEL}>
                STUDENTS
              </text>
            </g>

            {/* Nonprofits */}
            <g style={{ transform: `translateX(${active ? 0 : 44}px)`, transition: slide }}>
              <path
                d={RIGHT}
                fill="var(--surface)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                style={{ stroke, transition: lock }}
              />
              <rect x="228" y="236" width="6" height="6" fill="var(--green)" />
              <text x="240" y="246" {...LABEL}>
                NONPROFITS
              </text>
            </g>
          </svg>
        );
      }}
    </GraphicFrame>
  );
}
