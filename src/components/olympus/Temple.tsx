import { useId } from "react";
import { roman } from "@/components/olympus/shared";

/**
 * The /olympus home: a temple front in the site's pixel language, one column per group. One SVG
 * on a grid of cells (the Greek key and the column are the same maps as Meander and Colonnade),
 * drawn at a whole number of pixels per cell (`.temple` rounds its width down to a multiple of
 * the grid, so the pixels stay crisp). Each column with its numeral is a link; it turns green on
 * hover and focus.
 */

const COLUMN = [
  "###########",
  ".#########.",
  "..#######..",
  ...Array.from({ length: 18 }, () => "..##.#.##.."),
  ".#########.",
  "###########",
];
const KEY = ["#####.", "#...#.", "#.#.#.", "#.###.", "#.....", "######"];

const COL_W = COLUMN[0]!.length;
const GAP = 2;
const MARGIN = 2;

function cellsOf(rows: readonly string[]) {
  return rows.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === "#" ? [{ x, y }] : [])));
}

export function Temple({ count }: { count: number }) {
  const id = useId();
  const W = MARGIN * 2 + count * COL_W + (count - 1) * GAP;
  const cx = (W - 1) / 2;

  // Pediment: a low gable (about 1 in 4), its sloped edges a staircase of whole cells.
  const PED = Math.round(W / 8);
  const pediment: { x: number; y: number; edge: boolean }[] = [];
  let prev = 0;
  for (let r = 0; r < PED; r += 1) {
    const half = Math.round(((r + 1) / PED) * (W / 2));
    for (let x = Math.ceil(cx - half); x <= Math.floor(cx + half); x += 1) {
      const fromCentre = Math.abs(x - cx);
      pediment.push({ x, y: r, edge: fromCentre > prev - 1 || r === 0 });
    }
    prev = half;
  }

  // Entablature: cornice, the Greek key frieze, architrave.
  const cornice = PED;
  const frieze = cornice + 2;
  const architrave = frieze + KEY.length + 1;
  const shaftTop = architrave + 2;
  const stepTop = shaftTop + COLUMN.length;
  const labelY = stepTop + 4 + 9;
  const H = labelY + 3;

  const column = cellsOf(COLUMN);
  const key = cellsOf(KEY);

  return (
    <nav aria-label="Groups" className="w-[min(56rem,calc(100vw_-_2rem))] self-center">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="temple mx-auto block h-auto"
        style={{ "--temple-cells": W } as React.CSSProperties}
        shapeRendering="crispEdges"
      >
        <defs>
          <pattern id={id} width={KEY[0]!.length} height={KEY.length} patternUnits="userSpaceOnUse">
            {key.map(({ x, y }) => (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                className="fill-green-deep"
              />
            ))}
          </pattern>
        </defs>

        <g aria-hidden="true">
          {pediment.map(({ x, y, edge }) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              className={edge ? "fill-text" : "fill-surface"}
            />
          ))}
          <rect x={0} y={cornice} width={W} height={2} className="fill-text" />
          <rect x={0} y={frieze + 1} width={W} height={KEY.length} fill={`url(#${id})`} />
          <rect x={2} y={architrave} width={W - 4} height={2} className="fill-text" />
          <rect x={2} y={stepTop} width={W - 4} height={2} className="fill-text" />
          <rect x={0} y={stepTop + 2} width={W} height={2} className="fill-text" />
        </g>

        {Array.from({ length: count }, (_, i) => {
          const x0 = MARGIN + i * (COL_W + GAP);
          return (
            <a
              key={i}
              href={`/olympus/${i + 1}`}
              aria-label={`Group ${roman(i + 1)}`}
              className="group text-text transition-colors hover:text-green focus-visible:text-green"
            >
              {/* the whole bay is the target, not only the drawn cells */}
              <rect
                x={x0 - Math.floor(GAP / 2)}
                y={shaftTop}
                width={COL_W + GAP}
                height={H - shaftTop}
                fill="transparent"
              />
              {column.map(({ x, y }) => (
                <rect
                  key={`${x}-${y}`}
                  x={x0 + x}
                  y={shaftTop + y}
                  width={1}
                  height={1}
                  fill="currentColor"
                />
              ))}
              <text
                x={x0 + COL_W / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={5}
                fill="currentColor"
                className="font-olympus font-semibold"
              >
                {roman(i + 1)}
              </text>
            </a>
          );
        })}
      </svg>
    </nav>
  );
}
