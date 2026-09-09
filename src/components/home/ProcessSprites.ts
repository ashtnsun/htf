import { DINO_ARM, DINO_EYE, dinoCells } from "@/components/brand/dino-pixels";
import type { ProcessStep } from "@/lib/content/schemas";

/**
 * The pixel art of the process scene (home/ProcessScene). Every sprite sits on the same cell
 * grid as the footer T-rex (brand/dino-pixels) and is drawn the same way: solid cells, no
 * outlines, details carved out as empty cells (the eyes). The T-rex is green and its two
 * teammates pink and blue; hats, tools and the gift are white; the lens of the magnifying
 * glass is a green tint.
 *
 * The stage is 64 × 40 cells. The T-rex stands at the left in every step (its top-left cell
 * at TREX_ORIGIN, feet on row 33) facing the step text, and everything else is placed
 * relative to it. Hats are worn: their brim covers the head's top row (local row 0) so they
 * sit on the head rather than above it. The team is two smaller copies of the T-rex (a
 * hand-reduced map on the same grid), mirrored to face the first one. Anything that moves is
 * drawn as whole frames or moves by whole cells that keep it attached to the hand (the
 * hammer's two poses, the extra arm cell as the gift is pushed forward, the glass lifted
 * one row). Each layer lists the steps it belongs to, so the T-rex itself is shared by all
 * four and the scene can dissolve the rest.
 */

export type Stage = ProcessStep["graphic"];
export type Ink = "green" | "white" | "tint" | "pink" | "blue";
/** One filled cell: column, row and ink (green when omitted). */
export type Cell = readonly [x: number, y: number, ink?: Ink];

export type Layer = {
  key: string;
  /** The steps this layer is part of. */
  stages: readonly Stage[];
  cells: readonly Cell[];
  /** Class of the layer's own motion on the live scene; loops run only in their own step. */
  anim?: string;
  /** Delay of that motion, in seconds (negative starts it mid-cycle). */
  delay?: number;
  /** false: the alternate frame of a two-frame loop, hidden unless the loop runs. */
  rest?: boolean;
  /** The eye of the dinosaur in this layer (stage cell), covered by an eyelid to blink. */
  eye?: { x: number; y: number; ink?: Ink; delay?: number };
};

export const SCENE = { cols: 64, rows: 40 } as const;
export const TREX_ORIGIN = { x: 2, y: 12 } as const;
export const ALL_STAGES: readonly Stage[] = ["detective", "team", "builder", "party"];

const INKS: Record<string, Ink> = { "#": "green", o: "white", "+": "tint" };

/** Cells of a string map placed at (ox, oy) relative to the T-rex's top-left cell. */
function sprite(rows: readonly string[], ox: number, oy: number): Cell[] {
  const cells: Cell[] = [];
  rows.forEach((row, y) => {
    Array.from(row).forEach((ch, x) => {
      const ink = INKS[ch];
      if (ink) cells.push([TREX_ORIGIN.x + ox + x, TREX_ORIGIN.y + oy + y, ink]);
    });
  });
  return cells;
}

/** Cells from a point list in T-rex-local coordinates, optionally shifted by (ox, oy). */
function at(
  points: readonly (readonly [number, number])[],
  ink: Ink = "green",
  ox = 0,
  oy = 0,
): Cell[] {
  return points.map(([x, y]) => [TREX_ORIGIN.x + ox + x, TREX_ORIGIN.y + oy + y, ink] as const);
}

function block(x0: number, y0: number, w: number, h: number): [number, number][] {
  const out: [number, number][] = [];
  for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) out.push([x, y]);
  return out;
}

/* ---------------------------------------------------------------- the T-rex and its arms */

const TREX_BODY: Cell[] = dinoCells({ withoutArm: true }).map(
  ({ x, y }) => [TREX_ORIGIN.x + x, TREX_ORIGIN.y + y, "green"] as const,
);
const TREX_EYE = { x: TREX_ORIGIN.x + DINO_EYE.x, y: TREX_ORIGIN.y + DINO_EYE.y };
const ARM_UP: [number, number][] = [
  [14, 10],
  [15, 10],
  [16, 9],
  [17, 9],
  [18, 8],
];

/* ---------------------------------------------------------------- discover: the detective */

/** A deerstalker: the tied ear flaps on top, a peak front and back, worn over row 0. */
const HAT_DETECTIVE = [
  ".....oo.oo....",
  "....oooooo....",
  "...oooooooo...",
  "..oooooooooo..",
  "oooooooooooooo",
  "o............o",
];
const GLASS = ["..ooo..", ".o+++o.", "o+++++o", "o+++++o", "o+++++o", ".o+++o.", "..ooo.."];
/** The handle, from the hand up to the ring. */
const HANDLE: [number, number][] = [
  [21, 7],
  [20, 8],
  [19, 8],
  [19, 9],
  [18, 9],
  [18, 10],
  [17, 10],
  [17, 11],
  [16, 11],
];
/** A trail of footprints leading away from the detective, one dash per step. */
const TRAIL = Array.from({ length: 8 }, (_, i) =>
  at(
    [
      [26 + i * 4, i % 2 === 0 ? 21 : 19],
      [27 + i * 4, i % 2 === 0 ? 21 : 19],
    ],
    "white",
  ),
);

/* ---------------------------------------------------------------- match: the team */

/**
 * The T-rex at about two thirds of its size, reduced by hand from the 20 × 22 map so it keeps
 * the same features on the same grid: the carved eye, the open mouth, the tiny arm, the tail
 * and the two legs. Faces right like the big map; the teammates are mirrored to face the lead.
 */
const SMALL_DINO: readonly string[] = [
  "........######",
  ".......#######",
  ".......##.####",
  ".......#######",
  ".......#######",
  ".......####...",
  ".......######.",
  "#.....####....",
  "#...#######...",
  "##.#########..",
  "##########.#..",
  ".#########....",
  "..#######.....",
  "...##.##......",
  "...#...#......",
  "...##..##.....",
];
const SMALL_COLS = SMALL_DINO[0]!.length;
const SMALL_EYE = { x: 9, y: 2 } as const;

/** A small T-rex mirrored to face left, its top-left cell at (ox, oy) in T-rex-local space. */
function teammate(ox: number, oy: number, ink: Ink): Cell[] {
  const cells: Cell[] = [];
  SMALL_DINO.forEach((row, y) => {
    Array.from(row).forEach((ch, x) => {
      if (ch === "#") {
        cells.push([TREX_ORIGIN.x + ox + (SMALL_COLS - 1 - x), TREX_ORIGIN.y + oy + y, ink]);
      }
    });
  });
  return cells;
}
const teammateEye = (ox: number, oy: number, ink: Ink, delay: number) => ({
  x: TREX_ORIGIN.x + ox + (SMALL_COLS - 1 - SMALL_EYE.x),
  y: TREX_ORIGIN.y + oy + SMALL_EYE.y,
  ink,
  delay,
});
/** Both stand on the T-rex's baseline (their feet on its row 21). */
const TEAMMATE_A = { x: 26, y: 6 } as const;
const TEAMMATE_B = { x: 44, y: 6 } as const;

/* ---------------------------------------------------------------- build: the builder */

/** A hard hat: a ridge on a round dome, the brim as a visor over the face, worn over row 0. */
const HAT_HARD = [
  ".....ooo......",
  "...ooooooo....",
  ".oooooooooo...",
  ".oooooooooo...",
  ".ooooooooooooo",
];
/** Hammer raised: the handle up and to the right, the head across its end. */
const HAMMER_UP: [number, number][] = [
  [16, 10],
  [17, 9],
  [18, 8],
  [19, 7],
  [20, 6],
  [19, 3],
  [20, 3],
  [20, 4],
  [21, 4],
  [21, 5],
  [22, 5],
  [22, 6],
  [23, 6],
  [23, 7],
  [24, 7],
];
/** Hammer struck: the handle level, the head down on the top brick. */
const HAMMER_DOWN: [number, number][] = [...block(16, 11, 5, 1), ...block(21, 9, 3, 5)];
const SPARK: [number, number][] = [
  [25, 11],
  [26, 10],
  [25, 13],
  [19, 13],
  [18, 12],
  [20, 14],
];
const BRICKS: [number, number][] = [
  ...block(20, 14, 5, 2),
  ...block(18, 17, 5, 2),
  ...block(24, 17, 5, 2),
  ...block(16, 20, 5, 2),
  ...block(22, 20, 5, 2),
  ...block(28, 20, 5, 2),
];

/* ---------------------------------------------------------------- deliver: the party */

const HAT_PARTY = [
  "...oo...",
  "...##...",
  "..oooo..",
  "..####..",
  ".oooooo.",
  ".######.",
  "oooooooo",
];
/** The arm held out to the side of the box, and the cell it gains as it pushes the box. */
const ARM_OUT = block(16, 10, 3, 2);
const ARM_REACH: [number, number][] = [
  [19, 10],
  [19, 11],
];
const BOX = { x: 19, y: 8, w: 7, h: 5 } as const;
/** A white box with a green ribbon across it and a bow on top; the hand covers the ribbon's end. */
const GIFT: Cell[] = [
  ...block(BOX.x, BOX.y, BOX.w, BOX.h).map(
    ([x, y]) =>
      [
        TREX_ORIGIN.x + x,
        TREX_ORIGIN.y + y,
        x === BOX.x + 3 || (y === BOX.y + 2 && x > BOX.x) ? "green" : "white",
      ] as const,
  ),
  ...at([
    [20, 6],
    [21, 6],
    [23, 6],
    [24, 6],
    [21, 7],
    [22, 7],
    [23, 7],
  ]),
];
const CONFETTI_POINTS: readonly [number, number, Ink][] = [
  [12, -8, "green"],
  [16, -3, "white"],
  [20, -9, "green"],
  [25, -5, "white"],
  [29, -8, "green"],
  [33, -2, "white"],
  [37, -6, "green"],
  [41, -9, "white"],
  [45, -4, "green"],
  [49, -7, "white"],
  [53, -2, "green"],
  [57, -6, "white"],
  [23, 1, "white"],
  [44, 2, "green"],
  [10, -1, "white"],
];
const CONFETTI: Cell[] = CONFETTI_POINTS.map(
  ([x, y, ink]) => [TREX_ORIGIN.x + x, TREX_ORIGIN.y + y, ink] as const,
);

/* ---------------------------------------------------------------- the layers */

export const LAYERS: readonly Layer[] = [
  { key: "trex", stages: ALL_STAGES, cells: TREX_BODY, eye: TREX_EYE },
  { key: "arm", stages: ALL_STAGES, cells: at(DINO_ARM), anim: "anim-dino-wave-down" },
  { key: "arm-up", stages: ["team"], cells: at(ARM_UP), anim: "anim-dino-wave-up", rest: false },

  { key: "hat-detective", stages: ["detective"], cells: sprite(HAT_DETECTIVE, 8, -4) },
  {
    key: "glass",
    stages: ["detective"],
    cells: [...sprite(GLASS, 21, 1), ...at(HANDLE, "white")],
    anim: "anim-dino-peer",
  },
  ...TRAIL.map((cells, i) => ({
    key: `trail-${i}`,
    stages: ["detective"] as const,
    cells,
    anim: "anim-dino-appear",
    delay: 0.4 + i * 0.22,
  })),

  {
    key: "teammate-a",
    stages: ["team"],
    cells: teammate(TEAMMATE_A.x, TEAMMATE_A.y, "pink"),
    anim: "anim-dino-bob",
    eye: teammateEye(TEAMMATE_A.x, TEAMMATE_A.y, "pink", 2),
  },
  {
    key: "teammate-b",
    stages: ["team"],
    cells: teammate(TEAMMATE_B.x, TEAMMATE_B.y, "blue"),
    anim: "anim-dino-bob",
    delay: 0.6,
    eye: teammateEye(TEAMMATE_B.x, TEAMMATE_B.y, "blue", 4),
  },

  { key: "hat-hard", stages: ["builder"], cells: sprite(HAT_HARD, 9, -4) },
  {
    key: "hammer-up",
    stages: ["builder"],
    cells: at(HAMMER_UP, "white"),
    anim: "anim-dino-hammer-up",
  },
  {
    key: "hammer-down",
    stages: ["builder"],
    cells: at(HAMMER_DOWN, "white"),
    anim: "anim-dino-hammer-down",
    rest: false,
  },
  {
    key: "spark",
    stages: ["builder"],
    cells: at(SPARK, "white"),
    anim: "anim-dino-spark",
    rest: false,
  },
  { key: "bricks", stages: ["builder"], cells: at(BRICKS, "white") },

  { key: "hat-party", stages: ["party"], cells: sprite(HAT_PARTY, 11, -6) },
  { key: "arm-out", stages: ["party"], cells: at(ARM_OUT) },
  {
    key: "arm-reach",
    stages: ["party"],
    cells: at(ARM_REACH),
    anim: "anim-dino-reach",
    rest: false,
  },
  { key: "gift", stages: ["party"], cells: GIFT, anim: "anim-dino-offer" },
  ...[0, 1, 2].map((group) => ({
    key: `confetti-${group}`,
    stages: ["party"] as const,
    cells: CONFETTI.filter((_, i) => i % 3 === group),
    anim: "anim-dino-fall",
    delay: -group,
  })),
];
