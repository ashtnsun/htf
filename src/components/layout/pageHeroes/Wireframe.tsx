"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { packModel, projectModel, type WireModel } from "@/lib/wireframe";
import { cn } from "@/lib/utils";

/**
 * A schematic object drawn the way the SVG globe (home/Globe) is drawn: outlines on a solid,
 * turning about the vertical axis at the globe's rate and seen from the globe's tilt, in the
 * same viewBox so every inner-page hero object lands at the same size on the same centre.
 *
 * The points are rewritten per frame straight on the elements, as the globe rewrites its
 * meridian transforms; the markup itself is the same either way, so the first render matches
 * the server's and prefers-reduced-motion simply leaves the object standing still.
 */

const SPIN_DEG_PER_SEC = 4; // the globe's rate

export function Wireframe({ model, className }: { model: WireModel; className?: string }) {
  const reduce = useReducedMotion();
  const groupRef = useRef<SVGGElement>(null);
  const glowId = useId();

  const packed = useMemo(() => packModel(model), [model]);
  const initial = useMemo(() => projectModel(packed, 0), [packed]);

  useEffect(() => {
    if (reduce) return;
    const group = groupRef.current;
    if (!group) return;
    const lines = Array.from(group.querySelectorAll<SVGPolylineElement>("polyline"));
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const spin = (((now - start) / 1000) * SPIN_DEG_PER_SEC * Math.PI) / 180;
      const points = projectModel(packed, spin);
      lines.forEach((line, i) => {
        const next = points[i];
        if (next) line.setAttribute("points", next);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [packed, reduce]);

  return (
    <svg
      viewBox="-110 -110 220 220"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-auto w-full", className)}
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="55%" r="50%">
          <stop offset="0" stopColor="var(--green)" stopOpacity="0.16" />
          <stop offset="0.7" stopColor="var(--green)" stopOpacity="0.04" />
          <stop offset="1" stopColor="var(--green)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={108} fill={`url(#${glowId})`} />
      <g
        ref={groupRef}
        fill="none"
        stroke="var(--green)"
        strokeOpacity="0.75"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {initial.map((points, i) => (
          <polyline key={i} points={points} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
