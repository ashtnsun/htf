"use client";

import { motion } from "framer-motion";
import { DINO_COLS, DINO_EYE, DINO_ROWS, dinoCells } from "@/components/brand/dino-pixels";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { cn } from "@/lib/utils";

/**
 * The offline-page T-rex in HTF green, peeking out from behind the frosted footer. Drawn from
 * the 20×22 pixel map in brand/dino-pixels (one <rect> per filled cell, crisp edges), so it
 * scales to any size without blur. The map faces right, as the icon does; the drawing is
 * mirrored so the footer's T-rex looks left, toward the page. It rises into place once when the footer scrolls
 * into view and blinks every few seconds; both are off under prefers-reduced-motion, where
 * it is a plain element from the first update after hydration (like Reveal), so the server's
 * animated markup never mismatches. Decoration only: hidden from assistive tech.
 */
const cells = dinoCells();

type PixelDinoProps = { className?: string };

export function PixelDino({ className }: PixelDinoProps) {
  const reduce = useReducedMotionSafe();
  const drawing = (
    <svg
      viewBox={`0 0 ${DINO_COLS} ${DINO_ROWS}`}
      className="block h-auto w-full text-green drop-shadow-[0_0_18px_rgba(3,198,82,0.45)]"
      shapeRendering="crispEdges"
      focusable="false"
    >
      <g fill="currentColor" transform={`translate(${DINO_COLS} 0) scale(-1 1)`}>
        {cells.map(({ x, y }) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
        ))}
        <rect className="anim-eyelid" x={DINO_EYE.x} y={DINO_EYE.y} width={1} height={1} />
      </g>
    </svg>
  );
  if (reduce) {
    return (
      <div aria-hidden="true" className={cn("pointer-events-none select-none", className)}>
        {drawing}
      </div>
    );
  }
  return (
    <motion.div
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
      initial={{ y: "45%", opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {drawing}
    </motion.div>
  );
}
