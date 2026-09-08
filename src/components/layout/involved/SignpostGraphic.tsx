"use client";

import {
  delay,
  GraphicFrame,
  HAIRLINE,
  STROKE,
  svgProps,
} from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

const ARM_TEXT = {
  fontSize: 13,
  fontWeight: 500,
  fill: "var(--text)",
  textAnchor: "middle",
} as const;

/**
 * "Signpost": two ways in, one starting point. A post with two arms, Students pointing one
 * way and Nonprofits the other, their tips green. The arms swing into place when the
 * section scrolls into view. In place under prefers-reduced-motion.
 */
export function SignpostGraphic({ className }: InvolvedGraphicProps) {
  return (
    <GraphicFrame className={className}>
      {({ reduce }) => (
        <svg {...svgProps}>
          {/* the ground and the post */}
          <line x1="90" y1="330" x2="310" y2="330" {...HAIRLINE} />
          <rect x="195" y="100" width="10" height="230" fill="var(--surface)" {...STROKE} />
          <rect x="191" y="92" width="18" height="10" fill="var(--green)" />

          {/* Students, pointing left */}
          <g
            className="anim-involved-arm"
            style={{ transformOrigin: "204px 168px", ...delay(0.2, reduce) }}
          >
            <path
              d="M204 150H100L74 168L100 186H204Z"
              fill="var(--surface)"
              strokeLinejoin="round"
              {...STROKE}
            />
            <path d="M100 150L74 168L100 186Z" fill="var(--green)" />
            <text x="152" y="173" {...ARM_TEXT}>
              Students
            </text>
          </g>

          {/* Nonprofits, pointing right */}
          <g
            className="anim-involved-arm"
            style={{ transformOrigin: "196px 232px", ...delay(0.45, reduce) }}
          >
            <path
              d="M196 214H300L326 232L300 250H196Z"
              fill="var(--surface)"
              strokeLinejoin="round"
              {...STROKE}
            />
            <path d="M300 214L326 232L300 250Z" fill="var(--green)" />
            <text x="248" y="237" {...ARM_TEXT}>
              Nonprofits
            </text>
          </g>

          {/* the bolts */}
          <rect x="198" y="166" width="4" height="4" fill="var(--green-deep)" />
          <rect x="198" y="230" width="4" height="4" fill="var(--green-deep)" />
        </svg>
      )}
    </GraphicFrame>
  );
}
