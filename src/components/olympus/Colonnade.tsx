"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { EASE_IN_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** A Doric column, 11 × 17 cells: abacus, echinus, a fluted shaft (carved cells), the base. */
const COLUMN = [
  "###########",
  ".#########.",
  "..#######..",
  ...Array.from({ length: 12 }, () => "..##.#.##.."),
  ".#########.",
  "###########",
];
const COLUMN_CELLS = COLUMN.flatMap((row, y) =>
  [...row].flatMap((ch, x) => (ch === "#" ? [{ x, y }] : [])),
);

/** A new order of 0…n-1, never the one it was given (when there is another). */
function shuffled(order: readonly number[]) {
  if (order.length < 2) return [...order];
  for (;;) {
    const next = [...order];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j]!, next[i]!];
    }
    if (next.some((v, i) => v !== order[i])) return next;
  }
}

/**
 * The solved words, each standing on its own column. Every column is drawn from the start (dim
 * until its riddle is solved), so nothing moves as words arrive: the word fades in on top and
 * the column lights up. With `scramble` (the final word) a button shuffles the columns, each
 * sliding to its new place. Pixel art on its grid: 4px cells, 5px from sm.
 */
export function Colonnade({
  total,
  words,
  scramble = false,
}: {
  total: number;
  words: readonly string[];
  scramble?: boolean;
}) {
  const reduce = useReducedMotionSafe();
  const [order, setOrder] = useState(() => Array.from({ length: total }, (_, i) => i));
  // A word of eight letters or more runs into its neighbour at the full size, so they all come down.
  const longest = Math.max(0, ...words.map((word) => word.length));
  return (
    <section aria-label="Solved" className="flex w-full flex-col items-center">
      <ol
        className="grid w-full items-end"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {order.map((i) => {
          const word = words[i];
          return (
            <motion.li
              key={i}
              layout={!reduce}
              transition={{ layout: { duration: 0.8, ease: EASE_IN_OUT } }}
              className="flex flex-col items-center"
            >
              <span
                style={{ fontSize: `clamp(0.6rem, 2.6vw, ${longest >= 8 ? 0.7 : 0.9}rem)` }}
                className={cn(
                  "mb-2 h-5 font-olympus leading-5 font-semibold tracking-wide whitespace-nowrap uppercase transition-opacity duration-1000 ease-smooth",
                  word ? "opacity-100" : "opacity-0",
                )}
              >
                {word ?? ""}
              </span>
              <svg
                viewBox={`0 0 ${COLUMN[0]!.length} ${COLUMN.length}`}
                className={cn(
                  "block w-11 transition-colors duration-1000 ease-smooth sm:w-[55px]",
                  word ? "text-text" : "text-line-strong",
                )}
                shapeRendering="crispEdges"
                aria-hidden="true"
                focusable="false"
              >
                {COLUMN_CELLS.map(({ x, y }) => (
                  <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
                ))}
              </svg>
            </motion.li>
          );
        })}
      </ol>
      {scramble ? (
        <OlympusButton
          variant="secondary"
          onClick={(event) => {
            setOrder(shuffled(order));
            // After a tap, Enter belongs to the final word again, not to this button.
            if (event.detail > 0) event.currentTarget.blur();
          }}
          className="mt-6"
        >
          Scramble
        </OlympusButton>
      ) : null}
    </section>
  );
}
