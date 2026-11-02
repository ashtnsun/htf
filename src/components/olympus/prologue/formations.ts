import { DINO_PIXELS } from "@/components/brand/dino-pixels";
import { REVEAL_SPRITES } from "@/components/dino/reveal";
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

/**
 * The gods, in the order the deck calls them: not the families' order and not the exec board's,
 * so no list on screen lines up with another. Only each god's shape and body colour are drawn;
 * the props in their own colours wait for the real reveal.
 */
export const GODS = [
  "Artemis",
  "Apollo",
  "Hades",
  "Aphrodite",
  "Ares",
  "Poseidon",
  "Hermes",
  "Athena",
  "Zeus",
] as const;

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

/** A god's map cut to the cells it uses, with every inked cell as `#`. */
function godRows(god: string) {
  const sprite = REVEAL_SPRITES[god]!;
  const rows = Array.from({ length: sprite.height }, (_, y) =>
    Array.from({ length: sprite.width }, (_, x) =>
      sprite.cells[y * sprite.width + x] ? "#" : ".",
    ).join(""),
  ).filter((row) => row.includes("#"));
  const left = Math.min(...rows.map((r) => r.indexOf("#")));
  const right = Math.max(...rows.map((r) => r.lastIndexOf("#")));
  return { rows: rows.map((r) => r.slice(left, right + 1)), ink: sprite.palette[0]! };
}

// ---------------------------------------------------------------- the flame

function flame(cx: number, baseY: number, height: number, seed = 1, layer = 2) {
  const rand = seeded(seed);
  const dots: Dot[] = [];
  for (let dy = 0; dy < height; dy += 1) {
    const u = dy / height;
    // Fat near the bowl, licking to a point, swaying as it climbs.
    const half = Math.max(0.5, (height / 3.2) * Math.sin(Math.PI * (0.18 + u * 0.82)) ** 0.8);
    const sway = Math.round(Math.sin(dy * 0.42 + seed) * height * 0.05 * u);
    for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx += 1) {
      if (Math.abs(dx) > half) continue;
      const edge = Math.abs(dx) / half;
      if (u > 0.6 && rand() < (u - 0.5) * 0.7) continue;
      // A white heart that tapers well before the tip, mint round it, green at the skin.
      const ink = edge < 0.42 - u * 0.75 ? WHITE : edge < 0.72 - u * 0.2 ? MINT : GREEN;
      dots.push({
        x: cx + dx + sway,
        y: baseY - dy,
        ink,
        layer,
        fx: edge > 0.6 || u > 0.55 ? FX.FLAME : 0,
      });
    }
  }
  return dots;
}

/** Standby: one small flame alone in the dark. */
export function ember(g: Grid) {
  return flame(Math.floor(g.cols / 2), Math.floor(g.rows / 2) + 5, 11, 3);
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
    const glyphs = [...NUMERALS[i]!];
    const width = glyphs.reduce((sum, ch) => sum + GLYPH[ch]![0]!.length + 1, -1);
    let gx = cxi + Math.floor((COL_W - width) / 2);
    for (const ch of glyphs) {
      dots.push(...blit(GLYPH[ch]!, gx, stepTop + 7, LIGHT, { extra }));
      gx += GLYPH[ch]![0]!.length + 1;
    }
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
    dots.push(...flame(side, base - 11, 11, side));
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

// ---------------------------------------------------------------- the gods

/** One god, huge, for the roll call: shape and body colour. `side` is where it stands. */
export function godSolo(g: Grid, god: string, side: "left" | "right") {
  const { rows, ink } = godRows(god);
  const scale = Math.max(2, Math.floor((g.rows * 0.62) / rows.length));
  const width = rows[0]!.length * scale;
  const x =
    side === "left" ? Math.floor(g.cols * 0.27 - width / 2) : Math.floor(g.cols * 0.73 - width / 2);
  const y = Math.floor((g.rows - rows.length * scale) / 2);
  return blit(rows, x, y, ink, { scale, mirror: side === "right" });
}

/** All nine, in a pediment's shape: one, three, five. */
export function pantheon(g: Grid) {
  const tiers = [GODS.slice(8), GODS.slice(5, 8), GODS.slice(0, 5)];
  const dots: Dot[] = [];
  const pitch = 28;
  const rise = 27;
  const top = Math.floor((g.rows - rise * 3) / 2);
  tiers.forEach((tier, row) => {
    const span = tier.length * pitch;
    tier.forEach((god, i) => {
      const { rows, ink } = godRows(god);
      const x = Math.floor(g.cols / 2 - span / 2 + i * pitch + (pitch - rows[0]!.length) / 2);
      const y = top + row * rise + (rise - 2 - rows.length);
      dots.push(...blit(rows, x, y, ink));
    });
    // The ledge the tier stands on.
    dots.push(
      ...rect(Math.floor(g.cols / 2 - span / 2), top + row * rise + rise - 2, span, 1, STONE),
    );
  });
  return dots;
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

const LINK_FACE = [
  "..##########..",
  ".############.",
  "###........###",
  "##..........##",
  "##..........##",
  "##..........##",
  "##..........##",
  "##..........##",
  "##..........##",
  "##..........##",
  "##..........##",
  "###........###",
  ".############.",
  "..##########..",
];
const LINK_EDGE = ["################", "################", "################", "################"];

/** A chain across the screen, link by link from the left, ending at a green flame. */
export function chain(g: Grid) {
  const cy = Math.round(g.rows * 0.56);
  const end = g.cols - 34;
  const dots: Dot[] = [];
  const links = Math.ceil((end + 24) / 24);
  let x = end - links * 24;
  for (let i = 0; i < links; i += 1, x += 24) {
    const order = Math.max(0, x) / end;
    dots.push(...blit(LINK_EDGE, x + 10, cy - 2, LIGHT, { extra: { order: order * 0.9 } }));
    dots.push(...blit(LINK_FACE, x + 20 - 7, cy - 7, WHITE, { extra: { order: order * 0.9 } }));
  }
  const bowlX = end + 18;
  dots.push(...rect(end + 8, cy - 2, 8, 4, LIGHT).map((d) => ({ ...d, order: 0.95 })));
  dots.push(...rect(bowlX - 6, cy + 2, 13, 2, WHITE).map((d) => ({ ...d, order: 1 })));
  dots.push(...rect(bowlX - 4, cy + 4, 9, 2, WHITE).map((d) => ({ ...d, order: 1 })));
  dots.push(...rect(bowlX - 1, cy + 6, 3, 10, LIGHT).map((d) => ({ ...d, order: 1 })));
  dots.push(...flame(bowlX, cy + 1, 22, 9).map((d) => ({ ...d, order: 1 })));
  return dots;
}

// ---------------------------------------------------------------- the setup

/** Left half of the screen, for the numbered setup scenes: the type stands on the right. */
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

/** Five dinosaurs squeezing into a viewfinder. */
export function family(g: Grid) {
  const cx = setupCentre(g);
  const cy = Math.floor(g.rows / 2);
  const w = 100;
  const h = 60;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const bracket = (bx: number, by: number, dx: number, dy: number) => [
    ...rect(dx > 0 ? bx : bx - 11, by, 12, 2, WHITE),
    ...rect(bx, dy > 0 ? by : by - 10, 2, 12, WHITE),
  ];
  const dots: Dot[] = [
    ...bracket(x, y, 1, 1),
    ...bracket(x + w - 2, y, -1, 1),
    ...bracket(x, y + h - 2, 1, -1),
    ...bracket(x + w - 2, y + h - 2, -1, -1),
  ];
  const stand = [
    { dx: 6, dy: 28, ink: GREEN, mirror: false },
    { dx: 24, dy: 18, ink: MINT, mirror: false },
    { dx: 41, dy: 30, ink: GREEN, mirror: false },
    { dx: 57, dy: 18, ink: MINT, mirror: true },
    { dx: 74, dy: 28, ink: GREEN, mirror: true },
  ];
  for (const { dx, dy, ink, mirror } of stand) {
    dots.push(...blit(DINO_PIXELS, x + dx, y + dy, ink, { mirror }));
  }
  return dots;
}

// ---------------------------------------------------------------- the Oracle

/** The Oracle's fire: a tall tripod and a great green flame in the middle of the screen. */
export function oracleFire(
  g: Grid,
  { big = true, low = false }: { big?: boolean; low?: boolean } = {},
) {
  const cx = Math.floor(g.cols / 2);
  const bowl = low ? g.rows - 22 : Math.round(g.rows * 0.62);
  const height = big ? 54 : 20;
  const legsTo = g.rows;
  const dots: Dot[] = [
    ...sky(g, 21, 1).map((d) => ({ ...d, layer: 2 })),
    ...flame(cx, bowl - 1, height, 4),
    ...rect(cx - 16, bowl, 33, 2, WHITE),
    ...rect(cx - 13, bowl + 2, 27, 2, WHITE),
    ...rect(cx - 9, bowl + 4, 19, 2, LIGHT),
    ...rect(cx - 1, bowl + 6, 3, 12, LIGHT),
  ];
  for (let dy = 0; dy < legsTo - bowl - 18; dy += 1) {
    const out = Math.round(dy * 0.55);
    dots.push(
      { x: cx - out - 1, y: bowl + 18 + dy, ink: STONE },
      { x: cx + out + 1, y: bowl + 18 + dy, ink: STONE },
    );
  }
  return dots;
}

/** The storm that gathers while REVEAL is held in the demonstration: rings, not any god's scene. */
export function storm(g: Grid) {
  const rand = seeded(31);
  const cx = g.cols / 2;
  const cy = g.rows / 2;
  const dots: Dot[] = [];
  for (let r = 16; r < Math.hypot(g.cols, g.rows) / 2; r += 5) {
    const n = Math.round(r * 2.4);
    for (let i = 0; i < n; i += 1) {
      const a = rand() * Math.PI * 2;
      const ink = rand() < 0.14 ? WHITE : rand() < 0.5 ? GREEN : DEEP;
      // The eye of the storm is where the word and the button sit, so they stay readable.
      const dx = (Math.cos(a) * r) / (g.cols * 0.36);
      const dy = (cy + Math.sin(a) * r - g.rows * 0.36) / (g.rows * 0.32);
      if (dx * dx + dy * dy < 1) continue;
      dots.push({
        x: Math.round(cx + Math.cos(a) * r),
        y: Math.round(cy + Math.sin(a) * r),
        ink,
        fx: FX.FLAME,
      });
    }
  }
  return dots;
}

/** The dark god: a huge black shape, its back rim-lit, one green eye. Nobody in particular. */
export function darkGod(g: Grid) {
  const scale = Math.max(2, Math.floor((g.rows * 0.5) / DINO_PIXELS.length));
  const width = DINO_PIXELS[0]!.length * scale;
  const x0 = Math.floor((g.cols - width) / 2);
  const y0 = Math.round(g.rows * 0.15);
  const at = (x: number, y: number) => DINO_PIXELS[y]?.[x] === "#";
  const dots = blit(
    DINO_PIXELS,
    x0,
    y0,
    (_, x, y) => (!at(x, y - 1) ? LIGHT : !at(x + 1, y) ? STONE : ROCK),
    { scale },
  );
  // The carved eye burns.
  DINO_PIXELS.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== "." || y > 4) return;
      if (at(x - 1, y) && at(x + 1, y) && at(x, y - 1) && at(x, y + 1)) {
        dots.push(...rect(x0 + x * scale, y0 + y * scale, scale, scale, GREEN));
      }
    });
  });
  return dots;
}
