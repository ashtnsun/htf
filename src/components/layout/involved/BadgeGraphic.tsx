"use client";

import { LOGO_GLYPHS, LOGO_WIDTH } from "@/components/brand/logo-paths";
import {
  GraphicFrame,
  HAIRLINE,
  STROKE,
  svgProps,
} from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/** The wordmark at 96 units wide on the card (font units, y flipped like brand/Logo). */
const LOGO_SCALE = 96 / LOGO_WIDTH;

/**
 * "Badge": you belong here. A member badge on its lanyard, with the <HTF/> mark, a photo,
 * the name lines and the cycle it was issued for (the open cycle's name, or the academic
 * year). It drops in from above when the section scrolls into view and swings to rest.
 * Hanging still under prefers-reduced-motion.
 */
export function BadgeGraphic({ season, academicYear, className }: InvolvedGraphicProps) {
  const issued = (season?.cycleName ?? academicYear).toUpperCase();
  return (
    <GraphicFrame className={className}>
      {() => (
        <svg {...svgProps}>
          <g className="anim-involved-drop">
            <g className="anim-involved-swing">
              {/* the lanyard and its clip */}
              <path d="M148 -24L196 96" stroke="var(--green-deep)" strokeWidth="7" />
              <path d="M252 -24L204 96" stroke="var(--green-deep)" strokeWidth="7" />
              <rect x="188" y="92" width="24" height="14" fill="var(--surface)" {...STROKE} />
              <rect x="196" y="106" width="8" height="10" fill="var(--line-strong)" />

              {/* the card */}
              <rect x="120" y="116" width="160" height="206" fill="var(--surface)" {...STROKE} />
              <rect x="186" y="126" width="28" height="6" fill="var(--bg)" {...HAIRLINE} />

              {/* the wordmark */}
              <g transform={`translate(152 170) scale(${LOGO_SCALE} ${-LOGO_SCALE})`}>
                {LOGO_GLYPHS.map((glyph, i) => (
                  <path
                    key={i}
                    d={glyph.d}
                    fill={glyph.role === "letter" ? "var(--green)" : "var(--green-deep)"}
                  />
                ))}
              </g>

              {/* the photo */}
              <rect x="138" y="188" width="54" height="62" fill="var(--bg)" {...HAIRLINE} />
              <circle cx="165" cy="209" r="9" fill="var(--line-strong)" />
              <path
                d="M147 250C147 236 155 228 165 228S183 236 183 250Z"
                fill="var(--line-strong)"
              />

              {/* the name lines */}
              <rect x="204" y="196" width="58" height="7" fill="var(--text)" opacity="0.85" />
              <rect x="204" y="212" width="40" height="5" fill="var(--line-strong)" />
              <rect x="204" y="226" width="48" height="5" fill="var(--line-strong)" />

              {/* issued for */}
              <text
                x="138"
                y="276"
                fontSize="10"
                fontWeight="500"
                letterSpacing="1.5"
                fill="var(--muted)"
              >
                {issued}
              </text>

              {/* the band */}
              <rect x="120" y="290" width="160" height="32" fill="var(--green)" />
              <text
                x="200"
                y="311"
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                letterSpacing="2.5"
                fill="var(--bg)"
              >
                MEMBER
              </text>
            </g>
          </g>
        </svg>
      )}
    </GraphicFrame>
  );
}
