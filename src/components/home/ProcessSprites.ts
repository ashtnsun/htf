import { DINO_ARM, dinoCells } from "@/components/brand/dino-pixels";
import type { ProcessStep } from "@/lib/content/schemas";

/**
 * The pixel art of the process scene (home/ProcessScene). Every sprite sits on the same cell
 * grid as the footer T-rex (brand/dino-pixels) and is drawn the same way: solid cells, no
 * outlines, details carved out as empty cells (the eyes). Dinosaurs are green; hats, tools
 * and the gift are white; the lens of the magnifying glass is a green tint.
 *
 * The stage is 64 × 40 cells. The T-rex stands at the left in every step (its top-left cell
 * at TREX_ORIGIN, feet on row 33) facing the step text, and everything else is placed
 * relative to it: the detective's hat, glass and trail; the team (a triceratops, a
 * stegosaurus and a pterodactyl); the builder's hard hat, hammer and bricks; the party hat,
 * the gift, the confetti and the partner receiving the gift. Each layer lists the steps it
 * belongs to, so the T-rex itself is shared by all four and the scene can dissolve the rest.
 */

export type Stage = ProcessStep["graphic"];
export type Ink = "green" | "white" | "tint";
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
};

export const SCENE = { cols: 64, rows: 40 } as const;
export const TREX_ORIGIN = { x: 2, y: 12 } as const;

const ALL: readonly Stage[] = ["detective", "team", "builder", "party"];
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

/** Cells from a point list in T-rex-local coordinates. */
function at(points: readonly (readonly [number, number])[], ink: Ink = "green"): Cell[] {
  return points.map(([x, y]) => [TREX_ORIGIN.x + x, TREX_ORIGIN.y + y, ink] as const);
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
const ARM_UP: [number, number][] = [
  [14, 10],
  [15, 10],
  [16, 9],
  [17, 9],
  [18, 8],
];
const ARM_OUT: [number, number][] = [
  [16, 10],
  [17, 10],
  [16, 11],
  [17, 11],
];

/* ---------------------------------------------------------------- discover: the detective */

const HAT_DETECTIVE = ["....oo.oo.....", "...oooooooo...", "..oooooooooo..", "oooooooooooooo"];
const GLASS = ["..ooo..", ".o+++o.", "o+++++o", "o+++++o", "o+++++o", ".o+++o.", "..ooo.."];
const HANDLE: [number, number][] = [
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

const TRICERATOPS = [
  ".........######..",
  ".......#########.",
  "......###########",
  "#################",
  "...##.##########.",
  "################.",
  "..###############",
  ".##.#############",
  "..###############",
  "...#############.",
  "...####..####.##.",
  "...###...###..##.",
  "...###...###..##.",
];
const STEGOSAURUS = [
  "........##.....##......",
  ".......####...####.....",
  "...#..######.######..#.",
  "..###.#############.###",
  ".######################",
  ".######################",
  "######################.",
  "##.###################.",
  "###.#################.#",
  "....################.##",
  ".....###...######..##..",
  ".....##....##..##......",
  ".....##....##..##......",
  ".....##....##..##......",
];
/** The pterodactyl: head, crest and body, with the wing as two frames above and below it. */
const PTERO_BODY = [
  ".........#.......",
  "........#........",
  "....####.........",
  "....#.###########",
  "#################",
  "....############.",
  "..........#####..",
];
const PTERO_WING_UP = [
  "...............##",
  "..............###",
  ".............####",
  "............#####",
  "...........######",
  "..........#######",
];
const PTERO_WING_DOWN = [
  ".........########",
  "..........#######",
  "...........######",
  "............#####",
  ".............####",
  "..............###",
  "...............##",
];

/* ---------------------------------------------------------------- build: the builder */

const HAT_HARD = [
  ".....oo......",
  "....oooo.....",
  "..oooooooo...",
  ".oooooooooo..",
  "ooooooooooooo",
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
/** A white box with a green ribbon across it and a bow on top. */
const GIFT: Cell[] = [
  ...block(18, 8, 7, 5).map(
    ([x, y]) =>
      [TREX_ORIGIN.x + x, TREX_ORIGIN.y + y, x === 21 || y === 10 ? "green" : "white"] as const,
  ),
  ...at([
    [19, 6],
    [20, 6],
    [22, 6],
    [23, 6],
    [20, 7],
    [21, 7],
    [22, 7],
  ]),
];
const CONFETTI_POINTS: readonly [number, number, Ink][] = [
  [14, -6, "green"],
  [17, -3, "white"],
  [20, -8, "green"],
  [23, -5, "white"],
  [26, -7, "green"],
  [29, -3, "white"],
  [31, -6, "green"],
  [34, -2, "green"],
  [12, -2, "white"],
  [24, -1, "green"],
  [36, -7, "white"],
  [19, 1, "white"],
];
const CONFETTI: Cell[] = CONFETTI_POINTS.map(
  ([x, y, ink]) => [TREX_ORIGIN.x + x, TREX_ORIGIN.y + y, ink] as const,
);
/** The partner receiving the gift: a long-necked dinosaur looking down at the box. */
const PARTNER = [
  ".####........",
  "#.####.......",
  "..####.......",
  "...###.......",
  "...###.......",
  "...###.......",
  "...###.......",
  "...####......",
  "...#####.....",
  "...##########",
  "..###########",
  "..###########",
  "...##########",
  "....###..####",
  "....##....##.",
  "....##....##.",
];

/* ---------------------------------------------------------------- the layers */

export const LAYERS: readonly Layer[] = [
  { key: "trex", stages: ALL, cells: TREX_BODY },
  { key: "arm", stages: ALL, cells: at(DINO_ARM), anim: "anim-dino-wave-down" },
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
    key: "triceratops",
    stages: ["team"],
    cells: sprite(TRICERATOPS, 21, 9),
    anim: "anim-dino-bob",
  },
  {
    key: "stegosaurus",
    stages: ["team"],
    cells: sprite(STEGOSAURUS, 39, 8),
    anim: "anim-dino-bob",
    delay: 0.4,
  },
  { key: "ptero", stages: ["team"], cells: sprite(PTERO_BODY, 36, -7) },
  {
    key: "ptero-wing-up",
    stages: ["team"],
    cells: sprite(PTERO_WING_UP, 36, -10),
    anim: "anim-dino-flap-up",
  },
  {
    key: "ptero-wing-down",
    stages: ["team"],
    cells: sprite(PTERO_WING_DOWN, 36, -1),
    anim: "anim-dino-flap-down",
    rest: false,
  },

  { key: "hat-hard", stages: ["builder"], cells: sprite(HAT_HARD, 9, -5) },
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

  { key: "hat-party", stages: ["party"], cells: sprite(HAT_PARTY, 11, -7) },
  { key: "arm-out", stages: ["party"], cells: at(ARM_OUT), anim: "anim-dino-offer" },
  { key: "gift", stages: ["party"], cells: GIFT, anim: "anim-dino-offer" },
  { key: "partner", stages: ["party"], cells: sprite(PARTNER, 30, 6) },
  ...[0, 1, 2].map((group) => ({
    key: `confetti-${group}`,
    stages: ["party"] as const,
    cells: CONFETTI.filter((_, i) => i % 3 === group),
    anim: "anim-dino-fall",
    delay: -group,
  })),
];
