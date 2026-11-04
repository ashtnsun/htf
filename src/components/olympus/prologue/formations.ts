import { DINO_PIXELS } from "@/components/brand/dino-pixels";
import { FX, type Dot, type Grid, type Span } from "@/components/olympus/prologue/stage";

/**
 * The Prologue's pictures, as lists of cells for the stage (stage.ts). Pure functions of the
 * grid: the same maps and rules as the rest of the family reveal's pixel art (solid cells, white
 * objects, green accents, details carved as empty cells). The temple is the one families see on
 * /olympus, so the room recognises it when they get there.
 */

const WHITE = "#f5f5f5";
const LIGHT = "#a3a3a3";
const STONE = "#5a5a5a";
const ROCK = "#2c2c2c";
const SHADOW = "#1c1c1c";
const GREEN = "#03c652";
const DEEP = "#277d4a";
const MINT = "#00eb88";

/** mulberry32: seeded, so a scene is the same after a resize or a step back. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A string map as cells: `#` in `ink`, each block `scale` × `scale` cells. */
function blit(
  rows: readonly string[],
  x0: number,
  y0: number,
  ink: string | ((ch: string, x: number, y: number) => string | null),
  {
    scale = 1,
    mirror = false,
    extra = {},
  }: { scale?: number; mirror?: boolean; extra?: Partial<Dot> } = {},
) {
  const dots: Dot[] = [];
  const width = Math.max(...rows.map((r) => r.length));
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "." || ch === " ") return;
      const color = typeof ink === "string" ? ink : ink(ch, x, y);
      if (!color) return;
      const cx = mirror ? width - 1 - x : x;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          dots.push({ x: x0 + cx * scale + sx, y: y0 + y * scale + sy, ink: color, ...extra });
        }
      }
    });
  });
  return dots;
}

function rect(x: number, y: number, w: number, h: number, ink: string, extra: Partial<Dot> = {}) {
  const dots: Dot[] = [];
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) dots.push({ x: x + dx, y: y + dy, ink, ...extra });
  }
  return dots;
}

function outline(x: number, y: number, w: number, h: number, ink: string, weight = 1) {
  return [
    ...rect(x, y, w, weight, ink),
    ...rect(x, y + h - weight, w, weight, ink),
    ...rect(x, y + weight, weight, h - weight * 2, ink),
    ...rect(x + w - weight, y + weight, weight, h - weight * 2, ink),
  ];
}

// ---------------------------------------------------------------- the flame

/**
 * The great flame: three hand-drawn frames in the same language as the fires on /olympus
 * (journey/Torches) and about the T-rex's level of detail. A teardrop that bulges, pinches and sits
 * inside the bowl: `+` deep green at the skin, `#` green, `o` mint at the heart.
 */
const FLAME = [
  [
    ".......+.......",
    ".......++......",
    "......+#+......",
    "......+##+.....",
    ".....+###+.....",
    ".....+####+....",
    "....+#####+....",
    "....+##o###+...",
    "...+###oo##+...",
    "...+##ooo###+..",
    "..+###ooo###+..",
    "..+##ooooo##+..",
    "..+##ooooo##+..",
    "..+###ooo###+..",
    "...+##ooo##+...",
    "...+#######+...",
  ],
  [
    ".........+.....",
    "........++.....",
    ".......+#+.....",
    ".......+##+....",
    "......+###+....",
    ".....+####+....",
    ".....+####+....",
    "....+##o###+...",
    "....+#ooo##+...",
    "...+##ooo###+..",
    "...+##oooo##+..",
    "..+##ooooo##+..",
    "..+##ooooo##+..",
    "..+###ooo###+..",
    "...+##ooo##+...",
    "...+#######+...",
  ],
  [
    ".....+.........",
    ".....++........",
    ".....+#+.......",
    "....+##+.....+.",
    "....+###+...++.",
    ".....+###+.+#+.",
    ".....+####+##+.",
    "....+##o#####+.",
    "...+###oo###+..",
    "...+##ooo###+..",
    "..+###ooo###+..",
    "..+##ooooo##+..",
    "..+##ooooo##+..",
    "..+###ooo###+..",
    "...+##ooo##+...",
    "...+#######+...",
  ],
];

/** The small flame on the summit's braziers: the fires' own frames from /olympus. */
const SMALL_FLAME = [
  ["....#....", "...+#....", "...##+...", "..+###...", "..####+..", ".+#####+.", ".#######."],
  ["....#....", "....#+...", "...+##...", "...###+..", "..+####..", ".+#####+.", ".#######."],
  ["...#.....", "...#+....", "..+##.#..", "..####+..", "..+####..", ".+#####+.", ".#######."],
];

/** A flame's frames as cells, centred on `cx`, its last row on `baseY`; the stage steps them. */
function flame(
  frames: readonly (readonly string[])[],
  cx: number,
  baseY: number,
  scale: number,
  extra: Partial<Dot> = {},
) {
  const rows = frames[0]!;
  const x = cx - Math.floor((rows[0]!.length * scale) / 2);
  const y = baseY - rows.length * scale + 1;
  return frames.flatMap((frame, group) =>
    blit(frame, x, y, (ch) => (ch === "+" ? DEEP : ch === "o" ? MINT : GREEN), {
      scale,
      extra: { ...extra, fx: FX.FRAME, group },
    }),
  );
}

/** The brazier, as flat white as the temple: a bowl, a stem and a foot. */
const BRAZIER = [
  "###############",
  ".#############.",
  "..###########..",
  "....#######....",
  "......###......",
  "......###......",
  "......###......",
  ".....#####.....",
  "...#########...",
];

function brazier(cx: number, top: number, scale: number) {
  const x = cx - Math.floor((BRAZIER[0]!.length * scale) / 2);
  return blit(BRAZIER, x, top, WHITE, { scale });
}

/** Standby: the fire in the dark. */
export function ember(g: Grid) {
  const scale = 4;
  const cx = Math.floor(g.cols / 2);
  const height = (FLAME[0]!.length + BRAZIER.length) * scale;
  const bowl = Math.floor((g.rows - height) / 2) + FLAME[0]!.length * scale;
  return [...brazier(cx, bowl, scale), ...flame(FLAME, cx, bowl - 1, scale)];
}

// ---------------------------------------------------------------- the temple

const COLUMN = [
  "###########",
  ".#########.",
  "..#######..",
  ...Array.from({ length: 18 }, () => "..##.#.##.."),
  ".#########.",
  "###########",
];
const KEY = ["#####.", "#...#.", "#.#.#.", "#.###.", "#.....", "######"];
const COLUMNS = 9;
const COL_W = COLUMN[0]!.length;
const GAP = 2;
const MARGIN = 2;

/** Pixel numerals for the columns (I, V, X are all /olympus needs). */
const GLYPH: Record<string, string[]> = {
  I: ["#", "#", "#", "#", "#"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
};
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

/** A pixel numeral centred on column `cx`, its top on row `y`. */
function numeral(
  text: string,
  cx: number,
  y: number,
  ink: string,
  { scale = 1, extra = {} }: { scale?: number; extra?: Partial<Dot> } = {},
) {
  const glyphs = [...text];
  const width = glyphs.reduce((sum, ch) => sum + GLYPH[ch]![0]!.length + 1, -1) * scale;
  let x = cx - Math.floor(width / 2);
  const dots: Dot[] = [];
  for (const ch of glyphs) {
    dots.push(...blit(GLYPH[ch]!, x, y, ink, { scale, extra }));
    x += (GLYPH[ch]![0]!.length + 1) * scale;
  }
  return dots;
}

/**
 * The /olympus temple: the same column, Greek key and pediment as olympus/Temple. `sweep` lights
 * the columns green in turn (nothing singled out: each group's column gets the same).
 */
export function temple(g: Grid, { sweep = false, top }: { sweep?: boolean; top?: number } = {}) {
  const W = MARGIN * 2 + COLUMNS * COL_W + (COLUMNS - 1) * GAP;
  const x0 = Math.floor((g.cols - W) / 2);
  const y0 = top ?? 16;
  const cx = (W - 1) / 2;
  const PED = Math.round(W / 8);
  const dots: Dot[] = [];
  let prev = 0;
  for (let y = 0; y < PED; y += 1) {
    const half = Math.round(((y + 1) / PED) * (W / 2));
    for (let x = Math.ceil(cx - half); x <= Math.floor(cx + half); x += 1) {
      const edge = Math.abs(x - cx) > prev - 1 || y === 0;
      dots.push({ x: x0 + x, y: y0 + y, ink: edge ? WHITE : SHADOW });
    }
    prev = half;
  }
  const cornice = y0 + PED;
  const frieze = cornice + 3;
  const architrave = frieze + KEY.length + 1;
  const shaftTop = architrave + 2;
  const stepTop = shaftTop + COLUMN.length;
  dots.push(...rect(x0, cornice, W, 2, WHITE));
  for (let i = 0; i * KEY[0]!.length < W; i += 1) {
    dots.push(...blit(KEY, x0 + i * KEY[0]!.length, frieze, DEEP).filter((d) => d.x < x0 + W));
  }
  dots.push(...rect(x0 + 2, architrave, W - 4, 2, WHITE));
  for (let i = 0; i < COLUMNS; i += 1) {
    const cxi = x0 + MARGIN + i * (COL_W + GAP);
    const extra = sweep ? { fx: FX.SWEEP, group: i } : {};
    dots.push(...blit(COLUMN, cxi, shaftTop, WHITE, { extra }));
    // The numeral under the column.
    dots.push(...numeral(NUMERALS[i]!, cxi + Math.floor(COL_W / 2), stepTop + 7, LIGHT, { extra }));
  }
  dots.push(...rect(x0 + 2, stepTop, W - 4, 2, WHITE));
  dots.push(...rect(x0, stepTop + 2, W, 2, WHITE));
  return dots;
}

// ---------------------------------------------------------------- the mountain

/**
 * A cloud: a flat base and a lumpy top, the height of each column the tallest of a few round
 * puffs over it. Solid, its top edge in `rim`, so it reads as a cloud and not as noise.
 */
function cloud(
  rand: () => number,
  x: number,
  base: number,
  w: number,
  body: string,
  rim: string,
  layer: number,
) {
  const puffs = Array.from({ length: 3 + Math.floor(w / 26) }, () => ({
    c: rand() * w,
    r: 8 + rand() * Math.max(6, w / 5),
    h: 3 + rand() * 7,
  }));
  const dots: Dot[] = [];
  for (let dx = 0; dx < w; dx += 1) {
    let top = 0;
    for (const { c, r, h } of puffs) {
      const v = 1 - ((dx - c) / r) ** 2;
      if (v > 0) top = Math.max(top, h * Math.sqrt(v));
    }
    // Rounded off at both ends, so no puff is cut into a cliff.
    const height = Math.round(top * Math.min(1, Math.min(dx + 1, w - dx) / 7));
    for (let dy = 0; dy < height; dy += 1) {
      dots.push({
        x: x + dx,
        y: base - dy,
        ink: dy === height - 1 ? rim : body,
        layer,
        fx: FX.DRIFT,
      });
    }
  }
  return dots;
}

function sky(g: Grid, seed: number, span = 2) {
  const rand = seeded(seed);
  const dots: Dot[] = [];
  const n = Math.round((g.cols * g.rows * span) / 200);
  for (let i = 0; i < n; i += 1) {
    const bright = rand();
    dots.push({
      x: Math.floor(rand() * g.cols),
      y: Math.floor(rand() * g.rows * span),
      ink: bright > 0.9 ? WHITE : bright > 0.55 ? LIGHT : STONE,
      layer: 0,
      fx: bright > 0.45 ? FX.TWINKLE : FX.STILL,
    });
  }
  return dots;
}

/** How far below the summit the mountain's foot is: the camera starts down there. */
export const CLIMB_FROM = -300;

const SUMMIT = 0.64;
const SHADE = "#161616";
const LIT = "#242424";
const FACET = "#333333";

/**
 * The cold open: a mountain three screens tall with a temple on its summit, clouds behind it and a
 * sea of cloud in front. The rock's mass is flat spans (`rock`, drawn under the cells and never
 * flown); the cells are what catches the light. The stage's camera tilts up it from `CLIMB_FROM`
 * to 0, the near clouds passing fastest. `lit`: the summit after the lightning, the temple green.
 */
export function climb(g: Grid, { lit = false }: { lit?: boolean } = {}) {
  const rand = seeded(11);
  const cx = Math.floor(g.cols / 2);
  const summit = Math.round(g.rows * SUMMIT);
  const foot = summit - CLIMB_FROM + 40;
  const dots: Dot[] = [...sky(g, 5)];

  // Clouds behind the rock.
  for (let i = 0; i < 24; i += 1) {
    const y = (summit - 30 + rand() * (foot - summit + 40)) * 0.72;
    const w = 40 + Math.floor(rand() * 60);
    dots.push(...cloud(rand, Math.floor(rand() * g.cols), Math.floor(y), w, "#191919", ROCK, 1));
  }
  const at = dots.length;

  // The rock: each flank walks out by whole cells, in fits; ridges walk down from the shoulders.
  const spans: Span[] = [];
  let left = 27;
  let right = 27;
  let ridge = 3;
  const ridges = Array.from({ length: 9 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * (10 + i * 6),
    from: 4 + Math.floor(rand() * 40) + i * 8,
  }));
  for (let y = summit; y < foot; y += 1) {
    const wasLeft = left;
    const wasRight = right;
    const down = y - summit;
    if (down > 2) {
      left += rand() < 0.42 ? 2 : 1;
      right += rand() < 0.5 ? 2 : 1;
      if (rand() < 0.06) left += 3 + Math.floor(rand() * 6);
      if (rand() < 0.06) right += 3 + Math.floor(rand() * 6);
    }
    ridge += rand() < 0.5 ? -1 : 1;
    const l = Math.max(-2, cx - left);
    const r = Math.min(g.cols + 2, cx + right);
    const mid = Math.min(r, Math.max(l, cx + ridge));
    spans.push({ x: l, y, w: mid - l, ink: SHADE }, { x: mid, y, w: r - mid, ink: LIT });

    // The skyline, stepping across any jump so the edge never breaks.
    for (let x = cx - left; x <= cx - wasLeft; x += 1) if (x >= 0) dots.push({ x, y, ink: STONE });
    for (let x = cx + wasRight; x <= cx + right; x += 1) {
      if (x < g.cols) dots.push({ x, y, ink: WHITE });
    }

    // The snow: solid to a torn line, bright where it faces the light.
    for (let x = l + 1; x < r; x += 1) {
      const line =
        15 + Math.sin(x * 0.55) * 3 + Math.sin(x * 0.17 + 1) * 5 - Math.abs(x - cx) * 0.09;
      if (down < line) dots.push({ x, y, ink: x > cx + ridge ? WHITE : LIGHT });
      else if (x > mid && (x * 3 + y * 5) % 11 === 0 && rand() < 0.45)
        dots.push({ x, y, ink: FACET });
      else if (x < mid && (x * 5 + y * 3) % 17 === 0 && rand() < 0.4)
        dots.push({ x, y, ink: ROCK });
    }
    if (mid > l && mid < r) dots.push({ x: mid, y, ink: down < 20 ? WHITE : LIGHT });
    for (const line of ridges) {
      if (down <= line.from) continue;
      line.x += (rand() < 0.5 ? -1 : 1) + (line.x > 0 ? 0.5 : -0.5);
      const x = Math.round(cx + line.x);
      if (x > l && x < r) dots.push({ x, y, ink: line.x > ridge ? STONE : ROCK });
    }
  }

  // The temple on the summit: nine columns, a pediment, a brazier either side.
  const stone = lit ? GREEN : WHITE;
  const tw = 47;
  const tx = cx - Math.floor(tw / 2);
  const base = summit;
  dots.push(...rect(tx - 2, base - 2, tw + 4, 2, WHITE));
  for (let c = 0; c < 9; c += 1) dots.push(...rect(tx + 3 + c * 5, base - 14, 3, 12, stone));
  dots.push(...rect(tx, base - 17, tw, 3, WHITE));
  for (let y = 0; y < 8; y += 1) {
    const half = Math.round(((y + 1) / 8) * (tw / 2));
    dots.push(...rect(cx - half, base - 25 + y, half * 2 + 1, 1, y < 2 ? WHITE : SHADOW));
    dots.push(
      ...rect(cx - half, base - 25 + y, 2, 1, WHITE),
      ...rect(cx + half - 1, base - 25 + y, 2, 1, WHITE),
    );
  }
  for (const side of [tx - 9, tx + tw + 7]) {
    dots.push(...rect(side - 1, base - 8, 3, 8, LIGHT));
    dots.push(...rect(side - 3, base - 10, 7, 2, WHITE));
    dots.push(...flame(SMALL_FLAME, side, base - 11, 1));
  }

  // The clouds in front: they cross the lens on the way up...
  for (let i = 0; i < 22; i += 1) {
    // Below the frame at the end of the tilt, on any screen, so they never hide the summit.
    const y = g.rows + 14 + Math.floor(rand() * 400);
    const w = 60 + Math.floor(rand() * 90);
    dots.push(...cloud(rand, Math.floor(rand() * g.cols), y, w, "#2a2a2a", STONE, 3));
  }
  // ...and at the end the summit stands clear of a sea of them.
  const sea = g.rows - 10;
  for (const [row, step, body, rim] of [
    [sea - 8, 44, "#1e1e1e", ROCK],
    [sea, 34, "#2c2c2c", "#6e6e6e"],
  ] as const) {
    for (let x = -30; x < g.cols + 40; x += step) {
      dots.push(...cloud(rand, x, row, step + 34, body, rim, 3));
    }
  }
  return { dots, rock: { spans, at } };
}

/** Where the summit's lightning lands, in cells. */
export function summitPoint(g: Grid) {
  return { x: Math.floor(g.cols / 2), y: Math.round(g.rows * SUMMIT) - 25 };
}

// ---------------------------------------------------------------- the execs' frieze

/** Greek key bands above and below the row of photos. */
export function frieze(g: Grid, upper: number, lower: number) {
  const dots: Dot[] = [];
  for (let i = 0; i * 6 < g.cols; i += 1) {
    dots.push(...blit(KEY, i * 6, upper, DEEP), ...blit(KEY, i * 6, lower, DEEP));
  }
  return dots;
}

// ---------------------------------------------------------------- the chain

/** The trials a family has to solve: mural, riddles, mask, mechanism, seal, fires. */
const TRIALS = 6;

/** Cells to one pixel of the chain's picture, which is the size the fire and its bowl are drawn at. */
const CHAIN_PIXEL = 2;

/** The sizes below, down to where the picture is expanded in `chain`, are in those pixels. */
const LINK_W = 13;
const LINK_H = 12;
const LINK_WALL = 2;
const LINK_GAP = 1;
const CHAIN_SAG = 3;
const EDGE_SHADE = [WHITE, LIGHT, STONE];

/** Whether a pixel is inside a `w` x `h` box with corners of radius `r`. */
function rounded(x: number, y: number, w: number, h: number, r: number) {
  if (x < 0 || y < 0 || x >= w || y >= h) return false;
  const dx = Math.max(r - (x + 0.5), x + 0.5 - (w - r));
  const dy = Math.max(r - (y + 0.5), y + 0.5 - (h - r));
  return dx <= 0 || dy <= 0 || dx * dx + dy * dy <= r * r;
}

/**
 * One great link, face on, an iron bar lit from the upper left. Its lit edge belongs to `group`, so
 * the charge running down the chain (FX.SWEEP) catches the links in turn.
 */
function faceLink(x0: number, y0: number, group: number, order: number) {
  const on = (x: number, y: number) =>
    rounded(x, y, LINK_W, LINK_H, 3) &&
    !rounded(x - LINK_WALL, y - LINK_WALL, LINK_W - LINK_WALL * 2, LINK_H - LINK_WALL * 2, 1);
  const dots: Dot[] = [];
  for (let y = 0; y < LINK_H; y += 1) {
    for (let x = 0; x < LINK_W; x += 1) {
      if (!on(x, y)) continue;
      const lit = !on(x, y - 1) || !on(x - 1, y);
      const ink = lit ? WHITE : !on(x, y + 1) || !on(x + 1, y) ? STONE : LIGHT;
      dots.push({
        x: x0 + x,
        y: y0 + y,
        ink,
        order,
        ...(lit ? { fx: FX.SWEEP, group } : {}),
      });
    }
  }
  return dots;
}

/** The link between two faces, edge on: a capsule whose ends sit inside the holes either side. */
function edgeLink(x0: number, y0: number, w: number, order: number) {
  const dots: Dot[] = [];
  EDGE_SHADE.forEach((ink, dy) => {
    for (let dx = 0; dx < w; dx += 1) {
      if ((dy === 0 || dy === EDGE_SHADE.length - 1) && (dx === 0 || dx === w - 1)) continue;
      dots.push({ x: x0 + dx, y: y0 + dy, ink, order });
    }
  });
  return dots;
}

/**
 * The chain of trials: one great link for each, with nothing to say which comes first, bolted to a
 * column at the left and sagging under its own weight to the fire at the right, which is the
 * Oracle. `order` forges it link by link, left to right. All of it is drawn in pixels of
 * CHAIN_PIXEL cells, so the iron and the fire are one picture. Returns the middle of each link and
 * of the fire's foot in cells, for the sparks.
 */
export function chain(g: Grid) {
  const cols = Math.ceil(g.cols / CHAIN_PIXEL);
  const rows = Math.ceil(g.rows / CHAIN_PIXEL);
  const cy = Math.round(rows * 0.5);
  const width = TRIALS * LINK_W + (TRIALS - 1) * LINK_GAP;
  const x0 = Math.floor(cols / 2) - Math.floor(width / 2) - 3;
  const pitch = LINK_W + LINK_GAP;
  const reach = LINK_WALL + 1;
  const top = (i: number) => {
    const u = ((i + 0.5) / TRIALS) * 2 - 1;
    return cy - LINK_H / 2 + Math.round(CHAIN_SAG * (1 - u * u));
  };

  const columnR = x0 - 4;
  const edges: { x: number; y: number; w: number; order: number }[] = [];
  for (let i = 0; i <= TRIALS; i += 1) {
    const left = i ? x0 + (i - 1) * pitch + LINK_W - reach : columnR + 1;
    const right = i < TRIALS ? x0 + i * pitch + reach : x0 + (TRIALS - 1) * pitch + LINK_W + 5;
    const fromY = i ? top(i - 1) + LINK_H / 2 : cy;
    const toY = i < TRIALS ? top(i) + LINK_H / 2 : cy;
    edges.push({
      x: left,
      y: Math.round((fromY + toY) / 2) - 1,
      w: right - left,
      order: Math.min(i + 1, TRIALS + 1) / (TRIALS + 1),
    });
  }

  const pixels: Dot[] = [];
  // The column at the left and the plate bolted to it.
  for (let i = 0; i < 7; i += 1) {
    const ink = i % 3 === 2 ? ROCK : i < 3 ? LIGHT : STONE;
    pixels.push(...rect(columnR - 7 + i, 0, 1, rows, ink, { order: 0 }));
  }
  pixels.push(...rect(columnR - 1, cy - 4, 3, 9, WHITE, { order: 0 }));
  pixels.push(...rect(columnR, cy - 3, 1, 1, ROCK, { order: 0 }));
  pixels.push(...rect(columnR, cy + 3, 1, 1, ROCK, { order: 0 }));

  const links: { x: number; y: number }[] = [];
  for (let i = 0; i < TRIALS; i += 1) {
    const x = x0 + i * pitch;
    const y = top(i);
    links.push({ x: (x + LINK_W / 2) * CHAIN_PIXEL, y: (y + LINK_H / 2) * CHAIN_PIXEL });
    pixels.push(...faceLink(x, y, i, (i + 1) / (TRIALS + 1)));
  }
  for (const { x, y, w, order } of edges) pixels.push(...edgeLink(x, y, w, order));

  // The bowl on its stand, the end of the chain made fast to it, and the fire.
  const bowlX = x0 + (TRIALS - 1) * pitch + LINK_W + 11;
  const done = { order: 1 };
  pixels.push(...blit(BRAZIER.slice(0, 4), bowlX - 7, cy + 1, WHITE, { extra: done }));
  pixels.push(...rect(bowlX - 1, cy + 5, 3, rows - cy - 5, WHITE, done));
  pixels.push(...flame(FLAME, bowlX, cy, 1, done));

  const dots = pixels.flatMap((pixel) =>
    Array.from({ length: CHAIN_PIXEL * CHAIN_PIXEL }, (_, n) => ({
      ...pixel,
      x: pixel.x * CHAIN_PIXEL + (n % CHAIN_PIXEL),
      y: pixel.y * CHAIN_PIXEL + Math.floor(n / CHAIN_PIXEL),
    })),
  );
  return { dots, links, fire: { x: bowlX * CHAIN_PIXEL, y: cy * CHAIN_PIXEL } };
}

// ---------------------------------------------------------------- the setup

/** Left half of the screen, for the laptop: the type stands on the right. */
function setupCentre(g: Grid) {
  return Math.floor(g.cols * 0.27);
}

export function laptop(g: Grid) {
  const cx = setupCentre(g);
  const cy = Math.floor(g.rows / 2);
  const w = 90;
  const h = 58;
  const x = cx - Math.floor(w / 2);
  const y = cy - Math.floor(h / 2) - 6;
  const dots: Dot[] = [
    ...outline(x, y, w, h, WHITE, 2),
    ...rect(x + 2, y + 2, w - 4, h - 4, SHADOW).filter((d) => (d.x + d.y) % 3 === 0),
    ...blit(DINO_PIXELS, cx - 20, y + 7, GREEN, { scale: 2 }),
    // Hinge, deck, keys.
    ...rect(x - 8, y + h + 1, w + 16, 3, WHITE),
    ...rect(x - 4, y + h + 4, w + 8, 2, LIGHT),
    ...rect(cx - 10, y + h + 1, 20, 1, STONE),
  ];
  return dots;
}

/** An address bar across the screen, for the URL set over it. */
export function browser(g: Grid) {
  const w = Math.min(g.cols - 24, 216);
  const h = 44;
  const x = Math.floor((g.cols - w) / 2);
  const y = Math.floor(g.rows * 0.42);
  return [
    ...outline(x, y, w, h, WHITE, 2),
    ...rect(x + 2, y + 2, w - 4, 7, ROCK),
    ...rect(x + 2, y + 9, w - 4, 1, WHITE),
    ...rect(x + 6, y + 4, 3, 3, GREEN),
    ...rect(x + 12, y + 4, 3, 3, STONE),
    ...rect(x + 18, y + 4, 3, 3, STONE),
  ];
}

// ---------------------------------------------------------------- the Oracle

/** The Oracle's fire, under the line that names it: the same brazier, and the night behind it. */
export function oracleFire(g: Grid) {
  const scale = 3;
  const cx = Math.floor(g.cols / 2);
  const bowl = g.rows - 17 - BRAZIER.length * scale;
  return [
    ...sky(g, 21, 1).map((d) => ({ ...d, layer: 2 })),
    ...brazier(cx, bowl, scale),
    ...flame(FLAME, cx, bowl - 1, scale),
  ];
}
