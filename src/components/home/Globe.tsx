"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Wireframe globe (the brand's recurring motif) as pure SVG: an orthographic
 * projection of latitude/longitude circles on a sphere tilted toward the viewer.
 * Every circle is a unit <circle> with an affine transform, so the whole thing is
 * ~30 elements. Meridians spin slowly via requestAnimationFrame; static under
 * prefers-reduced-motion. The R3F version is planned for Phase 3.
 */

const R = 100; // radius in viewBox units
const TILT = (32 * Math.PI) / 180; // pole tipped toward the viewer, like the Instagram graphic
const MERIDIAN_STEP = 12; // degrees between meridian ellipses (15 total)
const PARALLEL_STEP = 15; // degrees between latitude circles
const SPIN_DEG_PER_SEC = 4;

const sinT = Math.sin(TILT);
const cosT = Math.cos(TILT);

/** SVG matrix for the meridian at longitude `lambda` (radians). */
function meridianTransform(lambda: number) {
  // Unit circle (cos φ, sin φ) -> cos φ·u + sin φ·v with u = (sin λ, cos λ·sin θ), v = (0, −cos θ)
  const ux = R * Math.sin(lambda);
  const uy = R * Math.cos(lambda) * sinT;
  const vx = 0;
  const vy = -R * cosT;
  return `matrix(${ux.toFixed(3)} ${uy.toFixed(3)} ${vx} ${vy.toFixed(3)} 0 0)`;
}

const MERIDIANS = Array.from(
  { length: 180 / MERIDIAN_STEP },
  (_, i) => (i * MERIDIAN_STEP * Math.PI) / 180,
);
const PARALLELS = Array.from(
  { length: Math.floor(180 / PARALLEL_STEP) - 1 },
  (_, i) => ((-90 + PARALLEL_STEP * (i + 1)) * Math.PI) / 180,
);

type GlobeProps = {
  className?: string;
  /** Line colour token. */
  tone?: "green" | "muted";
  /** Spin the meridians. Ignored under prefers-reduced-motion. */
  animate?: boolean;
};

export function Globe({ className, tone = "green", animate = true }: GlobeProps) {
  const reduce = useReducedMotion();
  const groupRef = useRef<SVGGElement>(null);
  const spin = animate && !reduce;

  useEffect(() => {
    if (!spin) return;
    const group = groupRef.current;
    if (!group) return;
    const circles = Array.from(group.querySelectorAll<SVGCircleElement>("circle"));
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const offset = (((now - start) / 1000) * SPIN_DEG_PER_SEC * Math.PI) / 180;
      circles.forEach((c, i) => {
        c.setAttribute("transform", meridianTransform(MERIDIANS[i]! + offset));
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [spin]);

  const stroke = tone === "green" ? "var(--green)" : "var(--muted)";

  return (
    <svg
      viewBox="-110 -110 220 220"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-auto w-full", className)}
    >
      <defs>
        <radialGradient id="globe-glow" cx="50%" cy="55%" r="50%">
          <stop offset="0" stopColor="var(--green)" stopOpacity="0.16" />
          <stop offset="0.7" stopColor="var(--green)" stopOpacity="0.04" />
          <stop offset="1" stopColor="var(--green)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={R + 8} fill="url(#globe-glow)" />
      <g
        fill="none"
        stroke={stroke}
        strokeOpacity="0.75"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      >
        <circle r={R} strokeOpacity="0.9" />
        {PARALLELS.map((phi) => (
          <ellipse
            key={phi}
            cx={0}
            cy={-R * Math.sin(phi) * cosT}
            rx={R * Math.cos(phi)}
            ry={R * Math.cos(phi) * sinT}
          />
        ))}
        <g ref={groupRef}>
          {MERIDIANS.map((lambda) => (
            <circle
              key={lambda}
              r={1}
              transform={meridianTransform(lambda)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
