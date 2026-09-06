"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Pixel dinosaur that peeks out from behind the frosted footer. Drawn as a 22×20 pixel map
 * (one <rect> per filled cell, crisp edges), so it scales to any size without blur. It rises
 * into place once when the footer scrolls into view and blinks every few seconds; both are
 * off under prefers-reduced-motion. Decoration only: hidden from assistive tech.
 */
const PIXELS = [
  "......##########......",
  ".....############.....",
  ".....##.#########.....",
  ".....############.....",
  ".....############.....",
  ".........#######......",
  ".....##########.......",
  ".........######.......",
  ".........######.......",
  ".........######.......",
  ".......########.......",
  ".......#########....##",
  "........###########.##",
  "........############..",
  ".........#########....",
  "..........########....",
  "...........#######....",
  "...........##..##.....",
  "...........##..##.....",
  "..........###..###....",
];
const COLS = PIXELS[0]!.length;
const ROWS = PIXELS.length;
/** The eye is the one empty cell inside the head (row 2, column 7); the eyelid covers it. */
const EYE = { x: 7, y: 2 };

const cells = PIXELS.flatMap((row, y) =>
  Array.from(row).flatMap((cell, x) => (cell === "#" ? [{ x, y }] : [])),
);

type PixelDinoProps = { className?: string };

export function PixelDino({ className }: PixelDinoProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
      initial={reduce ? false : { y: "45%", opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg
        viewBox={`0 0 ${COLS} ${ROWS}`}
        className="block h-auto w-full text-green drop-shadow-[0_0_18px_rgba(3,198,82,0.45)]"
        shapeRendering="crispEdges"
        focusable="false"
      >
        <g fill="currentColor">
          {cells.map(({ x, y }) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
          ))}
          <rect className="anim-eyelid" x={EYE.x} y={EYE.y} width={1} height={1} />
        </g>
      </svg>
    </motion.div>
  );
}
