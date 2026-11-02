import { roman } from "@/components/olympus/shared";

/**
 * The /olympus home: a temple front in the site's pixel language, one column per group. One SVG
 * on a grid of cells (the Greek key and the column are the same maps as Meander and Colonnade),
 * drawn at a whole number of pixels per cell (`.temple` rounds its width down to a multiple of
 * the grid, so the pixels stay crisp). Each column with its numeral is a link; it turns green on
 * hover and focus.
 *
 * On a full page load the temple builds itself pixel by pixel from the steps up to the roof
 * (TempleBuild switches each path on at its `data-at` second, set by its row and a little
 * scatter), then everything marked `temple-after` fades in. Cells that come on in the same 40ms
 * share one path, so the drawing stays a few hundred elements, not thousands.
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

/** Seconds: the build runs bottom to top over BUILD, each cell up to SCATTER early or late. */
const BUILD = 2;
const SCATTER = 0.35;
const BUCKET = 0.04;

type Cell = { x: number; y: number };

function cellsOf(rows: readonly string[], x0 = 0, y0 = 0): Cell[] {
  return rows.flatMap((row, y) =>
    [...row].flatMap((ch, x) => (ch === "#" ? [{ x: x0 + x, y: y0 + y }] : [])),
  );
}

function rowCells(y: number, from: number, to: number, height = 1): Cell[] {
  return Array.from({ length: height }, (_, dy) =>
    Array.from({ length: to - from }, (_, dx) => ({ x: from + dx, y: y + dy })),
  ).flat();
}

/** Cells grouped by the moment they switch on: one path per moment. */
function paths(cells: readonly Cell[], top: number) {
  const groups = new Map<number, string[]>();
  for (const { x, y } of cells) {
    // A fixed scatter per cell (no randomness, so server and client draw the same thing).
    const scatter = (((x * 7919 + y * 104729) % 97) / 97 - 0.5) * SCATTER;
    const delay = Math.max(0, (1 - y / top) * BUILD + scatter);
    const bucket = Math.round(delay / BUCKET);
    const d = groups.get(bucket) ?? [];
    d.push(`M${x} ${y}h1v1h-1z`);
    groups.set(bucket, d);
  }
  return [...groups].map(([bucket, d]) => ({ delay: bucket * BUCKET, d: d.join("") }));
}

function Cells({ cells, top, className }: { cells: Cell[]; top: number; className?: string }) {
  return paths(cells, top).map(({ delay, d }) => (
    <path key={delay} d={d} data-at={delay.toFixed(2)} className={className} />
  ));
}

/** `base`: where the columns lead (the /olympuz snapshot passes its own). */
export function Temple({ count, base = "/olympus" }: { count: number; base?: string }) {
  const W = MARGIN * 2 + count * COL_W + (count - 1) * GAP;
  const cx = (W - 1) / 2;

  // Pediment: a low gable (about 1 in 4), its sloped edges a staircase of whole cells.
  const PED = Math.round(W / 8);
  const edge: Cell[] = [];
  const tympanum: Cell[] = [];
  let prev = 0;
  for (let y = 0; y < PED; y += 1) {
    const half = Math.round(((y + 1) / PED) * (W / 2));
    for (let x = Math.ceil(cx - half); x <= Math.floor(cx + half); x += 1) {
      (Math.abs(x - cx) > prev - 1 || y === 0 ? edge : tympanum).push({ x, y });
    }
    prev = half;
  }

  // Entablature: cornice, the Greek key frieze, architrave; then the columns and two steps.
  const cornice = PED;
  const frieze = cornice + 3;
  const architrave = frieze + KEY.length + 1;
  const shaftTop = architrave + 2;
  const stepTop = shaftTop + COLUMN.length;
  const labelY = stepTop + 4 + 9;
  const H = labelY + 3;
  const top = stepTop + 4;

  const white = [
    ...edge,
    ...rowCells(cornice, 0, W, 2),
    ...rowCells(architrave, 2, W - 2, 2),
    ...rowCells(stepTop, 2, W - 2, 2),
    ...rowCells(stepTop + 2, 0, W, 2),
  ];
  const key = Array.from({ length: Math.ceil(W / KEY[0]!.length) }, (_, i) =>
    cellsOf(KEY, i * KEY[0]!.length, frieze),
  )
    .flat()
    .filter(({ x }) => x < W);

  return (
    <nav aria-label="Groups" data-temple className="w-[min(56rem,calc(100vw_-_2rem))] self-center">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="temple mx-auto block h-auto"
        style={{ "--temple-cells": W } as React.CSSProperties}
        shapeRendering="crispEdges"
      >
        <g aria-hidden="true">
          <Cells cells={tympanum} top={top} className="fill-surface" />
          <Cells cells={white} top={top} className="fill-text" />
          <Cells cells={key} top={top} className="fill-green-deep" />
        </g>

        {Array.from({ length: count }, (_, i) => {
          const x0 = MARGIN + i * (COL_W + GAP);
          return (
            <a
              key={i}
              href={`${base}/${i + 1}`}
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
              <Cells cells={cellsOf(COLUMN, x0, shaftTop)} top={top} className="fill-current" />
              <text
                x={x0 + COL_W / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={5}
                fill="currentColor"
                className="temple-after font-olympus font-semibold"
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
