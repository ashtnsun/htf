import { useId } from "react";
import { cn } from "@/lib/utils";

/** One turn of the Greek key, 6 × 6 cells: up, across, down, back in, and the baseline on. */
const KEY = ["#####.", "#...#.", "#.#.#.", "#.###.", "#.....", "######"];
const KEY_CELLS = KEY.flatMap((row, y) =>
  [...row].flatMap((ch, x) => (ch === "#" ? [{ x, y }] : [])),
);

/**
 * A running Greek key band in the site's pixel language (solid cells, crisp edges), repeated
 * across its width. Decoration only; colour comes from `currentColor`.
 */
export function Meander({ cell = 2, className }: { cell?: number; className?: string }) {
  const id = useId();
  const size = KEY.length * cell;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="100%"
      height={size}
      shapeRendering="crispEdges"
      className={cn("block", className)}
    >
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          {KEY_CELLS.map(({ x, y }) => (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill="currentColor"
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height={size} fill={`url(#${id})`} />
    </svg>
  );
}
