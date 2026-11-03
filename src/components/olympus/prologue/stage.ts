/**
 * The Prologue's picture (/prologue): one full-screen canvas of solid cells that never cuts. Every
 * scene is a list of cells (formations.ts), and going to the next scene flies the cells already
 * on screen to their new places, snapped to the grid at every frame, so the whole deck reads as
 * one field of pixels reshaping itself. Nothing is scaled or drawn between cells. The logical
 * picture is 240 × 135 cells, centred; a wider screen just sees more sky.
 *
 * Per-frame state lives here, in typed arrays, not in React.
 */

export const LOGICAL_COLS = 240;
export const LOGICAL_ROWS = 135;

/** A cell's behaviour once it is home. */
export const FX = { STILL: 0, FLAME: 1, TWINKLE: 2, DRIFT: 3, SWEEP: 4, FRAME: 5 } as const;

export type Dot = {
  x: number;
  y: number;
  ink: string;
  /** Parallax layer (PARALLAX): how far the camera moves it. */
  layer?: number;
  fx?: number;
  /** 0 → 1: when in the morph this cell starts, for `order: "given"`. */
  order?: number;
  /**
   * FX.SWEEP: the column this cell belongs to; it takes `SWEEP_INK` when its turn comes.
   * FX.FRAME: the frame of a sprite this cell belongs to; it shows only on that frame's turn.
   */
  group?: number;
};

export type Grid = { cols: number; rows: number };

/** A flat run of one row: the mass under the cells (the rock), never flown. */
export type Span = { x: number; y: number; w: number; ink: string };
export type Backdrop = { spans: readonly Span[]; at: number };

export type MorphOptions = {
  /** Milliseconds a cell spends in the air. */
  duration?: number;
  /** Milliseconds over which the cells set off, according to `order`. */
  spread?: number;
  order?: "random" | "given" | "up" | "down" | "out" | "in";
  /** Switch on in place when their turn comes (no flight), the old cells falling away. */
  kindle?: boolean;
  /** The colour of a cell in flight. */
  burn?: string;
  /** Where the surplus old cells go. */
  exit?: "scatter" | "fall" | "center" | "rise";
};

/** How far each layer moves with the camera: far sky, far cloud, the world, near cloud. */
const PARALLAX = [0.12, 0.55, 1, 1.5];
/** Cells a second, for FX.DRIFT, by layer. */
const DRIFT = [0, 0.7, 0, 1.6];
const SWEEP_INK = "#03c652";
const SWEEP_STEP = 620;
const CAPACITY = 60000;
const BOLT_LIFE = 320;
/** Cells a second squared, pulling a spark down. */
const SPARK_FALL = 70;
/** A flame's sprite: three frames, stepped, the same pace as the fires on /olympus. */
const FRAME_MS = 180;
const FRAMES = 3;

const easeInOut = (u: number) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** A repeatable random in 0..1 per cell and time step, with no visible pattern across cells. */
function hash(i: number, step: number) {
  let h = Math.imul(i ^ Math.imul(step, 0x9e3779b1), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class CellStage {
  private ctx: CanvasRenderingContext2D;
  private cell = 8;
  cols = LOGICAL_COLS;
  rows = LOGICAL_ROWS;

  private inks: string[] = [];
  private inkIndex = new Map<string, number>();
  private count = 0;
  private live = 0;
  private fromX = new Float32Array(CAPACITY);
  private fromY = new Float32Array(CAPACITY);
  private toX = new Float32Array(CAPACITY);
  private toY = new Float32Array(CAPACITY);
  private delay = new Float32Array(CAPACITY);
  private air = new Float32Array(CAPACITY);
  private color = new Uint16Array(CAPACITY);
  private before = new Uint16Array(CAPACITY);
  private fx = new Uint8Array(CAPACITY);
  private layer = new Uint8Array(CAPACITY);
  private group = new Uint8Array(CAPACITY);
  private curX = new Float32Array(CAPACITY);
  private curY = new Float32Array(CAPACITY);

  private burn = 0;
  private kindle = false;
  private morphStart = 0;
  private morphEnd = 0;
  private cam = { from: 0, to: 0, start: 0, dur: 0 };
  private shakeUntil = 0;
  private shakeSize = 0;
  private bolts: { x: number; y: number; start: number }[][] = [];
  private sparkles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    start: number;
    life: number;
    ink: string;
  }[] = [];
  private sweepOn = false;
  private back: (Backdrop & { start: number; leaving: boolean }) | null = null;

  private raf = 0;
  private running = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private still: boolean,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.resize();
  }

  /** Whole device pixels per cell, so neighbouring cells never leave a seam. */
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    this.canvas.width = w;
    this.canvas.height = h;
    this.cell = Math.max(2, Math.floor(Math.min(w / LOGICAL_COLS, h / LOGICAL_ROWS)));
    this.cols = Math.ceil(w / this.cell);
    this.rows = Math.ceil(h / this.cell);
  }

  get grid(): Grid {
    return { cols: this.cols, rows: this.rows };
  }

  /** Slide pixels (Prologue's `--u`, 1920 x 1080) as cells, to line a picture up with the type. */
  units(n: number) {
    const u = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    return (n * u * (window.devicePixelRatio || 1)) / this.cell;
  }

  private ink(hex: string) {
    let i = this.inkIndex.get(hex);
    if (i === undefined) {
      i = this.inks.length;
      this.inks.push(hex);
      this.inkIndex.set(hex, i);
    }
    return i;
  }

  /** Where every cell is on screen right now, for the next morph to start from. */
  private bake(now: number) {
    const camY = this.camY(now);
    const t = now - this.morphStart;
    for (let i = 0; i < this.count; i += 1) {
      const u = clamp01((t - this.delay[i]!) / (this.air[i]! || 1));
      const homeY = this.toY[i]! + camY * PARALLAX[this.layer[i]!]!;
      this.curX[i] = this.fromX[i]! + (this.toX[i]! - this.fromX[i]!) * easeInOut(u);
      this.curY[i] = this.fromY[i]! + (homeY - this.fromY[i]!) * easeInOut(u);
    }
  }

  /** Puts a scene on screen at once: a resume, a step back, or reduced motion. */
  set(dots: readonly Dot[], camY = 0) {
    this.load(dots.length);
    dots.forEach((d, i) => this.write(i, d, d.x, d.y + camY * PARALLAX[d.layer ?? 2]!, 0, 0));
    this.live = this.count = Math.min(dots.length, CAPACITY);
    this.morphStart = this.morphEnd = performance.now();
    this.kindle = false;
    this.cam = { from: camY, to: camY, start: 0, dur: 0 };
    this.bolts = [];
    this.back = null;
    this.sparkles = [];
    this.wake();
  }

  private load(n: number) {
    this.sweepOn = false;
    if (n > CAPACITY) console.warn(`Prologue: ${n} cells, capacity ${CAPACITY}`);
  }

  private write(i: number, d: Dot, fromX: number, fromY: number, delay: number, air: number) {
    this.fromX[i] = fromX;
    this.fromY[i] = fromY;
    this.toX[i] = d.x;
    this.toY[i] = d.y;
    this.delay[i] = delay;
    this.air[i] = air;
    this.color[i] = this.ink(d.ink);
    this.fx[i] = d.fx ?? 0;
    this.layer[i] = d.layer ?? 2;
    this.group[i] = d.group ?? 0;
    if (d.fx === FX.SWEEP) this.sweepOn = true;
  }

  /** Flies the cells on screen into a new scene. */
  morph(dots: readonly Dot[], options: MorphOptions = {}) {
    if (this.still) return this.set(dots);
    const { duration = 1100, spread = 500, order = "random", exit = "scatter", burn } = options;
    const now = performance.now();
    this.bake(now);
    const old = Math.min(this.live, this.count);
    const oldX = this.curX.slice(0, old);
    const oldY = this.curY.slice(0, old);
    const oldInk = this.color.slice(0, old);
    this.load(dots.length);
    const next = Math.min(dots.length, CAPACITY);
    const cx = this.cols / 2;
    const cy = this.rows / 2;
    const far = Math.hypot(cx, cy);

    // A shuffled deal of the old cells; a scene with more cells than the last deals them twice.
    const deal = new Uint32Array(Math.max(old, 1));
    for (let i = 0; i < deal.length; i += 1) deal[i] = i;
    for (let i = deal.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const k = deal[i]!;
      deal[i] = deal[j]!;
      deal[j] = k;
    }

    for (let i = 0; i < next; i += 1) {
      const d = dots[i]!;
      let when = Math.random();
      if (order === "given") when = (d.order ?? 0) + Math.random() * 0.02;
      else if (order === "up") when = 1 - d.y / this.rows + Math.random() * 0.08;
      else if (order === "down") when = d.y / this.rows + Math.random() * 0.08;
      else if (order === "out") when = Math.hypot(d.x - cx, d.y - cy) / far + Math.random() * 0.08;
      else if (order === "in")
        when = 1 - Math.hypot(d.x - cx, d.y - cy) / far + Math.random() * 0.08;
      const delay = clamp01(when) * spread;
      if (options.kindle) {
        this.write(i, d, d.x, d.y, delay, 1);
      } else if (old > 0) {
        const s = deal[i % deal.length]!;
        this.write(i, d, oldX[s]!, oldY[s]!, delay, duration * (0.8 + Math.random() * 0.4));
        this.before[i] = oldInk[s]!;
      } else {
        // From nothing: in from far outside the screen.
        const a = Math.random() * Math.PI * 2;
        const r = far * (1.2 + Math.random() * 0.5);
        const fx = cx + Math.cos(a) * r;
        const fy = cy + Math.sin(a) * r;
        this.write(i, d, fx, fy, delay, duration * (0.8 + Math.random() * 0.4));
        this.before[i] = this.ink(d.ink);
      }
    }

    // The old cells nobody was dealt (or, for a kindle, all of them) leave.
    let total = next;
    const leavers = options.kindle ? old : Math.max(0, old - next);
    for (let n = 0; n < leavers && total < CAPACITY; n += 1) {
      const s = options.kindle ? n : deal[next + n]!;
      const a = Math.random() * Math.PI * 2;
      const r = far * (1.2 + Math.random() * 0.5);
      let toX = cx + Math.cos(a) * r;
      let toY = cy + Math.sin(a) * r;
      if (exit === "fall") {
        toX = oldX[s]! + (Math.random() - 0.5) * 12;
        toY = this.rows + 12 + Math.random() * 40;
      } else if (exit === "center") {
        toX = cx;
        toY = cy;
      } else if (exit === "rise") {
        toX = oldX[s]! + (Math.random() - 0.5) * 16;
        toY = -6 - Math.random() * 40;
      }
      this.write(
        total,
        { x: toX, y: toY, ink: this.inks[oldInk[s]!]!, layer: 2 },
        oldX[s]!,
        oldY[s]!,
        Math.random() * spread * 0.5,
        duration,
      );
      this.before[total] = oldInk[s]!;
      total += 1;
    }

    this.count = total;
    this.live = next;
    this.burn = burn ? this.ink(burn) : -1;
    this.kindle = Boolean(options.kindle);
    this.morphStart = now;
    this.morphEnd = now + spread + duration * 1.25;
    this.cam = { from: 0, to: 0, start: 0, dur: 0 };
    if (this.back) this.back = { ...this.back, start: now, leaving: true };
    this.wake();
  }

  /** The mass under this scene's cells; it comes up after them and leaves with the next morph. */
  backdrop(back: Backdrop, { instant = false }: { instant?: boolean } = {}) {
    this.back = { ...back, start: instant || this.still ? 0 : performance.now(), leaving: false };
    this.wake();
  }

  private drawBack(now: number, camY: number, shakeX: number, shakeY: number) {
    const back = this.back;
    if (!back) return;
    const age = now - back.start;
    const alpha = back.leaving ? 1 - age / 450 : Math.min(1, age / 900);
    if (alpha <= 0) {
      if (back.leaving) this.back = null;
      return;
    }
    const { ctx, cell, rows } = this;
    ctx.globalAlpha = alpha;
    let last = "";
    for (const { x, y, w, ink } of back.spans) {
      const py = Math.round(y + camY) + shakeY;
      if (py < 0 || py >= rows || w <= 0) continue;
      if (ink !== last) {
        ctx.fillStyle = ink;
        last = ink;
      }
      ctx.fillRect((x + shakeX) * cell, py * cell, w * cell, cell);
    }
    ctx.globalAlpha = 1;
  }

  /** The camera, in cells: 0 is a scene as drawn, negative looks further down the world. */
  pan(from: number, to: number, dur: number) {
    if (this.still) {
      this.cam = { from: to, to, start: 0, dur: 0 };
      return;
    }
    this.cam = { from, to, start: performance.now(), dur };
    this.wake();
  }

  private camY(now: number) {
    const { from, to, start, dur } = this.cam;
    if (!dur) return to;
    const u = clamp01((now - start) / dur);
    return from + ((to - from) * (1 - Math.cos(Math.PI * u))) / 2;
  }

  shake(ms = 400, size = 2) {
    if (this.still) return;
    this.shakeUntil = performance.now() + ms;
    this.shakeSize = size;
  }

  /** A jagged bolt of white cells from (x, y) down to row `toY`, gone in a third of a second. */
  strike(x: number, y: number, toY: number) {
    if (this.still) return;
    const start = performance.now();
    const cells: { x: number; y: number; start: number }[] = [];
    let cx = x;
    for (let cy = y; cy < toY; cy += 1) {
      if (Math.random() < 0.38) cx += Math.random() < 0.5 ? -2 : 2;
      cells.push({ x: cx, y: cy, start }, { x: cx + 1, y: cy, start });
      if (Math.random() < 0.05) {
        let bx = cx;
        const dir = Math.random() < 0.5 ? -1 : 1;
        for (let b = 0; b < 14 + Math.random() * 20; b += 1) {
          bx += dir;
          cells.push({ x: bx, y: cy + b, start });
        }
      }
    }
    this.bolts.push(cells);
    this.wake();
  }

  /** A burst of single cells off a hammer blow, falling and gone in half a second. */
  sparks(x: number, y: number, n = 26) {
    if (this.still) return;
    const start = performance.now();
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 34;
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 12,
        start,
        life: 260 + Math.random() * 340,
        ink: Math.random() < 0.35 ? "#f5f5f5" : "#03c652",
      });
    }
    this.wake();
  }

  private wake() {
    if (this.still) {
      this.draw(performance.now());
      return;
    }
    if (!this.running) {
      this.running = true;
      const frame = () => {
        this.draw(performance.now());
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    }
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private draw(now: number) {
    const { ctx, cell, cols, rows } = this;
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const camY = this.camY(now);
    const t = now - this.morphStart;
    const settled = now >= this.morphEnd;
    if (settled) this.count = this.live;

    const flicker = this.still ? 0 : Math.floor(now / 95);
    const twinkle = this.still ? 0 : Math.floor(now / 420);
    const seconds = this.still ? 0 : now / 1000;
    const sweep = this.sweepOn && !this.still ? Math.floor(now / SWEEP_STEP) % 9 : -1;
    const frame = this.still ? 0 : Math.floor(now / FRAME_MS) % FRAMES;
    const sweepInk = this.ink(SWEEP_INK);

    let shakeX = 0;
    let shakeY = 0;
    if (now < this.shakeUntil) {
      shakeX = Math.round((Math.random() - 0.5) * 2 * this.shakeSize);
      shakeY = Math.round((Math.random() - 0.5) * 2 * this.shakeSize);
    }

    let last = -1;
    const n = this.count;
    const backAt = this.back?.at ?? -1;
    for (let i = 0; i < n; i += 1) {
      if (i === backAt) {
        this.drawBack(now, camY, shakeX, shakeY);
        last = -1;
      }
      const layer = this.layer[i]!;
      const homeY = this.toY[i]! + camY * PARALLAX[layer]!;
      let x = this.toX[i]!;
      let y = homeY;
      let c = this.color[i]!;
      const elapsed = settled ? 1 : (t - this.delay[i]!) / (this.air[i]! || 1);

      if (elapsed < 1) {
        if (elapsed <= 0) {
          if (this.kindle && i < this.live) continue;
          x = this.fromX[i]!;
          y = this.fromY[i]!;
          c = this.before[i]!;
        } else if (!this.kindle || i >= this.live) {
          const e = easeInOut(elapsed);
          x = this.fromX[i]! + (x - this.fromX[i]!) * e;
          y = this.fromY[i]! + (y - this.fromY[i]!) * e;
          if (this.burn >= 0) c = this.burn;
        }
      } else {
        if (i >= this.live) continue; // a leaver that has left
        const fx = this.fx[i]!;
        if (fx === FX.FLAME) {
          const h = hash(i, flicker);
          if (h < 0.22) continue;
        } else if (fx === FX.TWINKLE) {
          if (hash(i, twinkle) < 0.3) continue;
        } else if (fx === FX.DRIFT) {
          const span = cols + 80;
          x = ((x + seconds * DRIFT[layer]! + 40) % span) - 40;
        } else if (fx === FX.SWEEP && this.group[i] === sweep) {
          c = sweepInk;
        } else if (fx === FX.FRAME && this.group[i] !== frame) {
          continue;
        }
      }

      const px = Math.round(x) + shakeX;
      const py = Math.round(y) + shakeY;
      if (px < 0 || py < 0 || px >= cols || py >= rows) continue;
      if (c !== last) {
        ctx.fillStyle = this.inks[c]!;
        last = c;
      }
      ctx.fillRect(px * cell, py * cell, cell, cell);
    }

    if (this.bolts.length) {
      ctx.fillStyle = "#ffffff";
      this.bolts = this.bolts.filter((b) => now - b[0]!.start < BOLT_LIFE);
      for (const bolt of this.bolts) {
        // Two strokes of the same bolt: it flickers once, as lightning does.
        const age = now - bolt[0]!.start;
        if (age > 90 && age < 150) continue;
        for (const b of bolt) ctx.fillRect(b.x * cell, (b.y + shakeY) * cell, cell, cell);
      }
    }

    if (this.sparkles.length) {
      this.sparkles = this.sparkles.filter((s) => now - s.start < s.life);
      for (const s of this.sparkles) {
        const age = (now - s.start) / 1000;
        ctx.fillStyle = s.ink;
        ctx.fillRect(
          Math.round(s.x + s.vx * age) * cell,
          Math.round(s.y + s.vy * age + SPARK_FALL * age * age) * cell,
          cell,
          cell,
        );
      }
    }
  }
}
