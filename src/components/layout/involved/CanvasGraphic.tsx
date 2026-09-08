"use client";

import { GraphicFrame, HAIRLINE, svgProps } from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/** A pointer arrow with its tip at the origin. */
const CURSOR = "M0 0L0 18L4.8 13.6L8 21L11.4 19.5L8.2 12.3L14.4 12.1Z";

/**
 * "Canvas": building it together. A design canvas holds a wireframe of the app; a student's
 * cursor and a nonprofit's cursor move around it, each with an element selected (the classic
 * handles), like a shared file. The cursors loop slowly and pause off-screen; under
 * prefers-reduced-motion they rest on their selections.
 */
export function CanvasGraphic({ className }: InvolvedGraphicProps) {
  return (
    <GraphicFrame className={className}>
      {() => (
        <svg {...svgProps}>
          {/* the artboard and its name */}
          <text x="72" y="76" fontSize="10" fontWeight="500" fill="var(--muted)">
            Home
          </text>
          <rect x="72" y="86" width="256" height="228" fill="var(--surface)" {...HAIRLINE} />

          {/* nav bar */}
          <rect x="72" y="86" width="256" height="26" fill="var(--surface-2)" />
          <rect x="84" y="95" width="8" height="8" fill="var(--green)" />
          <rect x="100" y="97" width="28" height="4" fill="var(--line-strong)" />
          <rect x="136" y="97" width="22" height="4" fill="var(--line-strong)" />
          <rect x="166" y="97" width="26" height="4" fill="var(--line-strong)" />
          <rect x="288" y="93" width="28" height="12" fill="var(--green)" />

          {/* hero: headline, copy, the button */}
          <rect x="92" y="130" width="120" height="8" fill="var(--text)" opacity="0.85" />
          <rect x="92" y="146" width="92" height="8" fill="var(--green)" />
          <rect x="92" y="166" width="140" height="4" fill="var(--line-strong)" />
          <rect x="92" y="176" width="112" height="4" fill="var(--line-strong)" />
          <rect x="92" y="194" width="44" height="14" fill="var(--green)" />

          {/* the picture */}
          <rect x="244" y="126" width="64" height="82" fill="var(--bg)" {...HAIRLINE} />
          <path
            d="M252 198L266 180L276 192L284 184L300 200"
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* two cards */}
          <rect x="92" y="230" width="104" height="68" fill="var(--bg)" {...HAIRLINE} />
          <rect x="104" y="242" width="36" height="6" fill="var(--text)" opacity="0.8" />
          <rect x="104" y="256" width="70" height="4" fill="var(--line-strong)" />
          <rect x="104" y="266" width="56" height="4" fill="var(--line-strong)" />
          <rect x="204" y="230" width="104" height="68" fill="var(--bg)" {...HAIRLINE} />
          <rect x="216" y="242" width="44" height="6" fill="var(--text)" opacity="0.8" />
          <rect x="216" y="256" width="72" height="4" fill="var(--line-strong)" />
          <rect x="216" y="266" width="50" height="4" fill="var(--line-strong)" />

          {/* the student's selection: the button, with handles */}
          <g fill="var(--green)" stroke="var(--green)" strokeWidth="1">
            <rect x="89" y="191" width="50" height="20" fill="none" />
            <rect x="87" y="189" width="4" height="4" />
            <rect x="137" y="189" width="4" height="4" />
            <rect x="87" y="209" width="4" height="4" />
            <rect x="137" y="209" width="4" height="4" />
          </g>

          {/* the nonprofit's selection: the first card, dashed */}
          <rect
            x="89"
            y="227"
            width="110"
            height="74"
            fill="none"
            stroke="var(--green)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* the student's cursor */}
          <g className="anim-involved-cursor-a">
            <path d={CURSOR} fill="var(--text)" stroke="var(--bg)" strokeWidth="1" />
            <rect x="16" y="18" width="52" height="16" fill="var(--green)" />
            <text x="22" y="29.5" fontSize="10" fontWeight="500" fill="var(--bg)">
              Student
            </text>
          </g>

          {/* the nonprofit's cursor */}
          <g className="anim-involved-cursor-b">
            <path d={CURSOR} fill="var(--text)" stroke="var(--bg)" strokeWidth="1" />
            <rect
              x="16"
              y="18"
              width="62"
              height="16"
              fill="var(--surface-2)"
              stroke="var(--green)"
              strokeWidth="1"
            />
            <text x="22" y="29.5" fontSize="10" fontWeight="500" fill="var(--text)">
              Nonprofit
            </text>
          </g>
        </svg>
      )}
    </GraphicFrame>
  );
}
