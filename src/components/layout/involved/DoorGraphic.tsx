"use client";

import { useState } from "react";
import { EASE, GraphicFrame } from "@/components/layout/involved/GraphicFrame";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";

/** How far the door stands open on its own, and with the pointer near, in degrees. */
const REST = 58;
const WIDE = 74;

/**
 * "Door": the door is open and the light is on inside. It swings open when the section
 * scrolls into view, spills a wedge of light across the floor, and opens wider while the
 * pointer is over it. Built from boxes (a real 3D turn on the leaf) rather than SVG. Under
 * prefers-reduced-motion it simply stands open.
 */
export function DoorGraphic({ className }: InvolvedGraphicProps) {
  const [near, setNear] = useState(false);
  return (
    <GraphicFrame tilt={false} className={className}>
      {({ active, reduce }) => {
        const angle = !active ? 0 : near && !reduce ? WIDE : REST;
        const open = angle / WIDE;
        const transition = reduce
          ? "none"
          : `transform 1200ms ${EASE}, opacity 900ms ${EASE}, background-color 600ms ${EASE}`;
        return (
          <div
            aria-hidden="true"
            onPointerEnter={() => setNear(true)}
            onPointerLeave={() => setNear(false)}
            className="absolute inset-0"
          >
            {/* the floor */}
            <div className="absolute inset-x-[8%] top-[78%] h-px bg-line-strong" />

            {/* the opening, lit from inside */}
            <div
              className="absolute top-[16%] left-[31%] h-[62%] w-[38%] border border-green bg-[linear-gradient(180deg,rgba(3,198,82,0.32),rgba(3,198,82,0.06))]"
              style={{ opacity: active ? 1 : 0.4, transition }}
            />

            {/* the light across the floor */}
            <div
              className="absolute top-[78%] left-[31%] h-[13%] w-[52%] origin-top-left bg-[linear-gradient(90deg,rgba(3,198,82,0.45),rgba(3,198,82,0))] [clip-path:polygon(0_0,70%_0,100%_100%,0_100%)]"
              style={{
                opacity: active ? 1 : 0,
                transform: `scaleX(${(0.2 + 0.8 * open).toFixed(3)})`,
                transition,
              }}
            />

            {/* the leaf, turning on its hinge */}
            <div className="absolute top-[16%] left-[31%] h-[62%] w-[38%] [perspective:800px]">
              <div
                className="relative size-full origin-left border border-green bg-surface"
                style={{ transform: `rotateY(${-angle}deg)`, transition }}
              >
                <div className="absolute inset-x-[18%] top-[9%] h-[34%] border border-line-strong" />
                <div className="absolute inset-x-[18%] bottom-[9%] h-[34%] border border-line-strong" />
                <div className="absolute top-1/2 right-[12%] h-[2.5%] w-[13%] -translate-y-1/2 bg-green" />
              </div>
            </div>

            {/* the mat */}
            <div className="absolute top-[81%] left-[37%] h-[6%] w-[26%] [transform:skewX(-32deg)] border border-line-strong" />
          </div>
        );
      }}
    </GraphicFrame>
  );
}
