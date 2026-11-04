import { C, drawWord, makeCanvas } from "@/components/olympus/crawl/art";
import type { TombSound } from "@/components/olympus/crawl/sound";

/**
 * The word for the Oracle, forged at the altar. Everything is on the room's own cells and in the
 * room's own coordinates, drawn after the dark, and every position is worked out from the clock
 * rather than stepped, so a stalled frame or a hidden tab can only skip ahead, never drift.
 *
 * The room's light drains into the altar's flame while sparks spiral in from the bowls, the coin and
 * the floor; the flame climbs, and holds at its height, straining; it is pulled down into a white
 * point with the sound still rising; the sound cuts for a held breath; then one white blast, and the blast is
 * the word: each of its cells is thrown out, hangs in the air, and is pulled home letter by letter,
 * each letter struck like metal, white-hot, cooling to green. A light runs across it and it holds.
 * When the family steps away the cells fly up and land as the carving on the wall.
 */

/** Milliseconds from the press. */
const HUSH = 900;
const GATHER_FROM = 700;
/** The flame reaches its height here and holds it, straining, sparks still pouring in. */
const PEAK = 4000;
/** It is pulled down into the white heart, with the sound still climbing. */
const IMPLODE = 4700;
/** The fire is gone and the sound cuts: nothing at all, for one held breath. */
const COLLAPSED = 5200;
const BURST = 5650;
/** The white heart shows in the flame from here. */
const CORE_FROM = 3000;
/** After the blast, before the first letter starts to come home. */
const HANG = 450;
/** Every letter's start falls inside this, however long the word is. */
const SPREAD = 2400;
/** How long a cell takes to come home, and how much later the slowest starts. */
const HOME = 620;
const HOME_LAG = 230;
const LEAVE_MS = 1150;

/** Where the word stays carved, on the Sanctum's wall. */
export const WALL_WORD = { x: 160, y: 19, size: 3 } as const;

const SPARK_INKS = [C.gold, "#ffd98a", "#e0852a", C.mint] as const;

type Cell = {
  tx: number;
  ty: number;
  letter: number;
  /** Which way the blast threw it, and how hard. */
  a: number;
  v: number;
  /** When it starts for home, and when it gets there. */
  hs: number;
  ar: number;
  /** Where it lands on the wall, and how late it sets off. */
  wx: number;
  wy: number;
  lag: number;
};
type Spark = { st: number; dur: number; r0: number; a0: number; swirl: number };
type Letter = {
  x: number;
  y: number;
  /** A letter's three heats: just struck, cooling, cold and bevelled with its shadow. */
  white: HTMLCanvasElement;
  warm: HTMLCanvasElement;
  cold: HTMLCanvasElement;
  strike: number;
};

export type RevealHooks = {
  shake: (ms: number, amp: number) => void;
  onHeld: () => void;
  onGone: () => void;
};

const clamp = (u: number) => Math.max(0, Math.min(1, u));
const smooth = (u: number) => u * u * (3 - 2 * u);

/** A little seeded noise, so a replay of the same word falls the same way. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function solidPicture(cells: { x: number; y: number }[], w: number, h: number, ink: string) {
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.fillStyle = ink;
  for (const c of cells) ctx.fillRect(c.x, c.y, 1, 1);
  return canvas;
}

export class WordReveal {
  private start: number;
  private cells: Cell[] = [];
  private buckets: Cell[][] = SPARK_INKS.map(() => []);
  private sparks: Spark[] = [];
  private letters: Letter[] = [];
  private cues: { at: number; run: () => void }[] = [];
  private cueAt = 0;
  private whole = 0;
  private held = false;
  private leftAt = -1;
  private gone = false;
  private left = 0;
  private top = 0;
  private spanW = 1;
  private spanH = 1;

  constructor(
    word: string,
    font: string,
    private viewW: number,
    viewH: number,
    /** Where the altar's fire burns, and the middle of the word, in the room's coordinates. */
    private fire: { x: number; y: number },
    wordMiddleY: number,
    sources: readonly { x: number; y: number }[],
    private score: TombSound,
    private hooks: RevealHooks,
    now: number,
  ) {
    this.start = now;
    this.buildWord(word, font, viewH, wordMiddleY);
    this.buildSparks(sources, word.length);
    this.buildCues();
  }

  private buildWord(word: string, font: string, viewH: number, middleY: number) {
    const probe = makeCanvas(8, 8).ctx;
    const fontAt = (size: number) => `600 ${size}px ${font}`;
    // As tall as the frame can spare, and no wider than it: capitals are about 0.7 of the size.
    let size = Math.round((viewH * 0.2) / 0.7);
    const track = (s: number) => Math.round(s * 0.07);
    const widthAt = (s: number) => {
      probe.font = fontAt(s);
      return [...word].reduce((sum, ch) => sum + probe.measureText(ch).width + track(s), -track(s));
    };
    const room = this.viewW * 0.8;
    if (widthAt(size) > room) size = Math.floor((size * room) / widthAt(size));
    const total = widthAt(size);
    probe.font = fontAt(size);

    const r = seeded(word.length * 7919 + word.charCodeAt(0));
    const height = Math.ceil(size * 1.1);
    const baseline = Math.round(size * 0.9);
    const left = Math.round(this.fire.x - total / 2);
    const top = Math.round(middleY - size * 0.55);
    const step = Math.min(340, SPREAD / word.length);
    let penX = left;
    let bottom = top;
    let right = left;

    [...word].forEach((ch, index) => {
      const advance = probe.measureText(ch).width;
      const w = Math.ceil(advance) + 2;
      const { ctx } = makeCanvas(w, height);
      ctx.font = fontAt(size);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(ch, 1, baseline);
      const data = ctx.getImageData(0, 0, w, height).data;
      const on = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < w && y < height && data[(x + y * w) * 4 + 3]! > 104;

      const shape: { x: number; y: number }[] = [];
      const lit: { x: number; y: number }[] = [];
      const shade: { x: number; y: number }[] = [];
      const body: { x: number; y: number }[] = [];
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < w; x += 1) {
          if (!on(x, y)) continue;
          shape.push({ x, y });
          if (!on(x, y - 1) || !on(x - 1, y)) lit.push({ x, y });
          else if (!on(x, y + 1) || !on(x + 1, y)) shade.push({ x, y });
          else body.push({ x, y });
        }
      }

      const hs = BURST + HANG + index * step;
      const strike = hs + HOME_LAG + HOME;
      const cold = makeCanvas(w, height + 3);
      // A hard dark edge and a drop under it, so the word stands off the brick behind.
      cold.ctx.fillStyle = "#04140b";
      for (const c of shape) {
        cold.ctx.fillRect(c.x - 1, c.y - 1, 3, 3);
        cold.ctx.fillRect(c.x, c.y + 3, 1, 1);
      }
      cold.ctx.fillStyle = C.green;
      for (const c of body) cold.ctx.fillRect(c.x, c.y, 1, 1);
      cold.ctx.fillStyle = "#b8ffd9";
      for (const c of lit) cold.ctx.fillRect(c.x, c.y, 1, 1);
      cold.ctx.fillStyle = C.deep;
      for (const c of shade) cold.ctx.fillRect(c.x, c.y, 1, 1);

      this.letters.push({
        x: penX - 1,
        y: top,
        white: solidPicture(shape, w, height, C.white),
        warm: solidPicture(shape, w, height, C.mint),
        cold: cold.canvas,
        strike,
      });

      for (const c of shape) {
        const tx = penX - 1 + c.x;
        const ty = top + c.y;
        const cell: Cell = {
          tx,
          ty,
          letter: index,
          a: r() * Math.PI * 2,
          v: 36 + Math.sqrt(r()) * Math.max(this.viewW * 0.5, 170),
          hs: hs + r() * HOME_LAG,
          ar: 0,
          wx: tx,
          wy: ty,
          lag: r() * 260,
        };
        cell.ar = cell.hs + HOME;
        this.cells.push(cell);
        this.buckets[Math.floor(r() * SPARK_INKS.length)]!.push(cell);
        bottom = Math.max(bottom, ty);
        right = Math.max(right, tx);
      }
      penX += Math.round(advance) + track(size);
    });

    this.left = left;
    this.top = top;
    this.spanW = Math.max(1, right - left);
    this.spanH = Math.max(1, bottom - top);
    this.whole = this.letters[this.letters.length - 1]!.strike + 340;
  }

  private buildSparks(sources: readonly { x: number; y: number }[], seed: number) {
    const r = seeded(seed * 104729 + 17);
    for (let i = 0; i < 1150; i += 1) {
      // The stream thickens as the flame climbs.
      const st = GATHER_FROM + (IMPLODE - 500 - GATHER_FROM) * r() ** 0.62;
      const from = i % 3 === 0 ? sources[i % sources.length] : null;
      const a = r() * Math.PI * 2;
      const dx = from ? from.x - this.fire.x : Math.cos(a) * (90 + r() * 120);
      const dy = from ? (from.y - this.fire.y) / 0.75 : Math.sin(a) * (90 + r() * 120);
      this.sparks.push({
        st,
        dur: 620 + r() * 620,
        r0: Math.hypot(dx, dy),
        a0: Math.atan2(dy, dx),
        swirl: (r() < 0.5 ? -1 : 1) * (1.2 + r() * 2),
      });
    }
  }

  private buildCues() {
    const { score, hooks } = this;
    const cues: { at: number; run: () => void }[] = [
      { at: 0, run: () => score.revealRise(COLLAPSED / 1000) },
      { at: 3000, run: () => hooks.shake(800, 1) },
      { at: 3800, run: () => hooks.shake(800, 1) },
      { at: PEAK + 200, run: () => hooks.shake(900, 2) },
      { at: COLLAPSED, run: () => score.breath(true) },
      {
        at: BURST,
        run: () => {
          score.breath(false);
          score.revealStrike();
          hooks.shake(600, 3);
        },
      },
      ...this.letters.map((letter, i) => ({
        at: letter.strike,
        run: () => score.revealLetter(i),
      })),
      {
        at: this.whole,
        run: () => score.revealWhole(),
      },
      {
        at: this.whole + 900,
        run: () => {
          this.held = true;
          hooks.onHeld();
        },
      },
    ];
    this.cues = cues.sort((a, b) => a.at - b.at);
  }

  /** The cues that have come due, and the end of the flight to the wall. */
  step(now: number) {
    const t = now - this.start;
    while (this.cueAt < this.cues.length && this.cues[this.cueAt]!.at <= t) {
      this.cues[this.cueAt]!.run();
      this.cueAt += 1;
    }
    if (this.leftAt >= 0 && !this.gone && now - this.leftAt >= LEAVE_MS) {
      this.gone = true;
      this.score.revealCarve();
      this.hooks.onGone();
    }
  }

  get isHeld() {
    return this.held;
  }

  /** The family steps away: the cells make for the carving on the wall. */
  leave(word: string, now: number) {
    if (this.leftAt >= 0) return;
    this.leftAt = now;
    const { canvas, ctx } = makeCanvas(320, 64);
    drawWord(ctx, word, WALL_WORD.x, WALL_WORD.y, "#fff", WALL_WORD.size);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const spots: { x: number; y: number }[] = [];
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (data[(x + y * canvas.width) * 4 + 3]! > 0) spots.push({ x, y });
      }
    }
    if (!spots.length) return;
    spots.sort((a, b) => a.x - b.x);
    const sorted = [...this.cells].sort((a, b) => a.tx - b.tx);
    sorted.forEach((cell, i) => {
      const spot = spots[Math.floor((i / sorted.length) * spots.length)]!;
      cell.wx = spot.x;
      cell.wy = spot.y;
    });
  }

  /** How much of the room's own light has gone, 0 to 1. */
  dim(now: number) {
    const t = now - this.start;
    if (this.leftAt >= 0) return 0.82 * (1 - smooth(clamp((now - this.leftAt) / LEAVE_MS)));
    if (t < HUSH) return 0.92 * smooth(t / HUSH);
    if (t < BURST) return 0.92 + 0.06 * clamp((t - HUSH) / (COLLAPSED - HUSH));
    // The blast shows the whole room for a moment, the way lightning does.
    if (t < BURST + 900) return 0.12 + 0.81 * smooth((t - BURST) / 900);
    if (t < this.whole) return 0.93;
    return 0.93 - 0.11 * smooth(clamp((t - this.whole) / 900));
  }

  /** The altar's flame: how wide and how tall, or nothing. */
  flame(now: number): { half: number; height: number } | null {
    const t = now - this.start;
    if (t >= COLLAPSED && t < this.whole) return null;
    if (t >= this.whole) {
      const u = smooth(clamp((t - this.whole) / 500));
      return { half: Math.round(2 + 5 * u), height: Math.round(4 + 16 * u) };
    }
    const c = clamp((t - GATHER_FROM) / (PEAK - GATHER_FROM));
    const low = 1 - 0.35 * smooth(clamp(t / HUSH));
    // Never calmer on the way up: it only leaves by being pulled down, all at once at the end.
    const left = 1 - clamp((t - IMPLODE) / (COLLAPSED - IMPLODE)) ** 2;
    return {
      half: Math.max(1, Math.round((7 * low + 9 * c * c) * left)),
      height: Math.max(2, Math.round((20 * low + 46 * c * c) * left)),
    };
  }

  /** How far the altar's fire lights the room round it. */
  lightRadius(now: number) {
    const t = now - this.start;
    if (t >= COLLAPSED && t < this.whole) return 0;
    if (t >= this.whole) return 76 * smooth(clamp((t - this.whole) / 500));
    const left = 1 - clamp((t - IMPLODE) / (COLLAPSED - IMPLODE));
    return (44 + 60 * clamp((t - GATHER_FROM) / (PEAK - GATHER_FROM))) * left;
  }

  /** The bowls go out one by one as the altar drinks them, and catch again with the word. */
  bowlLit(i: number, now: number) {
    const t = now - this.start;
    return t < 2200 + i * 450 || t >= this.whole;
  }

  /** The statues' eyes stay lit until the last moment. */
  eyesLit(now: number) {
    const t = now - this.start;
    return t < COLLAPSED || t >= this.whole;
  }

  /** The blast, over the whole picture: one flash, in whole steps. */
  flash(now: number) {
    const dt = now - this.start - BURST;
    if (dt < 0 || dt >= 480) return 0;
    return Math.ceil((1 - dt / 480) * 6) / 6;
  }

  /** The word's own light on the room, to be added after the dark. */
  glow(now: number) {
    const t = now - this.start;
    if (t < BURST) return 0;
    return 0.1 * smooth(clamp((t - BURST) / 1500)) * (this.leftAt >= 0 ? 0 : 1);
  }

  get middle() {
    return { x: this.left + this.spanW / 2, y: this.top + this.spanH / 2 };
  }

  draw(ctx: CanvasRenderingContext2D, now: number) {
    const t = now - this.start;
    if (this.leftAt >= 0) return this.drawLeaving(ctx, now);
    if (t < COLLAPSED) this.drawGather(ctx, t);
    if (t >= CORE_FROM && t < BURST) this.drawCore(ctx, t);
    if (t >= BURST) {
      this.drawRings(ctx, t - BURST);
      this.drawFlying(ctx, t);
      this.drawLetters(ctx, t);
      this.drawStrikeSparks(ctx, t);
    }
    if (t >= this.whole) {
      this.drawShine(ctx, t);
      this.drawEmbers(ctx, t);
    }
  }

  private drawGather(ctx: CanvasRenderingContext2D, t: number) {
    const { x: fx, y: fy } = this.fire;
    const put = (s: Spark, u: number) => {
      const e = u * u;
      const r = s.r0 * (1 - e);
      const a = s.a0 + s.swirl * e;
      ctx.fillRect(Math.round(fx + Math.cos(a) * r), Math.round(fy + Math.sin(a) * r * 0.75), 1, 1);
      return r;
    };
    for (const s of this.sparks) {
      const u = (t - s.st) / s.dur;
      if (u <= 0 || u >= 1) continue;
      ctx.fillStyle = "#8a6a24";
      if (u > 0.06) put(s, u - 0.06);
      const r = s.r0 * (1 - u * u);
      ctx.fillStyle = r > 60 ? C.gold : r > 26 ? C.mint : C.white;
      put(s, u);
    }
  }

  /** The white heart in the flame, growing, then falling in on itself before the blast. */
  private drawCore(ctx: CanvasRenderingContext2D, t: number) {
    let half = 1;
    if (t < PEAK) half = Math.round(1 + 4 * ((t - CORE_FROM) / (PEAK - CORE_FROM)));
    // Straining at the peak, a cell in and out; then pulled down to the one point that holds.
    else if (t < IMPLODE) half = 5 + (Math.floor(t / 110) % 2);
    else if (t < COLLAPSED) half = Math.max(1, Math.round(5 * (1 - (t - IMPLODE) / 500)));
    const { x, y } = this.fire;
    ctx.fillStyle = C.white;
    ctx.fillRect(x - half, y - half - 8, half * 2 + 1, half * 2 + 1);
  }

  private drawRings(ctx: CanvasRenderingContext2D, dt: number) {
    const { x: fx, y: fy } = this.fire;
    const reach = this.viewW * 0.68;
    for (const [delay, ink] of [
      [0, C.white],
      [110, C.mint],
    ] as const) {
      const u = (dt - delay) / 640;
      if (u <= 0 || u >= 1) continue;
      const r = (1 - (1 - u) ** 2.4) * reach;
      ctx.fillStyle = ink;
      const n = 170;
      for (let i = 0; i < n; i += 1) {
        // It breaks up as it spreads.
        if (u > 0.45 && i % 2) continue;
        if (u > 0.75 && i % 4) continue;
        const a = (i / n) * Math.PI * 2;
        const w = u < 0.3 ? 3 : 2;
        ctx.fillRect(
          Math.round(fx + Math.cos(a) * r),
          Math.round(fy + Math.sin(a) * r * 0.7),
          w,
          w,
        );
      }
    }
  }

  private drawFlying(ctx: CanvasRenderingContext2D, t: number) {
    const { x: fx, y: fy } = this.fire;
    const dt = t - BURST;
    const out = 1 - Math.exp(-dt / 240);
    const lastStrike = this.letters[this.letters.length - 1]!.strike;
    if (t >= lastStrike) return;
    this.buckets.forEach((bucket, b) => {
      ctx.fillStyle = SPARK_INKS[b]!;
      for (const c of bucket) {
        if (t >= c.ar) continue;
        const a = c.a + dt * 0.00022 * (c.letter % 2 ? 1 : -1);
        const hx = fx + Math.cos(a) * c.v * out;
        // Hanging, and sinking a little, as sparks do when they have spent themselves.
        const hy = fy + Math.sin(a) * c.v * out * 0.62 + dt * 0.006;
        const u = clamp((t - c.hs) / HOME);
        const e = u * u * u;
        ctx.fillRect(Math.round(hx + (c.tx - hx) * e), Math.round(hy + (c.ty - hy) * e), 1, 1);
      }
    });
    // Already home, not yet struck: white, and filling in.
    ctx.fillStyle = C.white;
    for (const c of this.cells) {
      if (t >= c.ar && t < this.letters[c.letter]!.strike) ctx.fillRect(c.tx, c.ty, 1, 1);
    }
  }

  private drawLetters(ctx: CanvasRenderingContext2D, t: number) {
    for (const letter of this.letters) {
      const age = t - letter.strike;
      if (age < 0) continue;
      const picture = age < 100 ? letter.white : age < 260 ? letter.warm : letter.cold;
      ctx.drawImage(picture, letter.x, letter.y);
    }
  }

  private drawStrikeSparks(ctx: CanvasRenderingContext2D, t: number) {
    this.letters.forEach((letter, i) => {
      const dt = t - letter.strike;
      if (dt < 0 || dt > 560) return;
      const r = seeded((i + 1) * 3571);
      const midX = letter.x + letter.cold.width / 2;
      const midY = letter.y + letter.cold.height / 2;
      ctx.fillStyle = dt < 220 ? C.white : C.gold;
      for (let k = 0; k < 30; k += 1) {
        const a = r() * Math.PI * 2;
        const v = 34 + r() * 66;
        const u = dt / 1000;
        if (k % 3 === 0 && dt > 380) continue;
        ctx.fillRect(
          Math.round(midX + Math.cos(a) * v * u * 1.6),
          Math.round(midY + Math.sin(a) * v * u * 1.6 + 90 * u * u),
          1,
          1,
        );
      }
    });
  }

  /** A band of light across the word as it comes whole, and again every few seconds. */
  private drawShine(ctx: CanvasRenderingContext2D, t: number) {
    const u = ((t - this.whole) % 5200) / 900;
    if (u > 1) return;
    const span = this.spanW + this.spanH;
    const at = -12 + u * (span + 24);
    ctx.fillStyle = C.white;
    for (const c of this.cells) {
      const d = c.tx - this.left + (c.ty - this.top) - at;
      if (d > -5 && d < 5) ctx.fillRect(c.tx, c.ty, 1, 1);
    }
  }

  /** The metal still hot: a few sparks lifting off it, one cell at a time. */
  private drawEmbers(ctx: CanvasRenderingContext2D, t: number) {
    const n = this.cells.length;
    for (let i = 0; i < 44; i += 1) {
      const period = 1900 + ((i * 397) % 1700);
      const phase = ((t + i * 613) % period) / period;
      if (phase > 0.8 && i % 2) continue;
      const c = this.cells[(i * 997) % n]!;
      ctx.fillStyle = phase < 0.45 ? C.gold : "#e0852a";
      ctx.fillRect(
        c.tx + Math.round(Math.sin(phase * 6 + i) * 3),
        c.ty - Math.round(phase * 30),
        1,
        1,
      );
    }
  }

  private drawLeaving(ctx: CanvasRenderingContext2D, now: number) {
    const dt = now - this.leftAt;
    ctx.fillStyle = C.green;
    for (const c of this.cells) {
      const u = clamp((dt - c.lag) / (LEAVE_MS - 260));
      const e = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
      ctx.fillRect(
        Math.round(c.tx + (c.wx - c.tx) * e),
        Math.round(c.ty + (c.wy - c.ty) * e),
        1,
        1,
      );
    }
  }
}
