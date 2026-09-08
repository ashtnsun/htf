"use client";

import { delay, GraphicFrame, HAIRLINE, svgProps } from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/**
 * "Chat": a short message is enough to start. Your message comes first, HTF replies in green,
 * and the third bubble is someone typing. The bubbles pop in one after another when the
 * section scrolls into view; the typing dots keep going and pause off-screen. Everything is
 * simply there under prefers-reduced-motion.
 */
export function ChatGraphic({ className }: InvolvedGraphicProps) {
  return (
    <GraphicFrame className={className}>
      {({ reduce }) => (
        <svg {...svgProps}>
          {/* you */}
          <g className="anim-pop" style={delay(0.1, reduce)}>
            <text x="84" y="96" fontSize="10" fontWeight="500" fill="var(--muted)">
              You
            </text>
            <path d="M84 104H236V152H104L88 166V152H84Z" fill="var(--surface)" {...HAIRLINE} />
            <rect x="100" y="119" width="104" height="5" fill="var(--line-strong)" />
            <rect x="100" y="132" width="68" height="5" fill="var(--line-strong)" />
          </g>

          {/* HTF */}
          <g className="anim-pop" style={delay(0.7, reduce)}>
            <text
              x="316"
              y="170"
              textAnchor="end"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.2"
              fill="var(--green)"
            >
              HTF
            </text>
            <path d="M164 178H316V226H312V240L296 226H164Z" fill="var(--green)" />
            <rect x="180" y="193" width="104" height="5" fill="var(--bg)" opacity="0.75" />
            <rect x="180" y="206" width="60" height="5" fill="var(--bg)" opacity="0.75" />
          </g>

          {/* typing */}
          <g className="anim-pop" style={delay(1.3, reduce)}>
            <path d="M84 252H172V296H104L88 310V296H84Z" fill="var(--surface)" {...HAIRLINE} />
            {[110, 124, 138].map((x, i) => (
              <rect
                key={x}
                x={x}
                y="270"
                width="7"
                height="7"
                fill="var(--muted)"
                className="anim-involved-typing"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </g>
        </svg>
      )}
    </GraphicFrame>
  );
}
