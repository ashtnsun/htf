import { DINO_ARM, DINO_EYE, DINO_PIXELS } from "@/components/brand/dino-pixels";
import { CELL, TILE, type Prop, type Room, type ThemeId } from "@/components/olympus/crawl/world";

/**
 * The tomb's pictures, all made in the browser: solid cells, no files. Each room's walls and floor
 * are painted once into their own canvas, in its own stone (`THEMES`), so no two rooms look alike;
 * props are string maps turned into small canvases and kept. The dinosaur is the site's green and
 * the props follow the site's pixel rules (nothing scaled or rotated: the gears are redrawn cell by
 * cell at each angle).
 */

export const C = {
  void: "#040404",
  white: "#f5f5f5",
  green: "#03c652",
  mint: "#00eb88",
  deep: "#277d4a",
  gold: "#e9c46a",
  red: "#ff4545",
} as const;

/** A stone: its ramp from nearly black to pale, what grows on it, and what its frieze is cut in. */
export type Theme = {
  s0: string;
  s1: string;
  s2: string;
  s3: string;
  s4: string;
  s5: string;
  s6: string;
  s7: string;
  s8: string;
  moss: string;
  frieze: string;
};

const ramp = (r: string[], moss: string, frieze: string): Theme => ({
  s0: r[0]!,
  s1: r[1]!,
  s2: r[2]!,
  s3: r[3]!,
  s4: r[4]!,
  s5: r[5]!,
  s6: r[6]!,
  s7: r[7]!,
  s8: r[8]!,
  moss,
  frieze,
});

export const THEMES: Record<ThemeId, Theme> = {
  // Sandstone, under the hole they fell through.
  sand: ramp(
    [
      "#120d07",
      "#1f1810",
      "#30271a",
      "#423724",
      "#594b32",
      "#796847",
      "#a08e66",
      "#c6b78f",
      "#e8ddbd",
    ],
    "#3f4a1c",
    "#a08e66",
  ),
  // The grey the Hall has always been.
  hall: ramp(
    [
      "#0d0d0c",
      "#161615",
      "#201f1c",
      "#2d2c27",
      "#3f3d36",
      "#57544b",
      "#797569",
      "#a29e90",
      "#d9d5c8",
    ],
    "#173f29",
    C.deep,
  ),
  // Cold blue, wet.
  crypt: ramp(
    [
      "#090c11",
      "#11171e",
      "#19222b",
      "#25303b",
      "#354351",
      "#4d5e6e",
      "#6f8291",
      "#9cadb9",
      "#d2dce2",
    ],
    "#1c3b3b",
    "#6f8291",
  ),
  // Stone stained by old iron.
  rust: ramp(
    [
      "#120806",
      "#1e0f0b",
      "#2e1811",
      "#402219",
      "#573123",
      "#794734",
      "#a0644c",
      "#c58e73",
      "#e8c8b4",
    ],
    "#40301a",
    "#a0442e",
  ),
  // Pale marble in violet shade.
  marble: ramp(
    [
      "#0b0a12",
      "#14131f",
      "#1e1c2e",
      "#2b293f",
      "#3d3a55",
      "#585373",
      "#7e7999",
      "#aca7c3",
      "#dfdcec",
    ],
    "#2c2852",
    "#aca7c3",
  ),
  // Green with age, like old bronze.
  bronze: ramp(
    [
      "#070f0e",
      "#0f1b19",
      "#172725",
      "#203632",
      "#2e4c46",
      "#436a61",
      "#628d82",
      "#90b5aa",
      "#d0e4dc",
    ],
    "#b08d57",
    "#b08d57",
  ),
  // The end of it.
  gold: ramp(
    [
      "#2a1c06",
      "#44300a",
      "#654710",
      "#8a6216",
      "#ad7f1f",
      "#cda02f",
      "#e4bf50",
      "#f2d67f",
      "#fdf1bf",
    ],
    "#fff6d0",
    "#fff6d0",
  ),
};

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

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const rgb = (ink: string) =>
  [1, 3, 5].map((i) => parseInt(ink.slice(i, i + 2), 16)) as [number, number, number];

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

/** One frame of the dinosaur: `step` is the walk's place (0-3), `blink` covers the eye. */
export function dinoFrame(step: number, blink: boolean, flip: boolean) {
  return kept(`dino:${step}:${blink}:${flip}`, () => {
    const { canvas, ctx } = makeCanvas(DINO_W, DINO_H);
    const rows = [...DINO_PIXELS.slice(0, 18), ...LEGS[step]!];
    const cell = (x: number, y: number, ink: string) => {
      ctx.fillStyle = ink;
      ctx.fillRect(flip ? DINO_W - 1 - x : x, y + DINO_TOP, 1, 1);
    };
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch !== "#") return;
        cell(x, y, DINO_ARM.some(([ax, ay]) => ax === x && ay === y) ? C.mint : C.green);
      }),
    );
    if (blink) cell(DINO_EYE.x, DINO_EYE.y, C.green);
    HAT.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch !== ".") cell(HAT_X + x, HAT_Y + y, ch === "g" ? C.deep : "#d9d5c8");
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

const stoneInks = (t: Theme): Inks => ({
  "#": t.s6,
  "+": t.s7,
  "-": t.s4,
  "=": t.s5,
  w: t.s8,
  g: t.frieze,
  m: t.moss,
});

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
function columnPicture(t: Theme, shaft: number, broken = 0) {
  const W = 15;
  const { canvas, ctx } = makeCanvas(W, shaft + 8);
  const r = rng(shaft * 31 + broken);
  const flutes = [t.s5, t.s7, t.s6, t.s7, t.s6, t.s6, t.s5, t.s4, t.s4];
  if (!broken) {
    fill(ctx, t.s7, 0, 0, W, 2);
    fill(ctx, t.s5, 0, 2, W, 1);
    fill(ctx, t.s6, 1, 3, W - 2, 1);
    fill(ctx, t.s4, 2, 4, W - 4, 1);
  }
  flutes.forEach((ink, i) => {
    const top = broken ? 2 + Math.floor(r() * 6) : 5;
    fill(ctx, ink, 3 + i, top, 1, shaft + 3 - top);
  });
  for (let i = 0; i < 5; i += 1) {
    fill(ctx, t.s3, 3 + Math.floor(r() * 9), 6 + Math.floor(r() * shaft * 0.8), 1, 2);
  }
  fill(ctx, t.s6, 1, shaft + 3, W - 2, 2);
  fill(ctx, t.s4, 0, shaft + 5, W, 3);
  fill(ctx, t.s5, 0, shaft + 5, W, 1);
  return canvas;
}

/** A dinosaur in stone on a plinth: every dinosaur in the tomb is the same T-rex. */
function statuePicture(t: Theme, flip: boolean) {
  const W = 24;
  const H = 32;
  const { canvas, ctx } = makeCanvas(W, H);
  DINO_PIXELS.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== "#") return;
      const light = x + y < 18 ? t.s7 : x + y < 28 ? t.s6 : t.s5;
      fill(ctx, (x * 7 + y * 13) % 11 === 0 ? t.s4 : light, flip ? W - 3 - x : x + 2, y + 1, 1, 1);
    }),
  );
  fill(ctx, t.s7, 0, 23, W, 2);
  fill(ctx, t.s5, 1, 25, W - 2, 5);
  fill(ctx, t.s4, 1, 28, W - 2, 2);
  fill(ctx, t.s3, 0, 30, W, 2);
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

/**
 * The stone box of the Crypt, seen from above and a little in front. Each carries a riddle on its
 * lid; answered, the lid slides aside onto the dark inside and a green stone.
 */
export function sarcophagusPicture(t: Theme, open: boolean) {
  return kept(`sarcophagus:${t.s5}:${open}`, () => {
    const W = 44;
    const H = 34;
    const { canvas, ctx } = makeCanvas(W + 26, H);
    const top = 4;
    fill(ctx, t.s4, 0, top + 2, W, H - top - 2);
    fill(ctx, t.s3, 0, top + 18, W, 1);
    // The front, in the Greek key.
    for (let x = 2; x < W - 4; x += 6) {
      fill(ctx, t.s5, x, top + 21, 4, 1);
      fill(ctx, t.s5, x, top + 21, 1, 5);
      fill(ctx, t.s5, x, top + 25, 5, 1);
      fill(ctx, t.s5, x + 3, top + 23, 1, 2);
    }
    if (open) {
      // The inside, and what was kept in it.
      fill(ctx, t.s5, 1, top, W - 2, 18);
      fill(ctx, C.void, 3, top + 2, W - 6, 14);
      fill(ctx, C.deep, 8, top + 5, 12, 8);
      fill(ctx, C.green, 9, top + 6, 10, 6);
      fill(ctx, C.mint, 10, top + 7, 4, 2);
    }
    // The lid, pushed aside and up a little once it has been answered.
    const lx = open ? 24 : 1;
    const ly = open ? top - 2 : top;
    fill(ctx, t.s6, lx, ly, W - 2, 18);
    fill(ctx, t.s7, lx, ly, W - 2, 1);
    fill(ctx, t.s7, lx, ly, 1, 18);
    if (open) fill(ctx, t.s2, lx, ly + 18, W - 2, 2);
    fill(ctx, t.s5, lx + 3, ly + 3, W - 8, 12);
    fill(ctx, t.s3, lx + 5, ly + 5, W - 12, 8);
    drawGlyphs(ctx, lx + 7, ly + 6, W - 16, 2, open ? t.s5 : t.s7, W);
    return canvas;
  });
}

export function propPicture(prop: Prop, theme: ThemeId) {
  const t = THEMES[theme];
  const key = `prop:${theme}:${prop.kind}:${prop.flip ?? false}:${prop.seed ?? 0}`;
  return kept(key, () => {
    switch (prop.kind) {
      case "column":
        return columnPicture(t, 42);
      case "stump":
        return columnPicture(t, 14, (prop.seed ?? 1) + 1);
      case "amphora":
        return fromRows((prop.seed ?? 0) % 3 === 2 ? AMPHORA_BROKEN : AMPHORA, stoneInks(t));
      case "statue":
        return statuePicture(t, !!prop.flip);
      case "bones":
        return fromRows(BONES, { w: t.s7 });
      case "sarcophagus":
        return sarcophagusPicture(t, false);
      case "coins": {
        const r = rng((prop.seed ?? 1) * 53);
        const { canvas, ctx } = makeCanvas(28, 14);
        for (let row = 0; row < 7; row += 1) {
          const half = 13 - row * 2;
          for (let i = 0; i < 16 - row * 2; i += 1) {
            const x = 14 + Math.round((r() * 2 - 1) * half);
            const y = 12 - row * 2;
            fill(ctx, t.s4, x - 1, y + 1, 3, 1);
            fill(ctx, [t.s6, t.s7, t.s8][Math.floor(r() * 3)]!, x - 1, y, 3, 1);
          }
        }
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
          fill(ctx, [t.s4, t.s5, t.s6][Math.floor(r() * 3)]!, x, y, w, h);
          fill(ctx, t.s7, x, y, w, 1);
          fill(ctx, t.s3, x, y + h - 1, w, 1);
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

export function brazierPicture(big: boolean, theme: ThemeId) {
  return kept(`brazier:${big}:${theme}`, () =>
    fromRows(big ? BRAZIER_BIG : SCONCE, stoneInks(THEMES[theme])),
  );
}

/* ------------------------------------------------------------------ the mask */

export type MaskMouth = { top: number; bottom: number; half: number };

/**
 * A Greek tragic mask in marble, `w` × `h` cells: a crown of curls, a heavy brow, hollow eyes and
 * the mouth given as fractions of its height and half-width. Shaded by a light from the upper left
 * through a dither, so it holds together at the wall's size and at the close-up's.
 */
export function maskPicture(w: number, h: number, mouth: MaskMouth, t: Theme) {
  const { canvas, ctx } = makeCanvas(w, h);
  const shades = [t.s4, t.s5, t.s6, t.s7, t.s8];
  const image = ctx.createImageData(w, h);
  const set = (x: number, y: number, ink: string) => {
    const [r, g, b] = rgb(ink);
    const at = (x + y * w) * 4;
    image.data[at] = r;
    image.data[at + 1] = g;
    image.data[at + 2] = b;
    image.data[at + 3] = 255;
  };
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const u = ((x + 0.5) / w) * 2 - 1;
      const v = (y + 0.5) / h;
      const a = Math.abs(u);
      const taper = 1 - (0.3 * Math.max(0, v - 0.62)) / 0.38;
      const crown = Math.min(1, Math.sqrt(v / 0.14));
      const chin = v > 0.94 ? Math.sqrt(Math.max(0, (1 - v) / 0.06)) : 1;
      const edge = crown * chin * taper;
      if (a > edge) continue;
      // Dark at the outline, for a hard edge against the wall.
      const rim = edge - a < 2.2 / w;
      if (v < 0.17) {
        const curl = Math.sin(u * 16) + Math.sin(v * 70);
        set(x, y, rim ? t.s2 : curl > 0.6 ? t.s6 : curl > -0.4 ? t.s5 : t.s3);
        continue;
      }
      const light = 0.5 - u * 0.34 - (v - 0.5) * 0.28 - a * a * 0.22;
      const band = Math.floor(light * 5 + BAYER[(x % 4) + (y % 4) * 4]! / 16);
      let ink = shades[Math.max(0, Math.min(4, band))]!;
      // The brow, falling away from the middle: the tragic slant.
      const brow = 0.235 + a * 0.075;
      if (Math.abs(v - brow) < 0.017 && a > 0.06 && a < 0.8) ink = t.s3;
      else if (Math.abs(v - brow - 0.028) < 0.012 && a > 0.1 && a < 0.74) ink = t.s7;
      // Hollow eyes.
      const ex = (a - 0.4) / 0.21;
      const ey = (v - (0.3 + a * 0.05)) / 0.042;
      if (ex * ex + ey * ey < 1) ink = "#050507";
      // The nose, a shadow down its right.
      if (v > 0.26 && v < mouth.top - 0.015) {
        const nose = 0.04 + (v - 0.26) * 0.28;
        if (u > 0 && u < nose) ink = t.s4;
        else if (u <= 0 && u > -nose) ink = t.s7;
      }
      // The mouth, lips round it.
      const mv = (v - mouth.top) / (mouth.bottom - mouth.top);
      if (mv > -0.08 && mv < 1.08) {
        const narrow = 1 - 0.18 * Math.abs(mv * 2 - 1) ** 3;
        const m = a / (mouth.half * narrow);
        if (mv > 0 && mv < 1 && m < 1) ink = "#050507";
        else if (m < 1.1) ink = mv < 0.5 ? t.s3 : t.s4;
      }
      set(x, y, rim ? t.s2 : ink);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/* ------------------------------------------------------------------ the gears */

export type GearInks = { rim: string; face: string; shade: string; dark: string };

export const BRONZE: GearInks = {
  rim: "#d2aa6a",
  face: "#a57e45",
  shade: "#6d5029",
  dark: "#2b2014",
};
export const PATINA: GearInks = {
  rim: "#6fe3ad",
  face: "#2ea275",
  shade: "#1a6b4c",
  dark: "#0a2a20",
};

/**
 * A toothed wheel with spokes and a hub left empty, turned to `angle`, into `size` × `size` cells.
 * Worked out per cell at each angle instead of rotating a picture, so it stays on its grid.
 */
export function paintGear(
  ctx: CanvasRenderingContext2D,
  size: number,
  angle: number,
  teeth: number,
  inks: GearInks,
  hub = 0.3,
) {
  const image = ctx.createImageData(size, size);
  const rim = rgb(inks.rim);
  const face = rgb(inks.face);
  const shade = rgb(inks.shade);
  const dark = rgb(inks.dark);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x - c) / c;
      const dy = (y - c) / c;
      const r = Math.hypot(dx, dy);
      const th = Math.atan2(dy, dx);
      const toothed = Math.cos(teeth * (th - angle)) > -0.1;
      const outer = toothed ? 1 : 0.84;
      if (r > outer || r < hub) continue;
      let ink = face;
      if (r > 0.78) ink = toothed && r > 0.84 ? face : rim;
      else if (r > 0.7) ink = shade;
      else if (r < hub + 0.1) ink = rim;
      else if (r > hub + 0.14 && r < 0.66 && Math.cos(5 * (th - angle)) < -0.1) ink = dark;
      // Lit from the upper left, through a dither.
      const lit = -dx * 0.7 - dy * 0.7 + BAYER[(x % 4) + (y % 4) * 4]! / 40;
      if (ink === face && lit < -0.35) ink = shade;
      if (ink === face && lit > 0.5) ink = rim;
      const at = (x + y * size) * 4;
      image.data[at] = ink[0];
      image.data[at + 1] = ink[1];
      image.data[at + 2] = ink[2];
      image.data[at + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** A small gear at one of sixteen steps of a tooth, kept: the Mechanism's wheels in the room. */
export function gearPicture(size: number, teeth: number, step: number, inks: GearInks) {
  return kept(`gear:${size}:${teeth}:${step}:${inks.rim}`, () => {
    const { canvas, ctx } = makeCanvas(size, size);
    paintGear(ctx, size, ((step / 16) * Math.PI * 2) / teeth, teeth, inks, 0.22);
    return canvas;
  });
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
    ? { core: "#ffd9d0", mid: C.red, edge: "#8c2020" }
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
    fill(ctx, ink.edge, x - width, y, width * 2 + 1, 1);
    if (width > 1) fill(ctx, ink.mid, x - width + 1, y, width * 2 - 1, 1);
    if (width > 2 && u < 0.55) fill(ctx, ink.core, x - width + 3, y, Math.max(1, width * 2 - 5), 1);
  }
}

/* ------------------------------------------------------------------ light */

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

/** The same pool in a colour, added over the room so light tints what it touches. */
export function tintPicture(radius: number, ink: string) {
  return kept(`tint:${radius}:${ink}`, () => {
    const { canvas, ctx } = makeCanvas(radius * 2, radius * 2);
    ctx.drawImage(lightPicture(radius), 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = ink;
    ctx.fillRect(0, 0, radius * 2, radius * 2);
    return canvas;
  });
}

/* ------------------------------------------------------------------ rooms */

/** Half a north door's opening. */
const DOOR = 16;

/** Everything after this is drawn only where the room has floor. */
function clipToFloor(ctx: CanvasRenderingContext2D, room: Room) {
  ctx.beginPath();
  for (let r = 0; r < room.rows; r += 1) {
    for (let c = 0; c < room.cols; c += 1) {
      if (room.grid[c + r * room.cols]) ctx.rect(c * CELL, r * CELL, CELL, CELL);
    }
  }
  ctx.clip();
}

/** Flagstones over the whole floor, each a little different, some cracked or mossy. */
function paintFloor(ctx: CanvasRenderingContext2D, room: Room, t: Theme, r: () => number) {
  const shades = [t.s2, t.s2, t.s2, t.s3, t.s1];
  const gold = room.theme === "gold";
  for (let row = 0, y = 0; y < room.H; row += 1, y += TILE) {
    let x = row % 2 ? -TILE : 0;
    while (x < room.W) {
      const w = TILE * (r() < 0.45 && !gold ? 2 : 1);
      const shade = gold
        ? (Math.round(x / TILE) + row) & 1
          ? t.s3
          : t.s4
        : shades[Math.floor(r() * shades.length)]!;
      fill(ctx, shade, x, y, w, TILE);
      fill(ctx, gold ? t.s2 : t.s0, x, y + TILE - 1, w, 1);
      fill(ctx, gold ? t.s2 : t.s0, x + w - 1, y, 1, TILE);
      fill(ctx, gold ? t.s6 : t.s3, x, y, w - 1, 1);
      if (!gold) {
        for (let i = 0; i < 5; i += 1) {
          fill(
            ctx,
            r() < 0.5 ? t.s1 : t.s3,
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
            fill(ctx, t.s0, cx, cy, 1, 1);
            cy += 1;
            cx += Math.floor(r() * 3) - 1;
          }
        }
        if (r() < 0.07) {
          const mx = x + 1 + Math.floor(r() * (w - 6));
          const my = y + 9 + Math.floor(r() * 4);
          for (let i = 0; i < 7; i += 1) {
            fill(ctx, t.moss, mx + Math.floor(r() * 5), my + Math.floor(r() * 3), 1, 1);
          }
        }
      }
      x += w;
    }
  }
}

/** The first room's floor: a Greek mosaic, a sun in a ring of the key, where they land. */
function paintMosaic(ctx: CanvasRenderingContext2D, t: Theme) {
  const cx = 192;
  const cy = 152;
  for (let y = -52; y < 52; y += 2) {
    for (let x = -72; x < 72; x += 2) {
      const d = Math.hypot(x / 70, y / 50);
      if (d > 1) continue;
      const a = Math.atan2(y / 50, x / 70);
      let ink: string;
      if (d > 0.93) ink = t.s6;
      else if (d > 0.74) {
        // The key, as blocks round the ring.
        const turn = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 32);
        ink = (turn % 2 === 0) === d > 0.84 ? C.deep : t.s4;
      } else if (d > 0.68) ink = t.s6;
      else if (d > 0.3) {
        const ray = Math.cos(a * 12) > 0;
        ink = ray ? (d < 0.52 ? t.s6 : t.s5) : t.s3;
      } else if (d > 0.24) ink = t.s7;
      else ink = C.deep;
      fill(ctx, ink, cx + x, cy + y, 2, 2);
    }
  }
}

/** The Mask's floor: the tiers of a theatre, rising away from the stage. */
function paintTiers(ctx: CanvasRenderingContext2D, t: Theme) {
  for (let y = 80; y < 192; y += 2) {
    for (let x = 0; x < 384; x += 2) {
      const d = Math.hypot((x - 192) / 176, (y - 192) / 112);
      if (d > 1) continue;
      if (d < 0.28) {
        if (d > 0.26) fill(ctx, t.s6, x, y, 2, 2);
        continue;
      }
      const ring = d * 6;
      const line = ring - Math.floor(ring);
      if (line < 0.09) fill(ctx, t.s0, x, y, 2, 2);
      else if (line < 0.17) fill(ctx, t.s5, x, y, 2, 2);
      else if (Math.floor(ring) % 2) fill(ctx, "rgba(0,0,0,0.22)", x, y, 2, 2);
    }
  }
}

/** The Sanctum's floor: a gold sun under the altar. */
function paintSanctumFloor(ctx: CanvasRenderingContext2D, t: Theme) {
  for (let y = -44; y < 44; y += 2) {
    for (let x = -66; x < 66; x += 2) {
      const d = Math.hypot(x / 66, y / 44);
      if (d > 1) continue;
      const a = Math.atan2(y / 44, x / 66);
      fill(ctx, Math.cos(a * 10) > 0 ? t.s5 : t.s4, 160 + x, 116 + y, 2, 2);
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

/** One long strip of wall: a cornice, the key, courses of stones, a plinth at its foot. */
function wallStrip(room: Room, t: Theme, r: () => number) {
  const W = room.W;
  const H = room.wall * TILE;
  const { canvas, ctx } = makeCanvas(W, H);
  fill(ctx, t.s1, 0, 0, W, H);
  const shades = [t.s3, t.s3, t.s4, t.s3, t.s2];
  const COURSE = 10;
  for (let row = 0, y = 12; y < H - 4; row += 1, y += COURSE) {
    let x = row % 2 ? -12 : 0;
    while (x < W) {
      const w = 18 + Math.floor(r() * 14);
      const h = Math.min(COURSE, H - 4 - y);
      fill(ctx, shades[Math.floor(r() * shades.length)]!, x, y, w, h);
      fill(ctx, t.s0, x, y + h - 1, w, 1);
      fill(ctx, t.s0, x + w - 1, y, 1, h);
      fill(ctx, t.s5, x, y, w - 1, 1);
      if (r() < 0.35) fill(ctx, t.s2, x + 2 + Math.floor(r() * (w - 6)), y + 3, 3, 1);
      if (room.theme === "rust" && r() < 0.3) {
        // Rust runs down from the joints.
        fill(ctx, t.s5, x + Math.floor(r() * w), y, 1, 4 + Math.floor(r() * (h + 8)));
      } else if (room.theme !== "gold" && r() < 0.16) {
        const vx = x + Math.floor(r() * w);
        const len = 6 + Math.floor(r() * 18);
        for (let i = 0; i < len; i += 1) {
          fill(ctx, i % 3 ? t.moss : t.frieze, vx + (i % 5 === 4 ? 1 : 0), y + i, 1, 1);
        }
      }
      x += w;
    }
  }
  fill(ctx, t.s0, 0, 0, W, 2);
  fill(ctx, t.s6, 0, 2, W, 1);
  fill(ctx, t.s4, 0, 3, W, 2);
  fill(ctx, t.s1, 0, 5, W, 7);
  paintKey(ctx, 5, W, t.frieze);
  fill(ctx, t.s5, 0, 11, W, 1);
  fill(ctx, t.s4, 0, H - 4, W, 4);
  fill(ctx, t.s6, 0, H - 4, W, 1);
  fill(ctx, t.s2, 0, H - 1, W, 1);
  return canvas;
}

const cellOf = (room: Room, c: number, row: number) =>
  c < 0 || row < 0 || c >= room.cols || row >= room.rows ? 0 : room.grid[c + row * room.cols]!;

/** Walls: wherever floor has rock north of it, a strip of wall stands, so round rooms curve. */
function paintWalls(ctx: CanvasRenderingContext2D, room: Room, t: Theme, r: () => number) {
  const strip = wallStrip(room, t, r);
  const H = strip.height;
  for (let c = 0; c < room.cols; c += 1) {
    for (let row = 0; row < room.rows; row += 1) {
      if (cellOf(room, c, row) !== 1 || cellOf(room, c, row - 1) === 1) continue;
      ctx.drawImage(strip, c * CELL, 0, CELL, H, c * CELL, row * CELL - H, CELL, H);
    }
  }
  // Where the wall steps, its returning edge.
  for (let c = 0; c < room.cols - 1; c += 1) {
    const here = room.floorTop(c * CELL);
    const next = room.floorTop((c + 1) * CELL);
    if (here === next || here >= room.H || next >= room.H) continue;
    const low = Math.max(here, next);
    const high = Math.min(here, next);
    fill(ctx, t.s0, (c + 1) * CELL - (here > next ? 1 : 0), low - H, 1, low - high);
  }
}

/** The dark under each wall and along each side: dithered, whole cells. */
function paintShade(ctx: CanvasRenderingContext2D, room: Room) {
  ctx.fillStyle = room.theme === "gold" ? "rgba(40,24,4,0.55)" : "#050505";
  for (let row = 0; row < room.rows; row += 1) {
    for (let c = 0; c < room.cols; c += 1) {
      const v = cellOf(room, c, row);
      if (!v) continue;
      const x = c * CELL;
      const y = row * CELL;
      if (v === 1 && cellOf(room, c, row - 1) !== 1) {
        for (let dy = 0; dy < 12; dy += 1) {
          const every = dy < 3 ? 1 : dy < 6 ? 2 : dy < 9 ? 3 : 5;
          for (let dx = 0; dx < CELL; dx += 1) {
            if ((x + dx + dy) % every === 0) ctx.fillRect(x + dx, y + dy, 1, 1);
          }
        }
      }
      for (const [side, nx] of [
        [-1, 0],
        [1, CELL - 1],
      ] as const) {
        if (cellOf(room, c + side, row)) continue;
        for (let d = 0; d < 6; d += 1) {
          const every = d < 2 ? 1 : d < 4 ? 2 : 3;
          for (let dy = 0; dy < CELL; dy += 1) {
            if ((y + dy + d) % every === 0) ctx.fillRect(x + nx - side * d, y + dy, 1, 1);
          }
        }
      }
    }
  }
}

/** The rock around a room, a little way out, then nothing: rooms have silhouettes. */
function paintRock(ctx: CanvasRenderingContext2D, room: Room, t: Theme) {
  const near = (c: number, r: number) => {
    for (let dr = -2; dr <= 2; dr += 1) {
      for (let dc = -2; dc <= 2; dc += 1) {
        if (cellOf(room, c + dc, r + dr)) return true;
      }
    }
    return false;
  };
  for (let r = 0; r < room.rows; r += 1) {
    for (let c = 0; c < room.cols; c += 1) {
      if (cellOf(room, c, r) || !near(c, r)) continue;
      fill(ctx, (c + r) % 2 ? t.s1 : t.s0, c * CELL, r * CELL, CELL, CELL);
    }
  }
}

/** Where floor meets rock, the edge catches the light. */
function paintEdges(ctx: CanvasRenderingContext2D, room: Room, t: Theme) {
  for (let row = 0; row < room.rows; row += 1) {
    for (let c = 0; c < room.cols; c += 1) {
      const v = cellOf(room, c, row);
      if (!v) continue;
      const x = c * CELL;
      const y = row * CELL;
      if (c > 0 && !cellOf(room, c - 1, row)) fill(ctx, t.s5, x - 2, y, 2, CELL);
      if (c < room.cols - 1 && !cellOf(room, c + 1, row)) fill(ctx, t.s5, x + CELL, y, 2, CELL);
      if (row < room.rows - 1 && !cellOf(room, c, row + 1)) fill(ctx, t.s5, x, y + CELL, CELL, 2);
      if (v === 2 && row > 0 && !cellOf(room, c, row - 1)) fill(ctx, t.s5, x, y - 2, CELL, 2);
    }
  }
}

/** An arch in the wall for a door north: dark inside, a stone frame and a keystone. */
function paintNorthDoor(ctx: CanvasRenderingContext2D, room: Room, t: Theme) {
  const n = room.doors.n;
  if (!n || room.id === "hall") return;
  const foot = room.floorTop(n.at);
  const x = n.at - DOOR;
  const W = DOOR * 2;
  const top = foot - room.wall * TILE + 14;
  fill(ctx, C.void, x, top, W, foot - top);
  fill(ctx, t.s1, x + 2, foot - 6, W - 4, 6);
  fill(ctx, t.s6, x - 4, top - 2, 4, foot - top + 2);
  fill(ctx, t.s6, x + W, top - 2, 4, foot - top + 2);
  fill(ctx, t.s7, x - 4, top - 2, 1, foot - top + 2);
  fill(ctx, t.s7, x + W, top - 2, 1, foot - top + 2);
  fill(ctx, t.s6, x - 4, top - 4, W + 8, 4);
  fill(ctx, t.s7, x - 4, top - 4, W + 8, 1);
  fill(ctx, t.s7, n.at - 4, top - 6, 8, 7);
  fill(ctx, t.frieze, n.at - 2, top - 4, 4, 3);
  fill(ctx, t.s4, x, foot, W, 3);
}

/** Pits: the far side going down into the dark, a lit lip, and green still burning far below. */
function paintPits(ctx: CanvasRenderingContext2D, room: Room, t: Theme, r: () => number) {
  if (!room.floor) return;
  const at = (col: number, row: number) => room.floor![row]?.[col] ?? ".";
  room.floor.forEach((rowText, row) =>
    [...rowText].forEach((ch, col) => {
      if (ch === ".") return;
      const x = col * TILE;
      const y = row * TILE;
      fill(ctx, C.void, x, y, TILE, TILE);
      for (let i = 0; i < 14; i += 1) {
        fill(ctx, "#08160e", x + Math.floor(r() * TILE), y + Math.floor(r() * TILE), 2, 2);
      }
      if (at(col, row - 1) === ".") {
        [t.s4, t.s3, t.s2, t.s1, t.s0].forEach((ink, band) => {
          fill(ctx, ink, x, y + band * 3, TILE, 2);
          fill(ctx, C.void, x + ((band * 7 + col * 5) % TILE), y + band * 3, 1, 2);
        });
        fill(ctx, t.s6, x, y, TILE, 1);
      }
      if (at(col - 1, row) === ".") {
        fill(ctx, t.s5, x, y, 1, TILE);
        fill(ctx, t.s2, x + 1, y, 2, TILE);
      }
      if (at(col + 1, row) === ".") {
        fill(ctx, t.s5, x + TILE - 1, y, 1, TILE);
        fill(ctx, t.s2, x + TILE - 3, y, 2, TILE);
      }
      if (at(col, row + 1) === ".") fill(ctx, t.s5, x, y + TILE - 1, TILE, 1);
      if (ch === "h") {
        for (let i = 0; i < 7; i += 1) {
          fill(ctx, t.s3, x + 1 + Math.floor(r() * 14), y + 1 + Math.floor(r() * 14), 1, 1);
        }
      }
    }),
  );
}

/** One hidden stone once it is known: a plain flagstone. */
export function drawPathStone(ctx: CanvasRenderingContext2D, x: number, y: number, t: Theme) {
  fill(ctx, t.s3, x, y, TILE, TILE);
  fill(ctx, t.s5, x, y, TILE, 1);
  fill(ctx, t.s5, x, y, 1, TILE);
  fill(ctx, t.s0, x, y + TILE - 1, TILE, 1);
  fill(ctx, t.s0, x + TILE - 1, y, 1, TILE);
}

/** One tile of the Hall's square, its letter drawn on top by whoever needs one. */
export function drawSquareTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  t: Theme,
) {
  fill(ctx, t.s3, x + 1, y + 1, size - 2, size - 2);
  fill(ctx, t.s4, x + 1, y + 1, size - 2, 1);
  fill(ctx, t.s4, x + 1, y + 1, 1, size - 2);
  fill(ctx, t.s1, x + 1, y + size - 2, size - 2, 1);
  fill(ctx, t.s1, x + size - 2, y + 1, 1, size - 2);
}

function paintSquareBed(
  ctx: CanvasRenderingContext2D,
  t: Theme,
  sq: { x: number; y: number; tile: number },
) {
  const span = sq.tile * 5 + 6;
  fill(ctx, t.s0, sq.x - 3, sq.y - 3, span, span);
  fill(ctx, t.s4, sq.x - 3, sq.y - 3, span, 1);
  fill(ctx, t.s4, sq.x - 3, sq.y - 3, 1, span);
  fill(ctx, t.s3, sq.x + sq.tile * 5 + 2, sq.y - 3, 1, span);
  fill(ctx, t.s3, sq.x - 3, sq.y + sq.tile * 5 + 2, span, 1);
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      drawSquareTile(ctx, sq.x + col * sq.tile, sq.y + row * sq.tile, sq.tile, t);
    }
  }
}

/** Holes in the floor where the spikes live. */
function paintSpikeBeds(ctx: CanvasRenderingContext2D, room: Room, t: Theme) {
  for (const s of room.spikes ?? []) {
    fill(ctx, t.s1, s.x, s.y, s.w, s.h);
    fill(ctx, t.s5, s.x - 1, s.y, 1, s.h);
    fill(ctx, t.s5, s.x + s.w, s.y, 1, s.h);
    for (let y = s.y + 3; y < s.y + s.h; y += 8) {
      for (let x = s.x + 3; x < s.x + s.w; x += 8) fill(ctx, C.void, x, y, 3, 3);
    }
  }
}

/** The room's walls and floor, painted once. */
export function paintRoom(room: Room, square: { x: number; y: number; tile: number }) {
  const t = THEMES[room.theme];
  const { canvas, ctx } = makeCanvas(room.W, room.H);
  const r = rng(room.id.length * 131 + room.title.charCodeAt(4) * 7 + room.w);
  paintRock(ctx, room, t);
  ctx.save();
  clipToFloor(ctx, room);
  paintFloor(ctx, room, t, r);
  if (room.id === "mural") paintMosaic(ctx, t);
  if (room.id === "gate") paintTiers(ctx, t);
  if (room.id === "sanctum") paintSanctumFloor(ctx, t);
  if (room.id === "hall") paintSquareBed(ctx, t, square);
  paintSpikeBeds(ctx, room, t);
  paintPits(ctx, room, t, r);
  ctx.restore();
  paintWalls(ctx, room, t, r);
  paintShade(ctx, room);
  paintEdges(ctx, room, t);
  paintNorthDoor(ctx, room, t);
  return canvas;
}

/** A square of plain stone for the close-ups, as a data URL (crawl.css tiles it). */
export function stoneTexture() {
  const { canvas, ctx } = makeCanvas(96, 96);
  const r = rng(77);
  fill(ctx, "#201f1c", 0, 0, 96, 96);
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

/** The Mechanism's plate: old bronze, gone green in patches. */
export function bronzeTexture() {
  const { canvas, ctx } = makeCanvas(96, 96);
  const r = rng(91);
  fill(ctx, "#2c2115", 0, 0, 96, 96);
  for (let i = 0; i < 900; i += 1) {
    fill(ctx, r() < 0.5 ? "#33271a" : "#261c11", Math.floor(r() * 96), Math.floor(r() * 96), 2, 1);
  }
  for (let blot = 0; blot < 6; blot += 1) {
    const cx = r() * 96;
    const cy = r() * 96;
    const size = 6 + r() * 14;
    for (let i = 0; i < 90; i += 1) {
      const a = r() * 6.28;
      const d = r() * size;
      const x = Math.floor(cx + Math.cos(a) * d + 96) % 96;
      const y = Math.floor(cy + Math.sin(a) * d + 96) % 96;
      fill(ctx, r() < 0.5 ? "#1d3a30" : "#223229", x, y, 2, 2);
    }
  }
  return canvas.toDataURL("image/png");
}

/** The close-up's mask, as a data URL: every socket in its crown filled, or it would not speak. */
export function maskCloseUp() {
  const w = 120;
  const canvas = maskPicture(w, 156, { top: 0.4, bottom: 0.97, half: 0.62 }, THEMES.marble);
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < 5; i += 1) {
    const x = w / 2 + (i - 2) * 16 - 5;
    const y = 8 + Math.abs(i - 2) * 2;
    fill(ctx, "#050507", x - 1, y - 1, 12, 12);
    fill(ctx, C.green, x, y, 10, 10);
    fill(ctx, C.mint, x + 1, y + 1, 4, 3);
  }
  return canvas.toDataURL("image/png");
}
