/**
 * The tomb (/olympus3): nine rooms on one map, as plain data. Everything is in logical pixels (one
 * logical pixel is one cell of the picture, drawn at a whole number of screen pixels). `at` is a
 * room's place on the map, so rooms really touch and their doors really meet: a door's `at` is
 * along the wall in the room's own coordinates, and a check below makes both sides agree.
 *
 * A room's shape is a test on a grid of 8-pixel cells: floor (1), the short passage cut through the
 * rock to a door (2), or rock (0). The walls, the shade and the map in the corner all follow it.
 *
 * Nothing here is secret: no answers, no words.
 */

import { FOR_SALE } from "@/components/olympus/crawl/cosmetics";

export const TILE = 16;
export const CELL = 8;

export type Side = "n" | "s" | "e" | "w";
export type RoomId =
  "mural" | "hall" | "crypt" | "teeth" | "gate" | "chasm" | "sanctum" | "shop" | "den";
export type ThemeId =
  "sand" | "hall" | "crypt" | "rust" | "marble" | "bronze" | "gold" | "agora" | "den";

/** What the dinosaur can walk up to. */
export type Target =
  | { kind: "tablet"; index: number }
  | { kind: "mural" }
  | { kind: "gate" }
  | { kind: "stone" }
  | { kind: "door" }
  | { kind: "altar" }
  | { kind: "note"; text: string }
  | { kind: "mirror" }
  | { kind: "item"; id: string }
  | { kind: "arcade" }
  | { kind: "blackjack" };

export type Spot = {
  target: Target;
  x: number;
  y: number;
  r: number;
  capY: number;
  /** Where the E floats, when not over the spot's own x. */
  capX?: number;
  /** A carved tablet on the wall: where its top is. */
  ty?: number;
  /** Overrides the usual prompt. */
  label?: string;
  /** Gone once the family has taken their photo. */
  untilPictured?: boolean;
};

export type PropKind =
  | "column"
  | "stump"
  | "amphora"
  | "statue"
  | "sarcophagus"
  | "bones"
  | "rubble"
  | "coins"
  | "crate"
  | "sack"
  | "rolls";

export type Prop = {
  kind: PropKind;
  x: number;
  y: number;
  flip?: boolean;
  seed?: number;
  /** A sarcophagus with a riddle on its lid: which one. Answered, the lid slides off. */
  riddle?: number;
};

/** One fire of the ten: `side` L counts the row, R the column; `i` is its place in the five. */
export type Fire = { x: number; y: number; side: "L" | "R"; i: number; big?: boolean };

export type Door = {
  to: RoomId;
  /** Along the wall, in the room's own pixels. */
  at: number;
  /** Past this line (y for n and s, x for e and w) the dinosaur has left. */
  line: number;
  /** Where the dinosaur stands on coming in through this door. */
  landing: { x: number; y: number };
};

export type Spikes = { x: number; w: number; y: number; h: number; phase: number };

type RoomSpec = {
  id: RoomId;
  title: string;
  theme: ThemeId;
  /** Top left corner on the map, in pixels. */
  at: [number, number];
  /** In tiles. */
  w: number;
  h: number;
  /** How tall a wall stands, in tiles. */
  wall: number;
  /** How dark the room is away from any fire. */
  ambient: number;
  shape: (x: number, y: number) => boolean;
  doors: Partial<Record<Side, { to: RoomId; at: number }>>;
  props: Prop[];
  /** The five and five along the wall, by x: their height comes from the wall itself. */
  sconces?: { left: number[]; right: number[] };
  fires?: Fire[];
  spots: Spot[];
  spikes?: Spikes[];
  /** The floor as rows of tiles: `p` a pit, `h` a hidden stone over one, anything else floor. */
  floor?: string[];
  safe?: { x: number; y: number };
};

export type Room = Omit<RoomSpec, "doors" | "sconces" | "fires"> & {
  W: number;
  H: number;
  cols: number;
  rows: number;
  grid: Uint8Array;
  doors: Partial<Record<Side, Door>>;
  fires: Fire[];
  /** The cell's value at a pixel; rock outside the room. */
  cell: (x: number, y: number) => number;
  /** The first floor below the wall in this column, in pixels. */
  floorTop: (x: number) => number;
};

/** The square on the Hall's floor: 5 × 5 tiles of `tile` pixels, from (x, y). */
export const SQUARE = { x: 142, y: 78, tile: 20 };
/** The Hall's two loose stones, a tile each, out past the fires on either side of the square. */
export const FLOOR_STONES = { restart: { x: 86, y: 118 }, lift: { x: 278, y: 118 } } as const;
export type FloorStone = keyof typeof FLOOR_STONES;
/** How far a door's opening runs either side of its middle. */
export const DOOR_HALF = 16;

const rect = (x0: number, y0: number, x1: number, y1: number) => (x: number, y: number) =>
  x >= x0 && x < x1 && y >= y0 && y < y1;

/** Where each thing for sale lies: on three rugs, not in rows, the way a merchant lays them out. */
const WARES = [
  // Hats on the long rug.
  [40, 116],
  [68, 116],
  [96, 116],
  [124, 116],
  [40, 154],
  [68, 154],
  [96, 154],
  [124, 154],
  // Faces on the small one.
  [152, 128],
  [180, 128],
  [152, 158],
  [180, 158],
  // Things for the back, then things to carry, on the blue one.
  [204, 158],
  [232, 158],
  [260, 158],
  [288, 158],
  [204, 128],
  [232, 128],
  [260, 128],
  [288, 128],
] as const;
export const ware = (i: number) => ({ x: WARES[i]![0], y: WARES[i]![1] });

const tablet = (index: number, x: number, floorTop: number): Spot => ({
  target: { kind: "tablet", index },
  x,
  y: floorTop + 10,
  r: 26,
  ty: floorTop - 36,
  capY: floorTop - 48,
});

const note = (text: string, x: number, y: number, r = 24): Spot => ({
  target: { kind: "note", text },
  x,
  y,
  r,
  capY: y - 26,
});

const hallFires: Fire[] = Array.from({ length: 5 }, (_, i) => [
  { x: 122, y: SQUARE.y + 14 + i * 20, side: "L" as const, i, big: true },
  { x: 262, y: SQUARE.y + 14 + i * 20, side: "R" as const, i, big: true },
]).flat();

/** The Mechanism's room: a square drop around a square island, a hidden way across it. */
const CHASM_PATH = new Set(
  [
    [19, 8],
    [18, 8],
    [18, 9],
    [18, 10],
    [17, 10],
    [16, 10],
    [16, 9],
    [16, 8],
    [15, 8],
  ].map(([c, r]) => `${c},${r}`),
);
const chasmFloor = () =>
  Array.from({ length: 15 }, (_, row) =>
    Array.from({ length: 24 }, (_, col) => {
      const pit = col >= 4 && col <= 19 && row >= 4 && row <= 12;
      const island = col >= 9 && col <= 14 && row >= 7 && row <= 10;
      if (!pit || island) return ".";
      return CHASM_PATH.has(`${col},${row}`) ? "h" : "p";
    }).join(""),
  );

/*
 * The map, with the Hall in the middle:
 *
 *                 Sanctum
 *                    |
 *   Mural ------- Hall -------- Mask
 *                    |            |
 *   Mechanism --- Crypt ------ Teeth ---- Den
 *                                 |
 *                               Shop
 */
const SPECS: RoomSpec[] = [
  {
    id: "mural",
    title: "The Mural",
    theme: "sand",
    at: [-384, -32],
    w: 24,
    h: 14,
    wall: 6,
    ambient: 0.4,
    shape: rect(16, 96, 368, 208),
    doors: { e: { to: "hall", at: 160 } },
    props: [
      { kind: "statue", x: 104, y: 112 },
      { kind: "statue", x: 280, y: 112, flip: true },
      { kind: "rubble", x: 142, y: 196, seed: 4 },
      { kind: "rubble", x: 246, y: 196, seed: 5 },
      { kind: "rubble", x: 196, y: 204, seed: 6 },
      { kind: "stump", x: 44, y: 176, seed: 3 },
      { kind: "column", x: 330, y: 120 },
      { kind: "amphora", x: 340, y: 196, seed: 1 },
      { kind: "bones", x: 72, y: 196 },
    ],
    spots: [
      { target: { kind: "mural" }, x: 192, y: 104, r: 34, capY: 2 },
      { target: { kind: "mirror" }, x: 58, y: 108, r: 20, capY: 30 },
      note("Someone came before you. They did not stand before the wall.", 72, 204),
      {
        ...note("It will not open for strangers.", 346, 160, 22),
        capY: 132,
        untilPictured: true,
      },
    ],
  },
  {
    id: "hall",
    title: "The Hall of Fires",
    theme: "hall",
    at: [0, 0],
    w: 24,
    h: 13,
    wall: 4,
    ambient: 0.46,
    shape: rect(16, 64, 368, 192),
    doors: {
      n: { to: "sanctum", at: 192 },
      s: { to: "crypt", at: 192 },
      w: { to: "mural", at: 128 },
      e: { to: "gate", at: 128 },
    },
    fires: hallFires,
    props: [
      { kind: "statue", x: 138, y: 74 },
      { kind: "statue", x: 246, y: 74, flip: true },
      { kind: "column", x: 48, y: 88 },
      { kind: "column", x: 336, y: 88 },
      { kind: "column", x: 48, y: 176 },
      { kind: "column", x: 336, y: 176 },
      { kind: "amphora", x: 84, y: 180, seed: 3 },
      { kind: "rubble", x: 300, y: 184, seed: 7 },
    ],
    spots: [{ target: { kind: "door" }, x: 192, y: 72, r: 22, capY: 8 }, tablet(4, 90, 64)],
  },
  {
    id: "crypt",
    title: "The Crypt",
    theme: "crypt",
    at: [16, 208],
    w: 22,
    h: 14,
    wall: 3,
    ambient: 0.5,
    // A cross: a long nave and two arms.
    shape: (x, y) => rect(112, 48, 240, 208)(x, y) || rect(16, 104, 336, 184)(x, y),
    doors: {
      n: { to: "hall", at: 176 },
      w: { to: "chasm", at: 160 },
      e: { to: "teeth", at: 160 },
    },
    sconces: { left: [24, 38, 52, 66, 80], right: [262, 276, 290, 304, 318] },
    props: [
      { kind: "sarcophagus", x: 62, y: 136, riddle: 0 },
      { kind: "sarcophagus", x: 276, y: 136, riddle: 1 },
      { kind: "sarcophagus", x: 176, y: 204, riddle: 2 },
      { kind: "bones", x: 142, y: 92 },
      { kind: "rubble", x: 310, y: 178, seed: 13 },
      { kind: "amphora", x: 226, y: 66, seed: 6 },
      { kind: "amphora", x: 124, y: 62, seed: 2 },
    ],
    spots: [
      {
        target: { kind: "tablet", index: 0 },
        x: 62,
        y: 150,
        r: 28,
        capY: 92,
        label: "Read the lid",
      },
      {
        target: { kind: "tablet", index: 1 },
        x: 276,
        y: 150,
        r: 28,
        capY: 92,
        label: "Read the lid",
      },
      {
        target: { kind: "tablet", index: 2 },
        x: 176,
        y: 182,
        r: 34,
        capX: 212,
        capY: 158,
        label: "Read the lid",
      },
      note("He got out. Most of him.", 142, 100, 22),
    ],
  },
  {
    id: "teeth",
    title: "The Teeth",
    theme: "rust",
    at: [368, 208],
    w: 24,
    h: 14,
    wall: 3,
    ambient: 0.5,
    // An L: a landing by the doors, and one long way to the far wall.
    shape: (x, y) => rect(16, 48, 112, 208)(x, y) || rect(16, 112, 368, 208)(x, y),
    doors: {
      w: { to: "crypt", at: 160 },
      n: { to: "gate", at: 64 },
      s: { to: "shop", at: 64 },
      e: { to: "den", at: 160 },
    },
    sconces: { left: [126, 141, 156, 171, 186], right: [214, 229, 244, 259, 274] },
    props: [
      { kind: "bones", x: 36, y: 90 },
      { kind: "rubble", x: 350, y: 200, seed: 15 },
      { kind: "amphora", x: 98, y: 66, seed: 7 },
    ],
    spikes: [
      { x: 124, w: 28, y: 112, h: 96, phase: 0 },
      { x: 176, w: 28, y: 112, h: 96, phase: 0.3 },
      { x: 228, w: 28, y: 112, h: 96, phase: 0.6 },
      { x: 280, w: 28, y: 112, h: 96, phase: 0.15 },
    ],
    spots: [tablet(3, 336, 112), note("He ran. He should have counted.", 36, 98, 20)],
  },
  {
    id: "gate",
    title: "The Mask",
    theme: "marble",
    at: [384, 0],
    w: 24,
    h: 13,
    wall: 5,
    ambient: 0.48,
    shape: rect(16, 80, 368, 192),
    doors: {
      w: { to: "hall", at: 128 },
      s: { to: "teeth", at: 48 },
    },
    sconces: { left: [40, 55, 70, 85, 100], right: [284, 299, 314, 329, 344] },
    props: [
      { kind: "column", x: 128, y: 104 },
      { kind: "column", x: 256, y: 104 },
      { kind: "column", x: 104, y: 184 },
      { kind: "column", x: 336, y: 184 },
      { kind: "stump", x: 300, y: 150, seed: 19 },
      { kind: "rubble", x: 150, y: 186, seed: 17 },
    ],
    spots: [{ target: { kind: "gate" }, x: 192, y: 92, r: 30, capX: 240, capY: 30 }],
  },
  {
    id: "chasm",
    title: "The Mechanism",
    theme: "bronze",
    at: [-368, 240],
    w: 24,
    h: 15,
    wall: 3,
    ambient: 0.5,
    shape: rect(16, 48, 368, 224),
    doors: { e: { to: "crypt", at: 128 } },
    sconces: { left: [60, 75, 90, 105, 120], right: [264, 279, 294, 309, 324] },
    props: [
      { kind: "column", x: 40, y: 84 },
      { kind: "column", x: 40, y: 200 },
      { kind: "column", x: 344, y: 84 },
      { kind: "column", x: 344, y: 200 },
      { kind: "stump", x: 44, y: 140, seed: 21 },
    ],
    floor: chasmFloor(),
    safe: { x: 344, y: 128 },
    spots: [{ target: { kind: "stone" }, x: 192, y: 162, r: 50, capY: 76 }],
  },
  {
    id: "sanctum",
    title: "The Sanctum",
    theme: "gold",
    at: [32, -208],
    w: 20,
    h: 13,
    wall: 4,
    ambient: 0.14,
    shape: rect(16, 64, 304, 192),
    doors: { s: { to: "hall", at: 160 } },
    props: [
      { kind: "column", x: 72, y: 96 },
      { kind: "column", x: 248, y: 96 },
      { kind: "column", x: 72, y: 156 },
      { kind: "column", x: 248, y: 156 },
      { kind: "statue", x: 118, y: 100 },
      { kind: "statue", x: 202, y: 100, flip: true },
      { kind: "coins", x: 40, y: 130, seed: 1 },
      { kind: "coins", x: 280, y: 128, seed: 2 },
      { kind: "coins", x: 106, y: 180, seed: 3 },
      { kind: "coins", x: 216, y: 182, seed: 4 },
      { kind: "amphora", x: 36, y: 180, seed: 1 },
      { kind: "amphora", x: 284, y: 180, seed: 2 },
    ],
    spots: [{ target: { kind: "altar" }, x: 160, y: 128, r: 28, capY: 62 }],
  },
  {
    id: "shop",
    title: "The Caravan",
    theme: "agora",
    at: [272, 432],
    w: 20,
    h: 12,
    wall: 4,
    ambient: 0.42,
    shape: rect(16, 64, 304, 176),
    doors: { n: { to: "teeth", at: 160 } },
    props: [
      { kind: "crate", x: 30, y: 84 },
      { kind: "crate", x: 30, y: 72 },
      { kind: "sack", x: 50, y: 80, seed: 1 },
      { kind: "rolls", x: 124, y: 84 },
      { kind: "sack", x: 138, y: 78, seed: 2 },
    ],
    spots: [
      { target: { kind: "mirror" }, x: 90, y: 76, r: 20, capY: 2 },
      ...FOR_SALE.map((item, i): Spot => {
        const { x, y } = ware(i);
        return { target: { kind: "item", id: item.id }, x, y: y + 4, r: 14, capY: y - 34 };
      }),
    ],
  },
  {
    id: "den",
    title: "The Den",
    theme: "den",
    at: [752, 272],
    w: 14,
    h: 10,
    wall: 3,
    ambient: 0.8,
    shape: rect(16, 48, 208, 144),
    doors: { w: { to: "teeth", at: 96 } },
    props: [
      { kind: "stump", x: 196, y: 70, seed: 23 },
      { kind: "amphora", x: 192, y: 134, seed: 2 },
      { kind: "bones", x: 118, y: 128 },
    ],
    spots: [
      {
        target: { kind: "arcade" },
        x: 72,
        y: 78,
        r: 22,
        capX: 100,
        capY: 34,
        label: "Play the machine",
      },
      {
        target: { kind: "blackjack" },
        x: 152,
        y: 78,
        r: 22,
        capX: 180,
        capY: 34,
        label: "Sit at the machine",
      },
      note("He bet the last of it.", 118, 136, 20),
    ],
  },
];

function build(spec: RoomSpec): Room {
  const W = spec.w * TILE;
  const H = spec.h * TILE;
  const cols = W / CELL;
  const rows = H / CELL;
  const grid = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (spec.shape(c * CELL + 4, r * CELL + 4)) grid[c + r * cols] = 1;
    }
  }
  const get = (c: number, r: number) =>
    c < 0 || r < 0 || c >= cols || r >= rows ? 0 : grid[c + r * cols]!;
  const floorTop = (x: number) => {
    const c = Math.floor(x / CELL);
    for (let r = 0; r < rows; r += 1) if (get(c, r) === 1) return r * CELL;
    return H;
  };

  const doors: Partial<Record<Side, Door>> = {};
  for (const [side, door] of Object.entries(spec.doors) as [Side, { to: RoomId; at: number }][]) {
    const first = Math.floor((door.at - DOOR_HALF) / CELL);
    const span = [first, first + 1, first + 2, first + 3];
    if (side === "w" || side === "e") {
      // Cut through from the edge of the room's box to its floor.
      let reach = 0;
      for (const r of span) {
        if (side === "w") {
          let c = 0;
          while (c < cols && get(c, r) !== 1) {
            grid[c + r * cols] = 2;
            c += 1;
          }
          reach = Math.max(reach, c * CELL);
        } else {
          let c = cols - 1;
          while (c >= 0 && get(c, r) !== 1) {
            grid[c + r * cols] = 2;
            c -= 1;
          }
          reach = Math.max(reach, W - (c + 1) * CELL);
        }
      }
      doors[side] =
        side === "w"
          ? { ...door, line: 8, landing: { x: reach + 12, y: door.at } }
          : { ...door, line: W - 8, landing: { x: W - reach - 12, y: door.at } };
    } else if (side === "s") {
      let reach = 0;
      for (const c of span) {
        let r = rows - 1;
        while (r >= 0 && get(c, r) !== 1) {
          grid[c + r * cols] = 2;
          r -= 1;
        }
        reach = Math.max(reach, H - (r + 1) * CELL);
      }
      doors[side] = { ...door, line: H - 8, landing: { x: door.at, y: H - reach - 10 } };
    } else {
      // North: into the wall's foot, under the arch the painter draws.
      const top = floorTop(door.at);
      for (const c of span) {
        for (const r of [top / CELL - 1, top / CELL - 2]) grid[c + r * cols] = 2;
      }
      doors[side] = { ...door, line: top - 8, landing: { x: door.at, y: top + 12 } };
    }
  }

  const fires = [...(spec.fires ?? [])];
  if (spec.sconces) {
    const onWall = (xs: number[], side: "L" | "R") =>
      xs.map((x, i) => ({ x, y: floorTop(x) - 14, side, i }));
    fires.push(...onWall(spec.sconces.left, "L"), ...onWall(spec.sconces.right, "R"));
  }
  return {
    ...spec,
    W,
    H,
    cols,
    rows,
    grid,
    doors,
    fires,
    floorTop,
    cell: (x, y) => get(Math.floor(x / CELL), Math.floor(y / CELL)),
  };
}

export const ROOMS = Object.fromEntries(SPECS.map((s) => [s.id, build(s)])) as Record<RoomId, Room>;
export const ROOM_LIST = Object.values(ROOMS);

export const OPPOSITE: Record<Side, Side> = { n: "s", s: "n", e: "w", w: "e" };

/** Doors meet on the map: a mistake here is a door that jumps, so it fails loudly in dev. */
if (process.env.NODE_ENV === "development") {
  for (const room of ROOM_LIST) {
    for (const [side, door] of Object.entries(room.doors) as [Side, Door][]) {
      const other = ROOMS[door.to];
      const back = other.doors[OPPOSITE[side]];
      const along = side === "n" || side === "s" ? 0 : 1;
      if (back?.to !== room.id || room.at[along] + door.at !== other.at[along] + back.at) {
        throw new Error(`The ${side} door of ${room.id} does not meet ${door.to}`);
      }
    }
  }
}

/** The solid part of a prop, as a box around its feet; null when it can be walked over. */
export function solidOf(prop: Prop): { x: number; y: number; w: number; h: number } | null {
  switch (prop.kind) {
    case "column":
    case "stump":
      return { x: prop.x - 6, y: prop.y - 5, w: 12, h: 6 };
    case "amphora":
      return { x: prop.x - 4, y: prop.y - 3, w: 8, h: 4 };
    case "statue":
      return { x: prop.x - 11, y: prop.y - 7, w: 22, h: 8 };
    case "sarcophagus":
      return { x: prop.x - 21, y: prop.y - 18, w: 42, h: 20 };
    case "crate":
      return { x: prop.x - 9, y: prop.y - 6, w: 18, h: 7 };
    case "sack":
    case "rolls":
      return { x: prop.x - 7, y: prop.y - 4, w: 14, h: 5 };
    default:
      return null;
  }
}

/** The solid foot of a fire standing on the floor. */
export function solidOfFire(fire: Fire) {
  return fire.big ? { x: fire.x - 5, y: fire.y - 3, w: 10, h: 4 } : null;
}
