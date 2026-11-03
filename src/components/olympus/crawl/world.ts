/**
 * The tomb (/olympus3): nine rooms on a map, as plain data. Everything is in logical pixels (one
 * logical pixel is one cell of the picture, drawn at a whole number of screen pixels); rooms are
 * built on 16-pixel tiles. `x` and `y` on anything standing on the floor are its feet.
 *
 * Nothing here is secret: no answers, no words. Every trial is open from the first step, and what
 * each one needs is only found by trying it.
 */

export const TILE = 16;

export type Side = "n" | "s" | "e" | "w";
export type RoomId =
  "ante" | "hall" | "mural" | "gallery" | "crypt" | "teeth" | "gate" | "chasm" | "sanctum";

/** What the dinosaur can walk up to. */
export type Target =
  | { kind: "tablet"; index: number }
  | { kind: "mural" }
  | { kind: "gate" }
  | { kind: "stone" }
  | { kind: "door" }
  | { kind: "altar" }
  | { kind: "note"; text: string };

export type Spot = { target: Target; x: number; y: number; r: number; capY: number };

export type PropKind =
  "column" | "stump" | "amphora" | "statue" | "sarcophagus" | "bones" | "rubble" | "plinth";

export type Prop = { kind: PropKind; x: number; y: number; flip?: boolean; seed?: number };

/** One fire of the ten: `side` L counts the row, R the column; `i` is its place in the five. */
export type Fire = { x: number; y: number; side: "L" | "R"; i: number; big?: boolean };

export type Door = { to: RoomId; at: number };

export type Room = {
  id: RoomId;
  title: string;
  /** Column and row on the map in the corner. */
  at: [number, number];
  /** In tiles, walls included. */
  w: number;
  h: number;
  /** The north wall's height in tiles, the south and side walls are one tile. */
  wall: number;
  doors: Partial<Record<Side, Door>>;
  props: Prop[];
  fires: Fire[];
  spots: Spot[];
  /** Vertical strips of spikes: from x to x + w, each rising on its own clock. */
  spikes?: { x: number; w: number; phase: number }[];
  /** The floor as rows of tiles from the wall's foot: `p` a pit, `h` a hidden stone over one. */
  floor?: string[];
  /** Where the dinosaur stands again after falling. */
  safe?: { x: number; y: number };
};

/** A row of five wall fires on each side, the same in every room, burning the same signal. */
const sconces = (lx: number, rx: number, y = 34, gap = 15): Fire[] =>
  Array.from({ length: 5 }, (_, i) => [
    { x: lx + i * gap, y, side: "L" as const, i },
    { x: rx + i * gap, y, side: "R" as const, i },
  ]).flat();

/** The square on the Hall's floor: 5 × 5 tiles of TILE_S pixels, from (SQUARE.x, SQUARE.y). */
export const SQUARE = { x: 142, y: 78, tile: 20 };

const hallFires: Fire[] = Array.from({ length: 5 }, (_, i) => [
  { x: 122, y: SQUARE.y + 14 + i * 20, side: "L" as const, i, big: true },
  { x: 262, y: SQUARE.y + 14 + i * 20, side: "R" as const, i, big: true },
]).flat();

const tablet = (index: number, x: number, y: number): Spot => ({
  target: { kind: "tablet", index },
  x,
  y,
  r: 26,
  capY: y - 50,
});

const note = (text: string, x: number, y: number, r = 24): Spot => ({
  target: { kind: "note", text },
  x,
  y,
  r,
  capY: y - 26,
});

export const ROOMS: Record<RoomId, Room> = {
  ante: {
    id: "ante",
    title: "The Antechamber",
    at: [1, 2],
    w: 22,
    h: 13,
    wall: 3,
    doors: {
      n: { to: "hall", at: 176 },
      w: { to: "crypt", at: 120 },
      e: { to: "teeth", at: 120 },
    },
    fires: sconces(24, 264),
    props: [
      { kind: "column", x: 64, y: 88 },
      { kind: "column", x: 288, y: 88 },
      { kind: "stump", x: 64, y: 160, seed: 3 },
      { kind: "amphora", x: 300, y: 172, seed: 1 },
      { kind: "amphora", x: 316, y: 180, seed: 2 },
      { kind: "bones", x: 232, y: 164 },
      { kind: "rubble", x: 176, y: 186, seed: 4 },
      { kind: "rubble", x: 150, y: 188, seed: 5 },
      { kind: "rubble", x: 206, y: 188, seed: 6 },
    ],
    spots: [
      tablet(0, 126, 58),
      note("Someone came before you. They did not read the walls.", 232, 172),
      note("The way you came is gone.", 176, 188, 13),
    ],
  },
  hall: {
    id: "hall",
    title: "The Hall of Fires",
    at: [1, 1],
    w: 24,
    h: 13,
    wall: 4,
    doors: {
      n: { to: "sanctum", at: 192 },
      s: { to: "ante", at: 192 },
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
    spots: [{ target: { kind: "door" }, x: 192, y: 72, r: 22, capY: 8 }],
  },
  mural: {
    id: "mural",
    title: "The Mural",
    at: [0, 1],
    w: 22,
    h: 13,
    wall: 6,
    doors: {
      e: { to: "hall", at: 144 },
      w: { to: "gallery", at: 144 },
      s: { to: "crypt", at: 176 },
    },
    fires: sconces(24, 264, 52),
    props: [
      { kind: "stump", x: 48, y: 180, seed: 9 },
      { kind: "statue", x: 84, y: 112 },
      { kind: "statue", x: 268, y: 112, flip: true },
      { kind: "amphora", x: 306, y: 182, seed: 4 },
    ],
    spots: [{ target: { kind: "mural" }, x: 176, y: 104, r: 34, capY: 4 }],
  },
  gallery: {
    id: "gallery",
    title: "The Gallery",
    at: [-1, 1],
    w: 22,
    h: 13,
    wall: 3,
    doors: { e: { to: "mural", at: 120 } },
    fires: sconces(24, 264),
    props: [
      { kind: "column", x: 96, y: 104 },
      { kind: "column", x: 256, y: 104 },
      { kind: "column", x: 96, y: 170 },
      { kind: "column", x: 256, y: 170 },
      { kind: "statue", x: 176, y: 182 },
      { kind: "rubble", x: 40, y: 180, seed: 11 },
      { kind: "amphora", x: 44, y: 110, seed: 5 },
    ],
    spots: [tablet(1, 128, 58), tablet(2, 224, 58)],
  },
  crypt: {
    id: "crypt",
    title: "The Crypt",
    at: [0, 2],
    w: 22,
    h: 13,
    wall: 3,
    doors: {
      n: { to: "mural", at: 232 },
      e: { to: "ante", at: 120 },
    },
    fires: sconces(24, 264),
    props: [
      { kind: "sarcophagus", x: 72, y: 110 },
      { kind: "sarcophagus", x: 72, y: 176 },
      { kind: "sarcophagus", x: 136, y: 176 },
      { kind: "sarcophagus", x: 200, y: 176 },
      { kind: "bones", x: 152, y: 96 },
      { kind: "rubble", x: 288, y: 176, seed: 13 },
      { kind: "amphora", x: 300, y: 70, seed: 6 },
    ],
    spots: [
      tablet(3, 150, 58),
      note("It is lighter than it should be.", 72, 180, 22),
      note("This one was opened from inside.", 200, 180, 22),
    ],
  },
  teeth: {
    id: "teeth",
    title: "The Teeth",
    at: [2, 2],
    w: 24,
    h: 13,
    wall: 3,
    doors: {
      w: { to: "ante", at: 120 },
      n: { to: "gate", at: 40 },
    },
    fires: sconces(72, 184),
    props: [
      { kind: "rubble", x: 352, y: 176, seed: 15 },
      { kind: "bones", x: 56, y: 180 },
      { kind: "amphora", x: 348, y: 72, seed: 7 },
    ],
    spikes: [
      { x: 96, w: 32, phase: 0 },
      { x: 152, w: 32, phase: 0.3 },
      { x: 208, w: 32, phase: 0.6 },
      { x: 264, w: 32, phase: 0.15 },
    ],
    spots: [tablet(4, 332, 58)],
  },
  gate: {
    id: "gate",
    title: "The Word Gate",
    at: [2, 1],
    w: 22,
    h: 13,
    wall: 5,
    doors: {
      w: { to: "hall", at: 136 },
      e: { to: "chasm", at: 120 },
      s: { to: "teeth", at: 56 },
    },
    fires: sconces(24, 264, 44),
    props: [
      { kind: "statue", x: 108, y: 90 },
      { kind: "statue", x: 244, y: 90, flip: true },
      { kind: "column", x: 40, y: 104 },
      { kind: "column", x: 312, y: 104 },
      { kind: "rubble", x: 296, y: 186, seed: 17 },
      { kind: "stump", x: 176, y: 182, seed: 19 },
    ],
    spots: [{ target: { kind: "gate" }, x: 176, y: 90, r: 30, capY: 2 }],
  },
  chasm: {
    id: "chasm",
    title: "The Chasm",
    at: [3, 1],
    w: 24,
    h: 13,
    wall: 3,
    doors: { w: { to: "gate", at: 120 } },
    fires: sconces(30, 140),
    props: [
      { kind: "column", x: 48, y: 82 },
      { kind: "stump", x: 44, y: 180, seed: 21 },
      { kind: "column", x: 352, y: 82 },
      { kind: "column", x: 352, y: 180 },
      { kind: "amphora", x: 288, y: 182, seed: 8 },
    ],
    floor: [
      "....pppppppppppp......",
      "....pppppppppppp......",
      "....ppphhhhhhhpp......",
      "....ppphppppphpp......",
      "....hhhhppppphpp......",
      "....ppppppppphpp......",
      "....ppppppppphhh......",
      "....pppppppppppp......",
      "....pppppppppppp......",
    ],
    safe: { x: 60, y: 120 },
    spots: [{ target: { kind: "stone" }, x: 320, y: 128, r: 28, capY: 42 }],
  },
  sanctum: {
    id: "sanctum",
    title: "The Sanctum",
    at: [1, 0],
    w: 20,
    h: 13,
    wall: 4,
    doors: { s: { to: "hall", at: 160 } },
    fires: sconces(20, 240, 44),
    props: [
      { kind: "column", x: 72, y: 96 },
      { kind: "column", x: 248, y: 96 },
      { kind: "column", x: 72, y: 150 },
      { kind: "column", x: 248, y: 150 },
      { kind: "statue", x: 118, y: 100 },
      { kind: "statue", x: 202, y: 100, flip: true },
    ],
    spots: [{ target: { kind: "altar" }, x: 160, y: 128, r: 28, capY: 96 }],
  },
};

export const ROOM_LIST = Object.values(ROOMS);

/** The room's interior, in pixels: where feet can stand. */
export function interior(room: Room) {
  return {
    left: TILE,
    right: (room.w - 1) * TILE,
    top: room.wall * TILE,
    bottom: (room.h - 1) * TILE,
  };
}

/** The opening of a door: half its width. */
export const DOOR_HALF = 16;

/** Where a dinosaur coming through `side` of `room` stands. */
export function arrival(room: Room, side: Side) {
  const door = room.doors[side];
  const box = interior(room);
  const at = door?.at ?? 0;
  if (side === "n") return { x: at, y: box.top + 12 };
  if (side === "s") return { x: at, y: box.bottom - 10 };
  if (side === "w") return { x: box.left + 12, y: at };
  return { x: box.right - 12, y: at };
}

export const OPPOSITE: Record<Side, Side> = { n: "s", s: "n", e: "w", w: "e" };

/** The solid part of a prop, as a box around its feet; null when it can be walked over. */
export function solidOf(prop: Prop): { x: number; y: number; w: number; h: number } | null {
  switch (prop.kind) {
    case "column":
      return { x: prop.x - 6, y: prop.y - 5, w: 12, h: 6 };
    case "stump":
      return { x: prop.x - 6, y: prop.y - 5, w: 12, h: 6 };
    case "amphora":
      return { x: prop.x - 4, y: prop.y - 3, w: 8, h: 4 };
    case "statue":
      return { x: prop.x - 11, y: prop.y - 7, w: 22, h: 8 };
    case "plinth":
      return { x: prop.x - 9, y: prop.y - 6, w: 18, h: 7 };
    case "sarcophagus":
      return { x: prop.x - 21, y: prop.y - 18, w: 42, h: 20 };
    default:
      return null;
  }
}

/** The solid foot of a fire standing on the floor. */
export function solidOfFire(fire: Fire) {
  return fire.big ? { x: fire.x - 5, y: fire.y - 3, w: 10, h: 4 } : null;
}
