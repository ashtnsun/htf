"use client";

import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import type { GodReveal } from "@/components/olympus/shared";
import { EASE_GLIDE } from "@/lib/motion";

/** Seconds: the dinosaur's cells switch on from START over SPREAD, then the name rises in. */
const START = 0.5;
const SPREAD = 1.4;
/** Every cell the same size on every god, a whole number of pixels. */
const CELL = 10;

/**
 * The reveal: a flash of light, the god's dinosaur (from the /dino editor) switching on cell by
 * cell in its own glow, then the god's name and the exec who leads the family. Under reduced
 * motion everything is simply there.
 */
export function GodRevealView({ reveal }: { reveal: GodReveal }) {
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
      className="mt-10 flex flex-col items-center text-center"
    >
      {reduce ? null : (
        <div
          aria-hidden="true"
          className="anim-olympus-flash pointer-events-none fixed inset-0 z-50 bg-white"
        />
      )}

      <ol aria-label={`Your word: ${reveal.word}`} className="flex gap-2">
        {[...reveal.word].map((letter, i) => (
          <li
            key={i}
            className="flex size-10 items-center justify-center bg-green font-display text-xl font-medium text-bg"
          >
            {letter}
          </li>
        ))}
      </ol>

      <div className="relative mt-12" style={{ width: sprite.width * CELL, maxWidth: "100%" }}>
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
        transition={{ duration: 1.1, ease: EASE_GLIDE, delay: START + SPREAD + 0.2 }}
      >
        <p className="text-eyebrow font-medium text-muted uppercase">Children of</p>
        <h2
          id="god-name"
          className="mt-3 font-display text-[min(13vw,5rem)] leading-none font-medium uppercase"
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
