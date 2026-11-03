import { DINO_ARM, DINO_EYE, DINO_PIXELS } from "@/components/brand/dino-pixels";
import { interior, TILE, type Prop, type Room } from "@/components/olympus/crawl/world";

/**
 * The tomb's pictures, all made in the browser: solid cells, no files. Each room's walls and floor
 * are painted once into their own canvas; props are string maps turned into small canvases and
 * kept. Stone runs through greys with a little warmth so the green fire reads on it; the dinosaur
 * is the site's green and the props follow the site's pixel rules (nothing scaled or rotated).
 */

export const C = {
  void: "#040404",
  s0: "#0d0d0c",
  s1: "#161615",
  s2: "#201f1c",
  s3: "#2d2c27",
  s4: "#3f3d36",
  s5: "#57544b",
  s6: "#797569",
  s7: "#a29e90",
  s8: "#d9d5c8",
  white: "#f5f5f5",
  green: "#03c652",
  mint: "#00eb88",
  deep: "#277d4a",
  moss: "#173f29",
  gold: "#e9c46a",
  red: "#ff4545",
} as const;

export function rng(seed: number) {
  let a = seed * 2654435761 + 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w));
  canvas.height = Math.max(1, Math.ceil(h));
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

type Inks = Record<string, string>;

/** A string map as a small canvas: `.` is empty, every other character an ink. */
export function fromRows(rows: readonly string[], inks: Inks) {
  const { canvas, ctx } = makeCanvas(rows[0]!.length, rows.length);
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const ink = inks[ch];
      if (!ink) return;
      ctx.fillStyle = ink;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return canvas;
}

const cache = new Map<string, HTMLCanvasElement>();

/** A picture made once and kept. */
export function kept(key: string, make: () => HTMLCanvasElement) {
  let found = cache.get(key);
  if (!found) {
    found = make();
    cache.set(key, found);
  }
  return found;
}

/* ------------------------------------------------------------------ the dinosaur */

/** The legs of the T-rex in the four steps of a walk, replacing DINO_PIXELS's last four rows. */
const LEGS = [
  [".....###.##.........", ".....##...#.........", ".....#....#.........", ".....##...##........"],
  [".....###.##.........", ".....##...#.........", "..........#.........", "..........##........"],
  [".....###.##.........", ".....##...#.........", ".....#....#.........", ".....##...##........"],
  [".....###.##.........", ".....##...#.........", ".....#..............", ".....##............."],
];

/** A fedora, worn over the head's top row: the brim, a green band, the crown. */
const HAT = [
  "....######....",
  "...########...",
  "...########...",
  "...gggggggg...",
  "##############",
];
const HAT_X = 8;
const HAT_Y = -4;

/** Room for the hat above the map. */
export const DINO_TOP = 5;
export const DINO_W = 24;
export const DINO_H = 22 + DINO_TOP;
/** The point between the feet, in the picture's cells. */
export const DINO_FOOT_X = 9;

/**
 * One frame of the dinosaur. `step` is the walk's place (0-3), `blink` covers the eye, `flip` faces
 * left, `tint` draws all of it in one ink (the shade of a dash).
 */
export function dinoFrame(step: number, blink: boolean, flip: boolean, tint?: string) {
  return kept(`dino:${step}:${blink}:${flip}:${tint ?? ""}`, () => {
    const { canvas, ctx } = makeCanvas(DINO_W, DINO_H);
    const rows = [...DINO_PIXELS.slice(0, 18), ...LEGS[step]!];
    const cell = (x: number, y: number, ink: string) => {
      ctx.fillStyle = tint ?? ink;
      ctx.fillRect(flip ? DINO_W - 1 - x : x, y + DINO_TOP, 1, 1);
    };
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch !== "#") return;
        const armCell = DINO_ARM.some(([ax, ay]) => ax === x && ay === y);
        cell(x, y, armCell ? C.mint : C.green);
      }),
    );
    if (blink) cell(DINO_EYE.x, DINO_EYE.y, C.green);
    HAT.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === ".") return;
        cell(HAT_X + x, HAT_Y + y, ch === "g" ? C.deep : C.s8);
      }),
    );
    return canvas;
  });
}

/* ------------------------------------------------------------------ the pixel letters */

const FONT: Record<string, readonly string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
};

/** One letter, 5 × 7 cells at `size` pixels a cell. */
export function drawLetter(
  ctx: CanvasRenderingContext2D,
  letter: string,
  x: number,
  y: number,
  ink: string,
  size = 1,
) {
  const glyph = FONT[letter];
  if (!glyph) return;
  ctx.fillStyle = ink;
  glyph.forEach((row, gy) =>
    [...row].forEach((ch, gx) => {
      if (ch === "#") ctx.fillRect(x + gx * size, y + gy * size, size, size);
    }),
  );
}

/** A word in the pixel letters, centred on `cx`. */
export function drawWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  cx: number,
  y: number,
  ink: string,
  size = 1,
) {
  const advance = 6 * size;
  const left = Math.round(cx - (word.length * advance - size) / 2);
  [...word].forEach((ch, i) => drawLetter(ctx, ch, left + i * advance, y, ink, size));
}

/** Rows of made-up glyphs: what an unreadable carving looks like from across a room. */
export function drawGlyphs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  rows: number,
  ink: string,
  seed: number,
) {
  const r = rng(seed);
  ctx.fillStyle = ink;
  for (let row = 0; row < rows; row += 1) {
    let at = x;
    while (at < x + w - 2) {
      const kind = Math.floor(r() * 4);
      const gy = y + row * 5;
      if (kind === 0) ctx.fillRect(at, gy, 1, 3);
      else if (kind === 1) ctx.fillRect(at, gy + 2, 2, 1);
      else if (kind === 2) {
        ctx.fillRect(at, gy, 2, 1);
        ctx.fillRect(at + 1, gy + 1, 1, 2);
      } else {
        ctx.fillRect(at, gy + 1, 2, 2);
      }
      at += 3 + Math.floor(r() * 2);
    }
  }
}

/* ------------------------------------------------------------------ props */

const STONE: Inks = { "#": C.s6, "+": C.s7, "-": C.s4, "=": C.s5, w: C.s8, g: C.deep, m: C.moss };

const AMPHORA = [
  "..+####-...",
  "...+##-....",
  "...+##-....",
  ".+.+##-.-..",
  "+..+##-..-.",
  "+.+####-.-.",
  ".+######-..",
  ".+######--.",
  "+gggggggg-.",
  "+#g#g#g#g-.",
  "+gggggggg-.",
  "+#######--.",
  ".+#####--..",
  "..+###--...",
  "...+#--....",
  "..+###--...",
];

const AMPHORA_BROKEN = [
  "...........",
  "...........",
  "...........",
  "...........",
  "..#.....-..",
  "..+#..#-.-.",
  ".+######-..",
  ".+######--.",
  "+gggggggg-.",
  "+#g#g#g#g-.",
  "+gggggggg-.",
  "+#######--.",
  ".+#####--..",
  "..+###--...",
  "...+#--....",
  "..+###--...",
];

/** A fluted column, as tall as `shaft`: capital, fluted shaft, base. */
function columnPicture(shaft: number, broken = 0) {
  const W = 15;
  const { canvas, ctx } = makeCanvas(W, shaft + 8);
  const r = rng(shaft * 31 + broken);
  const flutes = [C.s5, C.s7, C.s6, C.s7, C.s6, C.s6, C.s5, C.s4, C.s4];
  if (!broken) {
    ctx.fillStyle = C.s7;
    ctx.fillRect(0, 0, W, 2);
    ctx.fillStyle = C.s5;
    ctx.fillRect(0, 2, W, 1);
    ctx.fillStyle = C.s6;
    ctx.fillRect(1, 3, W - 2, 1);
    ctx.fillStyle = C.s4;
    ctx.fillRect(2, 4, W - 4, 1);
  }
  flutes.forEach((ink, i) => {
    const top = broken ? 2 + Math.floor(r() * 6) : 5;
    ctx.fillStyle = ink;
    ctx.fillRect(3 + i, top, 1, shaft + 3 - top);
  });
  // Cracks and wear.
  ctx.fillStyle = C.s3;
  for (let i = 0; i < 5; i += 1)
    ctx.fillRect(3 + Math.floor(r() * 9), 6 + Math.floor(r() * shaft * 0.8), 1, 2);
  ctx.fillStyle = C.s6;
  ctx.fillRect(1, shaft + 3, W - 2, 2);
  ctx.fillStyle = C.s4;
  ctx.fillRect(0, shaft + 5, W, 3);
  ctx.fillStyle = C.s5;
  ctx.fillRect(0, shaft + 5, W, 1);
  return canvas;
}

/** A dinosaur in stone on a plinth: every dinosaur in the tomb is the same T-rex. */
function statuePicture(flip: boolean) {
  const W = 24;
  const H = 32;
  const { canvas, ctx } = makeCanvas(W, H);
  DINO_PIXELS.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== "#") return;
      const light = x + y < 18 ? C.s7 : x + y < 28 ? C.s6 : C.s5;
      ctx.fillStyle = (x * 7 + y * 13) % 11 === 0 ? C.s4 : light;
      ctx.fillRect((flip ? W - 3 - x : x + 2) - (flip ? 0 : 0), y + 1, 1, 1);
    }),
  );
  ctx.fillStyle = C.s7;
  ctx.fillRect(0, 23, W, 2);
  ctx.fillStyle = C.s5;
  ctx.fillRect(1, 25, W - 2, 5);
  ctx.fillStyle = C.s4;
  ctx.fillRect(1, 28, W - 2, 2);
  ctx.fillStyle = C.s3;
  ctx.fillRect(0, 30, W, 2);
  return canvas;
}

/** Someone who got this far: ribs, a tail, and the skull of the same T-rex. */
const BONES = [
  "......w..w..w..w.....wwwww.",
  ".....w..w..w..w.....wwwwwww",
  "....w.ww.ww.ww.ww...ww.wwww",
  "wwwwwwwwwwwwwwwwwwwwwwwwww.",
  "....w.ww.ww.ww.ww...wwwwww.",
  ".....w..w..w..w.....w.w.w..",
  "......w..w..w..w...........",
];

/** The stone box of the Crypt, seen from above and a little in front. */
function sarcophagusPicture() {
  const W = 44;
  const H = 30;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = C.s4;
  ctx.fillRect(0, 2, W, H - 2);
  ctx.fillStyle = C.s6;
  ctx.fillRect(1, 0, W - 2, 18);
  ctx.fillStyle = C.s7;
  ctx.fillRect(1, 0, W - 2, 1);
  ctx.fillRect(1, 0, 1, 18);
  ctx.fillStyle = C.s5;
  ctx.fillRect(4, 3, W - 8, 12);
  // A long carved figure on the lid: the T-rex lying down would be silly; a plain cross band.
  ctx.fillStyle = C.s4;
  ctx.fillRect(8, 5, W - 16, 8);
  ctx.fillStyle = C.s6;
  ctx.fillRect(10, 7, W - 20, 4);
  ctx.fillStyle = C.s4;
  for (let x = 13; x < W - 12; x += 4) ctx.fillRect(x, 8, 2, 2);
  // Front face with the Greek key.
  ctx.fillStyle = C.s3;
  ctx.fillRect(0, 18, W, 1);
  ctx.fillStyle = C.s5;
  for (let x = 2; x < W - 4; x += 6) {
    ctx.fillRect(x, 21, 4, 1);
    ctx.fillRect(x, 21, 1, 5);
    ctx.fillRect(x, 25, 5, 1);
    ctx.fillRect(x + 3, 23, 1, 2);
  }
  return canvas;
}

export function propPicture(prop: Prop) {
  const key = `prop:${prop.kind}:${prop.flip ?? false}:${prop.seed ?? 0}`;
  return kept(key, () => {
    switch (prop.kind) {
      case "column":
        return columnPicture(42);
      case "stump":
        return columnPicture(14, (prop.seed ?? 1) + 1);
      case "amphora":
        return fromRows((prop.seed ?? 0) % 3 === 2 ? AMPHORA_BROKEN : AMPHORA, STONE);
      case "statue":
        return statuePicture(!!prop.flip);
      case "bones":
        return fromRows(BONES, { w: C.s7 });
      case "sarcophagus":
        return sarcophagusPicture();
      case "plinth": {
        const { canvas, ctx } = makeCanvas(20, 18);
        ctx.fillStyle = C.s7;
        ctx.fillRect(0, 0, 20, 2);
        ctx.fillStyle = C.s5;
        ctx.fillRect(2, 2, 16, 12);
        ctx.fillStyle = C.s4;
        ctx.fillRect(12, 2, 6, 12);
        ctx.fillStyle = C.s6;
        ctx.fillRect(0, 14, 20, 4);
        return canvas;
      }
      case "rubble": {
        const r = rng((prop.seed ?? 1) * 97);
        const { canvas, ctx } = makeCanvas(26, 12);
        for (let i = 0; i < 9; i += 1) {
          const w = 2 + Math.floor(r() * 6);
          const h = 2 + Math.floor(r() * 4);
          const x = Math.floor(r() * (26 - w));
          const y = 12 - h - Math.floor(r() * 3);
          ctx.fillStyle = [C.s4, C.s5, C.s6][Math.floor(r() * 3)]!;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = C.s7;
          ctx.fillRect(x, y, w, 1);
          ctx.fillStyle = C.s3;
          ctx.fillRect(x, y + h - 1, w, 1);
        }
        return canvas;
      }
    }
  });
}

/** The brazier: a bowl on a stem. Wall fires are small, the Hall's stand on the floor. */
const BRAZIER_BIG = [
  "#############",
  "+###########-",
  ".+#########-.",
  "..+#######-..",
  "....+###-....",
  ".....+#-.....",
  ".....+#-.....",
  ".....+#-.....",
  ".....+#-.....",
  ".....+#-.....",
  "....+###-....",
  "...+#####-...",
  "..+#######-..",
];
const SCONCE = ["#######", "+#####-", ".+###-.", "..+#-..", "..+#-..", "...=..."];

export function brazierPicture(big: boolean) {
  return kept(`brazier:${big}`, () => fromRows(big ? BRAZIER_BIG : SCONCE, STONE));
}

/* ------------------------------------------------------------------ fire */

/**
 * A live flame in whole cells, its foot at (cx, base): each row a span whose width and lean come
 * from a noise that climbs with time, white-hot low in the middle and deep green at its edges.
 * `flare` burns red: the signal's opening flare.
 */
export function drawFlame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  base: number,
  half: number,
  height: number,
  time: number,
  seed: number,
  flare: boolean,
) {
  const ink = flare
    ? { core: C.s8, mid: C.red, edge: "#8c2020" }
    : { core: C.mint, mid: C.green, edge: C.deep };
  for (let row = 0; row < height; row += 1) {
    const u = row / height;
    const wob =
      Math.sin(time * 9 + seed + row * 0.7) + 0.6 * Math.sin(time * 15.3 + seed * 2 + row);
    const lean = Math.round(wob * u * 1.8);
    const width = Math.round(
      half * (1 - u ** 1.5) * (0.82 + 0.22 * Math.sin(time * 11 + seed + row)),
    );
    if (width < 0) continue;
    const y = base - row;
    const x = cx + lean;
    ctx.fillStyle = ink.edge;
    ctx.fillRect(x - width, y, width * 2 + 1, 1);
    if (width > 1) {
      ctx.fillStyle = ink.mid;
      ctx.fillRect(x - width + 1, y, width * 2 - 1, 1);
    }
    if (width > 2 && u < 0.55) {
      ctx.fillStyle = ink.core;
      ctx.fillRect(x - width + 3, y, Math.max(1, width * 2 - 5), 1);
    }
  }
}

/* ------------------------------------------------------------------ light */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * A pool of light as a picture to cut out of the dark: alpha falling off in four dithered bands, so
 * the edge of the light is chunky like everything else.
 */
export function lightPicture(radius: number, power = 1) {
  return kept(`light:${radius}:${power}`, () => {
    const size = radius * 2;
    const { canvas, ctx } = makeCanvas(size, size);
    const image = ctx.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const d = Math.hypot(x - radius + 0.5, y - radius + 0.5) / radius;
        if (d >= 1) continue;
        const v = (1 - d) ** 1.2 * 4 * power;
        const threshold = BAYER[(x % 4) + (y % 4) * 4]! / 16;
        const band = Math.min(4, Math.floor(v + threshold));
        image.data[(x + y * size) * 4 + 3] = (band / 4) * 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  });
}

/** The same pool in the fire's colour, added over the room so firelight tints what it touches. */
export function tintPicture(radius: number, flare: boolean) {
  return kept(`tint:${radius}:${flare}`, () => {
    const { canvas, ctx } = makeCanvas(radius * 2, radius * 2);
    ctx.drawImage(lightPicture(radius), 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = flare ? C.red : C.green;
    ctx.fillRect(0, 0, radius * 2, radius * 2);
    return canvas;
  });
}

/* ------------------------------------------------------------------ rooms */

const DOOR = 32;

function fill(
  ctx: CanvasRenderingContext2D,
  ink: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = ink;
  ctx.fillRect(x, y, w, h);
}

/** Flagstones over the whole floor, each a little different, some cracked or mossy. */
function paintFloor(ctx: CanvasRenderingContext2D, room: Room, r: () => number) {
  const box = interior(room);
  const shades = [C.s2, C.s2, C.s2, C.s3, "#1c1b18"];
  for (let row = 0, y = box.top; y < box.bottom + TILE; row += 1, y += TILE) {
    let x = row % 2 ? -TILE + box.left : box.left;
    while (x < box.right + TILE) {
      const w = TILE * (r() < 0.45 ? 2 : 1);
      const shade = shades[Math.floor(r() * shades.length)]!;
      fill(ctx, shade, x, y, w, TILE);
      fill(ctx, C.s0, x, y + TILE - 1, w, 1);
      fill(ctx, C.s0, x + w - 1, y, 1, TILE);
      fill(ctx, "#2a2925", x, y, w - 1, 1);
      fill(ctx, "#25241f", x, y, 1, TILE - 1);
      // Speckle.
      for (let i = 0; i < 5; i += 1) {
        fill(
          ctx,
          r() < 0.5 ? "#191815" : "#2b2a25",
          x + 1 + Math.floor(r() * (w - 2)),
          y + 1 + Math.floor(r() * (TILE - 2)),
          1,
          1,
        );
      }
      if (r() < 0.14) {
        let cx = x + 2 + Math.floor(r() * (w - 4));
        let cy = y + 1;
        while (cy < y + TILE - 2) {
          fill(ctx, C.s0, cx, cy, 1, 1);
          cy += 1;
          cx += Math.floor(r() * 3) - 1;
        }
      }
      if (r() < 0.07) {
        const mx = x + 1 + Math.floor(r() * (w - 6));
        const my = y + 9 + Math.floor(r() * 4);
        for (let i = 0; i < 7; i += 1)
          fill(ctx, C.moss, mx + Math.floor(r() * 5), my + Math.floor(r() * 3), 1, 1);
      }
      x += w;
    }
  }
}

/** A band of the Greek key along the wall. */
function paintKey(ctx: CanvasRenderingContext2D, y: number, width: number, ink: string) {
  const KEY = ["#####.", "#...#.", "#.#.#.", "#.###.", "#.....", "######"];
  for (let x = 0; x < width; x += KEY[0]!.length) {
    KEY.forEach((row, ky) =>
      [...row].forEach((ch, kx) => {
        if (ch === "#" && x + kx < width) fill(ctx, ink, x + kx, y + ky, 1, 1);
      }),
    );
  }
}

/** The north wall: a cornice, the Greek key, courses of big stones and a plinth at its foot. */
function paintNorthWall(ctx: CanvasRenderingContext2D, room: Room, r: () => number) {
  const W = room.w * TILE;
  const H = room.wall * TILE;
  fill(ctx, C.s1, 0, 0, W, H);
  // Courses.
  const shades = [C.s3, C.s3, C.s4, "#34322c", "#282722"];
  const COURSE = 10;
  for (let row = 0, y = 12; y < H - 4; row += 1, y += COURSE) {
    let x = row % 2 ? -12 : 0;
    while (x < W) {
      const w = 18 + Math.floor(r() * 14);
      const h = Math.min(COURSE, H - 4 - y);
      fill(ctx, shades[Math.floor(r() * shades.length)]!, x, y, w, h);
      fill(ctx, C.s0, x, y + h - 1, w, 1);
      fill(ctx, C.s0, x + w - 1, y, 1, h);
      fill(ctx, C.s5, x, y, w - 1, 1);
      if (r() < 0.35) fill(ctx, "#232220", x + 2 + Math.floor(r() * (w - 6)), y + 3, 3, 1);
      if (r() < 0.16) {
        // Vines hang from a joint.
        const vx = x + Math.floor(r() * w);
        const len = 6 + Math.floor(r() * 18);
        for (let i = 0; i < len; i += 1) {
          fill(ctx, i % 3 ? C.moss : C.deep, vx + (i % 5 === 4 ? 1 : 0), y + i, 1, 1);
        }
      }
      x += w;
    }
  }
  // Cornice and frieze.
  fill(ctx, C.s0, 0, 0, W, 2);
  fill(ctx, C.s6, 0, 2, W, 1);
  fill(ctx, C.s4, 0, 3, W, 2);
  fill(ctx, C.s1, 0, 5, W, 7);
  paintKey(ctx, 5, W, C.deep);
  fill(ctx, C.s5, 0, 11, W, 1);
  // Plinth.
  fill(ctx, C.s4, 0, H - 4, W, 4);
  fill(ctx, C.s6, 0, H - 4, W, 1);
  fill(ctx, C.s2, 0, H - 1, W, 1);
}

/** The shade the wall throws on the floor: dithered, whole cells. */
function paintShade(ctx: CanvasRenderingContext2D, room: Room) {
  const box = interior(room);
  const W = room.w * TILE;
  ctx.fillStyle = "#060606";
  for (let row = 0; row < 12; row += 1) {
    const every = row < 3 ? 1 : row < 6 ? 2 : row < 9 ? 3 : 5;
    for (let x = 0; x < W; x += 1) {
      if ((x + row) % every === 0) ctx.fillRect(x, box.top + row, 1, 1);
    }
  }
  const H = room.h * TILE;
  for (let col = 0; col < 7; col += 1) {
    const every = col < 2 ? 1 : col < 4 ? 2 : 3;
    for (let y = box.top; y < H; y += 1) {
      if ((y + col) % every === 0) {
        ctx.fillRect(box.left + col, y, 1, 1);
        ctx.fillRect(box.right - 1 - col, y, 1, 1);
      }
    }
  }
}

/** Side and south walls, seen from above, with the door gaps left open. */
function paintOuterWalls(ctx: CanvasRenderingContext2D, room: Room) {
  const W = room.w * TILE;
  const H = room.h * TILE;
  const box = interior(room);
  const top = (x: number, y: number, w: number, h: number) => {
    fill(ctx, C.s1, x, y, w, h);
    for (let i = x; i < x + w; i += 8) {
      for (let j = y; j < y + h; j += 8) {
        if ((i + j) % 16 === 0) fill(ctx, "#1a1a18", i, j, 8, 8);
      }
    }
  };
  top(0, 0, TILE, H);
  top(W - TILE, 0, TILE, H);
  top(0, H - TILE, W, TILE);
  // Inner edges catch the light.
  fill(ctx, C.s5, TILE - 2, box.top, 2, H - box.top - TILE);
  fill(ctx, C.s5, W - TILE, box.top, 2, H - box.top - TILE);
  fill(ctx, C.s5, TILE, H - TILE, W - TILE * 2, 2);
  fill(ctx, C.s3, 0, 0, TILE, 1);
  // The corners of the frieze are covered by the wall tops.
  fill(ctx, C.s1, 0, 0, TILE, box.top);
  fill(ctx, C.s1, W - TILE, 0, TILE, box.top);
}

function paintDoors(ctx: CanvasRenderingContext2D, room: Room, r: () => number) {
  const W = room.w * TILE;
  const H = room.h * TILE;
  const box = interior(room);
  const { n, s, e, w } = room.doors;
  const floorGap = (x: number, y: number, gw: number, gh: number) => {
    fill(ctx, C.s2, x, y, gw, gh);
    for (let i = 0; i < gw * gh * 0.08; i += 1)
      fill(ctx, "#2b2a25", x + Math.floor(r() * gw), y + Math.floor(r() * gh), 1, 1);
  };
  if (s) {
    floorGap(s.at - DOOR / 2, H - TILE, DOOR, TILE);
    fill(ctx, C.s6, s.at - DOOR / 2 - 2, H - TILE, 2, TILE);
    fill(ctx, C.s6, s.at + DOOR / 2, H - TILE, 2, TILE);
    fill(ctx, C.void, s.at - DOOR / 2, H - 5, DOOR, 5);
  }
  if (w) {
    floorGap(0, w.at - DOOR / 2, TILE, DOOR);
    fill(ctx, C.s6, 0, w.at - DOOR / 2 - 2, TILE, 2);
    fill(ctx, C.s6, 0, w.at + DOOR / 2, TILE, 2);
    fill(ctx, C.void, 0, w.at - DOOR / 2, 5, DOOR);
  }
  if (e) {
    floorGap(W - TILE, e.at - DOOR / 2, TILE, DOOR);
    fill(ctx, C.s6, W - TILE, e.at - DOOR / 2 - 2, TILE, 2);
    fill(ctx, C.s6, W - TILE, e.at + DOOR / 2, TILE, 2);
    fill(ctx, C.void, W - 5, e.at - DOOR / 2, 5, DOOR);
  }
  if (n && room.id !== "hall") {
    // An arch in the wall: dark inside, a stone frame and a keystone.
    const x = n.at - DOOR / 2;
    const top = 14;
    fill(ctx, C.void, x, top, DOOR, box.top - top);
    fill(ctx, C.s1, x + 2, box.top - 6, DOOR - 4, 6);
    fill(ctx, C.s6, x - 4, top - 2, 4, box.top - top + 2);
    fill(ctx, C.s6, x + DOOR, top - 2, 4, box.top - top + 2);
    fill(ctx, C.s7, x - 4, top - 2, 1, box.top - top + 2);
    fill(ctx, C.s7, x + DOOR, top - 2, 1, box.top - top + 2);
    fill(ctx, C.s6, x - 4, top - 4, DOOR + 8, 4);
    fill(ctx, C.s7, x - 4, top - 4, DOOR + 8, 1);
    fill(ctx, C.s7, n.at - 4, top - 6, 8, 7);
    fill(ctx, C.deep, n.at - 2, top - 4, 4, 3);
    // Worn step.
    fill(ctx, C.s4, x, box.top, DOOR, 3);
  }
}

/**
 * A pit: the far side's stones going down into the dark, a lit lip where the floor stops, and very
 * far below, something green still burning.
 */
function paintPits(ctx: CanvasRenderingContext2D, room: Room, r: () => number) {
  if (!room.floor) return;
  const box = interior(room);
  const at = (col: number, row: number) => room.floor![row]?.[col] ?? ".";
  const deep = room.floor.length / 2;
  room.floor.forEach((rowText, row) =>
    [...rowText].forEach((ch, col) => {
      if (ch === ".") return;
      const x = box.left + col * TILE;
      const y = box.top + row * TILE;
      fill(ctx, C.void, x, y, TILE, TILE);
      // The glow from the bottom, densest at the middle of the chasm.
      const near = 1 - Math.min(1, Math.abs(row + 0.5 - deep) / deep);
      for (let i = 0; i < near * near * 34; i += 1) {
        fill(ctx, "#08160e", x + Math.floor(r() * TILE), y + Math.floor(r() * TILE), 2, 2);
      }
      if (at(col, row - 1) === ".") {
        // The far wall of the drop, in courses that sink into the dark.
        const shades = [C.s4, C.s3, C.s2, C.s1, "#0f0f0e"];
        shades.forEach((ink, band) => {
          const by = y + band * 4;
          fill(ctx, ink, x, by, TILE, 3);
          fill(ctx, C.void, x + ((band * 7 + col * 5) % TILE), by, 1, 3);
        });
        fill(ctx, C.s6, x, y, TILE, 1);
      }
      if (at(col - 1, row) === ".") {
        fill(ctx, C.s5, x, y, 1, TILE);
        fill(ctx, C.s2, x + 1, y, 2, TILE);
      }
      if (at(col + 1, row) === ".") {
        fill(ctx, C.s5, x + TILE - 1, y, 1, TILE);
        fill(ctx, C.s2, x + TILE - 3, y, 2, TILE);
      }
      if (at(col, row + 1) === "." && row + 1 < room.floor!.length) {
        fill(ctx, C.s4, x, y + TILE - 1, TILE, 1);
      }
      // Dust lies on the hidden stones, if a light is close enough to see it.
      if (ch === "h") {
        for (let i = 0; i < 7; i += 1) {
          fill(ctx, C.s3, x + 1 + Math.floor(r() * 14), y + 1 + Math.floor(r() * 14), 1, 1);
        }
      }
    }),
  );
}

/** One hidden stone once it is known: a plain flagstone. */
export function drawPathStone(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fill(ctx, C.s3, x, y, TILE, TILE);
  fill(ctx, C.s4, x, y, TILE, 1);
  fill(ctx, C.s4, x, y, 1, TILE);
  fill(ctx, C.s0, x, y + TILE - 1, TILE, 1);
  fill(ctx, C.s0, x + TILE - 1, y, 1, TILE);
}

/** The Hall's square before it speaks: twenty-five blank tiles sunk into the floor. */
function paintSquareBed(
  ctx: CanvasRenderingContext2D,
  room: Room,
  sx: number,
  sy: number,
  t: number,
) {
  if (room.id !== "hall") return;
  fill(ctx, C.s0, sx - 3, sy - 3, t * 5 + 6, t * 5 + 6);
  fill(ctx, C.s4, sx - 3, sy - 3, t * 5 + 6, 1);
  fill(ctx, C.s4, sx - 3, sy - 3, 1, t * 5 + 6);
  fill(ctx, C.s3, sx + t * 5 + 2, sy - 3, 1, t * 5 + 6);
  fill(ctx, C.s3, sx - 3, sy + t * 5 + 2, t * 5 + 6, 1);
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) drawSquareTile(ctx, sx + col * t, sy + row * t, t);
  }
}

/** One tile of the square, its letter drawn on top by whoever needs one. */
export function drawSquareTile(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  fill(ctx, C.s3, x + 1, y + 1, t - 2, t - 2);
  fill(ctx, C.s4, x + 1, y + 1, t - 2, 1);
  fill(ctx, C.s4, x + 1, y + 1, 1, t - 2);
  fill(ctx, C.s1, x + 1, y + t - 2, t - 2, 1);
  fill(ctx, C.s1, x + t - 2, y + 1, 1, t - 2);
}

/** Holes in the floor where the spikes live. */
function paintSpikeBeds(ctx: CanvasRenderingContext2D, room: Room) {
  if (!room.spikes) return;
  const box = interior(room);
  for (const strip of room.spikes) {
    fill(ctx, C.s1, strip.x, box.top, strip.w, box.bottom - box.top);
    fill(ctx, C.s4, strip.x - 1, box.top, 1, box.bottom - box.top);
    fill(ctx, C.s4, strip.x + strip.w, box.top, 1, box.bottom - box.top);
    for (let y = box.top + 3; y < box.bottom; y += 8) {
      for (let x = strip.x + 3; x < strip.x + strip.w; x += 8) {
        fill(ctx, C.void, x, y, 3, 3);
      }
    }
  }
}

/** The room's walls and floor, painted once. */
export function paintRoom(room: Room, square: { x: number; y: number; tile: number }) {
  const { canvas, ctx } = makeCanvas(room.w * TILE, room.h * TILE);
  const r = rng(room.id.length * 131 + room.title.charCodeAt(4) * 7 + room.w);
  paintFloor(ctx, room, r);
  paintSquareBed(ctx, room, square.x, square.y, square.tile);
  paintSpikeBeds(ctx, room);
  paintPits(ctx, room, r);
  paintNorthWall(ctx, room, r);
  paintShade(ctx, room);
  paintOuterWalls(ctx, room);
  paintDoors(ctx, room, r);
  return canvas;
}

/** A square of the same stone for the close-ups, as a data URL (crawl.css tiles it). */
export function stoneTexture() {
  const { canvas, ctx } = makeCanvas(96, 96);
  const r = rng(77);
  fill(ctx, C.s2, 0, 0, 96, 96);
  for (let row = 0; row < 4; row += 1) {
    let x = row % 2 ? -16 : 0;
    while (x < 96) {
      const w = 28 + Math.floor(r() * 20);
      fill(ctx, ["#201f1c", "#23221e", "#1e1d1a"][Math.floor(r() * 3)]!, x, row * 24, w, 24);
      fill(ctx, "#171614", x, row * 24 + 23, w, 1);
      fill(ctx, "#171614", x + w - 1, row * 24, 1, 24);
      fill(ctx, "#2a2925", x, row * 24, w - 1, 1);
      x += w;
    }
  }
  for (let i = 0; i < 260; i += 1) {
    fill(ctx, r() < 0.5 ? "#1a1916" : "#272622", Math.floor(r() * 96), Math.floor(r() * 96), 1, 1);
  }
  return canvas.toDataURL("image/png");
}
