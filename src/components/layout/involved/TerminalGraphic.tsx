"use client";

import { useEffect, useState } from "react";
import {
  delay,
  GraphicFrame,
  HAIRLINE,
  svgProps,
  type SceneState,
} from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

const COMMAND = "htf apply";
/** Seconds before the first character and between characters. */
const TYPE_START = 0.4;
const TYPE_STEP = 0.1;
const TYPED = TYPE_START + COMMAND.length * TYPE_STEP;

/**
 * The command, typed one character at a time from timers once the scene is active (a CSS
 * step per character proved unreliable: Chromium dropped the fill of some of the tiny
 * animations). Complete at once under prefers-reduced-motion.
 */
function TypedCommand({ active, reduce }: SceneState) {
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (!active || reduce) return;
    const timers = Array.from(COMMAND, (_, i) =>
      window.setTimeout(() => setTyped(i + 1), (TYPE_START + i * TYPE_STEP) * 1000),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, reduce]);
  const shown = reduce ? COMMAND.length : typed;
  return (
    <text x="94" y="157" fill="var(--text)">
      {COMMAND.slice(0, shown)}
    </text>
  );
}

/**
 * "Terminal": apply, in the language the developers speak. A command line types out
 * `htf apply`, prints a few lines back, confirms with a check, and a new prompt blinks. The
 * typing starts when the section scrolls into view; the cursor's blink pauses off-screen.
 * Everything is printed under prefers-reduced-motion.
 */
export function TerminalGraphic({ className }: InvolvedGraphicProps) {
  return (
    <GraphicFrame className={className}>
      {({ active, reduce }) => (
        <svg {...svgProps}>
          {/* the window */}
          <rect x="64" y="104" width="272" height="192" fill="var(--bg)" {...HAIRLINE} />
          <rect x="64" y="104" width="272" height="24" fill="var(--surface)" />
          <line x1="64" y1="128" x2="336" y2="128" {...HAIRLINE} />
          <rect x="76" y="113" width="6" height="6" fill="var(--line-strong)" />
          <rect x="90" y="113" width="6" height="6" fill="var(--line-strong)" />
          <rect x="104" y="113" width="6" height="6" fill="var(--green)" />

          <g className="font-mono" fontSize="12.5">
            {/* the command, typed */}
            <text x="80" y="157" fill="var(--green)">
              $
            </text>
            <TypedCommand active={active} reduce={reduce} />

            {/* what comes back */}
            {[
              [172, 120],
              [188, 84],
              [204, 150],
            ].map(([y, width], i) => (
              <rect
                key={y}
                x="94"
                y={y}
                width={width}
                height="5"
                fill="var(--line-strong)"
                className="anim-type"
                style={delay(TYPED + 0.3 + i * 0.25, reduce)}
              />
            ))}

            {/* the confirmation */}
            <g className="anim-involved-fade" style={delay(TYPED + 1.3, reduce)}>
              <path
                d="M82 232L87 237L96 227"
                fill="none"
                stroke="var(--green)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="104" y="238" fill="var(--green)">
                sent
              </text>
            </g>

            {/* the next prompt */}
            <g className="anim-involved-fade" style={delay(TYPED + 1.7, reduce)}>
              <text x="80" y="268" fill="var(--green)">
                $
              </text>
              <rect
                x="94"
                y="257"
                width="8"
                height="14"
                fill="var(--green)"
                className="anim-blink"
              />
            </g>
          </g>
        </svg>
      )}
    </GraphicFrame>
  );
}
