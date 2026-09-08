"use client";

import { useId } from "react";
import {
  delay,
  GraphicFrame,
  HAIRLINE,
  STROKE,
  svgProps,
} from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/**
 * "Keycap": press Enter. One big key with the return arrow on it presses itself down when
 * the section scrolls into view and the glow under it flares; it presses again while the
 * pointer is over the frame. At rest under prefers-reduced-motion.
 */
export function KeycapGraphic({ className }: InvolvedGraphicProps) {
  const blurId = useId();
  return (
    <GraphicFrame tilt={false} className={className}>
      {({ reduce }) => (
        <svg {...svgProps}>
          <defs>
            <filter id={blurId} x="-30%" y="-100%" width="160%" height="300%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          {/* the plate the key sits in */}
          <rect x="114" y="140" width="172" height="138" fill="none" {...HAIRLINE} />

          {/* the light under the key */}
          <ellipse
            cx="200"
            cy="266"
            rx="96"
            ry="14"
            fill="var(--green)"
            filter={`url(#${blurId})`}
            className="anim-involved-glow opacity-35 transition-opacity duration-200 group-hover/frame:opacity-85"
            style={delay(0.8, reduce)}
          />

          {/* the cap: its sides, its top face and the legend */}
          <g
            className="anim-involved-press transition-transform duration-200 ease-out group-hover/frame:[transform:translateY(14px)]"
            style={delay(0.8, reduce)}
          >
            <path
              d="M270 116L282 130V254L270 240Z"
              fill="var(--bg)"
              stroke="var(--green-deep)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M130 240H270L282 254H118Z"
              fill="var(--bg)"
              stroke="var(--green-deep)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <rect x="130" y="116" width="140" height="124" fill="var(--surface)" {...STROKE} />
            <path
              d="M228 150V182H176M188 170L176 182L188 194"
              fill="none"
              stroke="var(--text)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="200"
              y="216"
              textAnchor="middle"
              fontSize="12"
              fontWeight="500"
              letterSpacing="1.5"
              fill="var(--text)"
            >
              Enter
            </text>
          </g>
        </svg>
      )}
    </GraphicFrame>
  );
}
