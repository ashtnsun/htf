"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import type { GodReveal } from "@/components/olympus/shared";
import { EASE_GLIDE } from "@/lib/motion";

/** Seconds: the dinosaur's cells switch on from START over SPREAD, then the name rises in. */
const START = 0.5;
const SPREAD = 1.4;
/** Pixels per cell: the same on every god, a whole number (the Oracle passes a bigger one). */
const CELL = 10;
/** Seconds after the flash: what revealSound.ts plays its notes against. */
export const REVEAL_CUES = { cells: START, spread: SPREAD, name: START + SPREAD + 0.2 };

/**
 * The reveal: a flash of light, the god's dinosaur (from the /dino editor) switching on cell by
 * cell in its own glow, then the god's name and the exec who leads the family. Under reduced
 * motion everything is simply there.
 */
export function GodRevealView({ reveal, cell = CELL }: { reveal: GodReveal; cell?: number }) {
  const reduce = useReducedMotionSafe();
  const { sprite, color } = reveal;
  const cells = sprite.cells.flatMap((v, i) =>
    v
      ? [{ x: i % sprite.width, y: Math.floor(i / sprite.width), fill: sprite.palette[v - 1] }]
      : [],
  );
  // 7919 is prime, so this visits every slot once: a scattered order that is the same each time.
  const delay = (i: number) => START + (((i * 7919) % cells.length) / cells.length) * SPREAD;

  return (
    <section
      aria-labelledby="god-name"
      data-olympus
      className="flex flex-col items-center text-center"
    >
      {reduce ? null : (
        <div
          aria-hidden="true"
          className="anim-olympus-flash pointer-events-none fixed inset-0 z-50 bg-white"
        />
      )}

      <div className="relative" style={{ width: sprite.width * cell, maxWidth: "100%" }}>
        <div
          aria-hidden="true"
          className="anim-olympus-glow absolute -inset-1/4"
          style={{ background: `radial-gradient(closest-side, ${color}40, transparent)` }}
        />
        <svg
          viewBox={`0 0 ${sprite.width} ${sprite.height}`}
          className="relative block h-auto w-full"
          shapeRendering="crispEdges"
          aria-hidden="true"
          focusable="false"
        >
          {cells.map(({ x, y, fill }, i) => (
            <rect
              key={`${x}-${y}`}
              className="anim-pixel-on"
              style={{ animationDelay: `${delay(i)}s` }}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
            />
          ))}
        </svg>
      </div>

      <motion.div
        className="mt-12"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE_GLIDE, delay: REVEAL_CUES.name }}
      >
        <p className="font-olympus text-sm font-semibold tracking-[0.15em] text-muted">
          Children of
        </p>
        <h2
          id="god-name"
          className="mt-3 font-olympus text-[min(12vw,5rem)] leading-none font-semibold"
        >
          {reveal.god}
        </h2>
        <p className="mt-5 text-body-lg text-muted">
          Led by <span className="font-medium text-text">{reveal.exec}</span>
        </p>
      </motion.div>
    </section>
  );
}
