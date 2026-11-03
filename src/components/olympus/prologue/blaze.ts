/**
 * A live fire for the Prologue's stage, the old demoscene fire: a grid of heat whose bottom row is
 * fed, every other cell taking the average of the cells under it, a little cooler. The cooling
 * comes from a smooth noise that climbs with the flame, so it carves solid tongues that rise,
 * split and burn out by themselves instead of a static cone with holes in it. Drawn on the
 * stage's own cells through a stepped ramp of the site's greens, so it stays pixel art.
 */
export type BlazeSpec = {
  /** The column of the fire's middle. */
  x: number;
  /** The row it is fed on. */
  base: number;
  w: number;
  h: number;
};

const LEVELS = 64;
/** Steps a second: also how many rows a second a tongue climbs. */
const STEP_MS = 1000 / 30;
/** Where each ink takes over, as a share of full heat. Cooler than the first is not drawn. */
const RAMP: readonly (readonly [number, string])[] = [
  [0.09, "#1a5c36"],
  [0.17, "#277d4a"],
  [0.3, "#03c652"],
  [0.5, "#00eb88"],
  [0.7, "#8df7c6"],
  [0.85, "#f5f5f5"],
];
const INKS: readonly (string | null)[] = Array.from({ length: LEVELS + 1 }, (_, level) => {
  let ink: string | null = null;
  for (const [from, hex] of RAMP) if (level / LEVELS >= from) ink = hex;
  return ink;
});

/** Rows in the cooling noise, before it repeats. */
const TILE_ROWS = 96;

/** Noise that wraps both ways, smooth across and smoother up, so what it carves stands tall. */
function coolingTile(w: number) {
  let tile = Float32Array.from({ length: w * TILE_ROWS }, () => Math.random());
  const blur = (dx: number, dy: number, radius: number) => {
    const next = new Float32Array(tile.length);
    for (let y = 0; y < TILE_ROWS; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let sum = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const ax = (x + k * dx + w) % w;
          const ay = (y + k * dy + TILE_ROWS) % TILE_ROWS;
          sum += tile[ay * w + ax]!;
        }
        next[y * w + x] = sum / (radius * 2 + 1);
      }
    }
    tile = next;
  };
  for (let pass = 0; pass < 2; pass += 1) {
    blur(1, 0, 1);
    blur(0, 1, 5);
  }
  let low = 1;
  let high = 0;
  for (const v of tile) {
    low = Math.min(low, v);
    high = Math.max(high, v);
  }
  return tile.map((v) => (v - low) / (high - low));
}

export class Blaze {
  private heat: Float32Array;
  private tile: Float32Array;
  private profile: Float32Array;
  private x0: number;
  private y0: number;
  private w: number;
  private h: number;
  private power: number;
  private growth: number;
  private cooling: number;
  private dying = false;
  private ticks = 0;
  private last = 0;

  constructor({ x, base, w, h }: BlazeSpec, growMs: number) {
    this.w = w;
    this.h = h;
    this.x0 = x - Math.floor(w / 2);
    this.y0 = base - h + 1;
    this.heat = new Float32Array(w * h);
    this.tile = coolingTile(w);
    this.profile = new Float32Array(w);
    for (let i = 0; i < w; i += 1) this.profile[i] = Math.sin((Math.PI * (i + 0.5)) / w) ** 0.8;
    this.cooling = LEVELS / (h * 0.88);
    this.power = growMs ? 0.25 : 1;
    this.growth = growMs ? (1 - this.power) / (growMs / STEP_MS) : 0;
    // A fire that starts lit has already been burning.
    if (!growMs) for (let i = 0; i < h * 2; i += 1) this.step();
  }

  /** Stops feeding it: what is lit climbs away and burns out. */
  die() {
    this.dying = true;
  }

  get out() {
    return this.dying && this.heat.every((level) => level < 1);
  }

  /** Where an ember leaves from, in cells: somewhere in the flame's upper half. */
  emberAt() {
    return {
      x: this.x0 + this.w * (0.28 + Math.random() * 0.44),
      y: this.y0 + this.h * (0.2 + Math.random() * 0.4),
    };
  }

  /** How many steps are due; the caller makes an ember's chance per step. */
  advance(now: number) {
    if (!this.last) this.last = now;
    const due = Math.min(4, Math.floor((now - this.last) / STEP_MS));
    if (due > 0) this.last += due * STEP_MS;
    for (let i = 0; i < due; i += 1) this.step();
    return this.dying ? 0 : due;
  }

  private step() {
    const { heat, tile, w, h, profile } = this;
    this.ticks += 1;
    const t = this.ticks;
    this.power = Math.min(1, this.power + this.growth);
    const bottom = (h - 1) * w;
    for (let x = 0; x < w; x += 1) {
      // Hot spots that wander along the bed, so the tongues never settle in one place.
      const wander = 0.88 + 0.12 * Math.sin(x * 0.37 + t * 0.09) * Math.sin(x * 0.11 - t * 0.04);
      const flicker = 0.95 + Math.random() * 0.05;
      heat[bottom + x] = this.dying ? 0 : LEVELS * this.power * profile[x]! * wander * flicker;
    }
    // A slow lean, the whole fire breathing to one side and back.
    const lean = Math.round(Math.sin(t * 0.023) * 3 + Math.sin(t * 0.061) * 2);
    const cool = this.cooling * (this.dying ? 2.4 : 1);
    const half = w / 2;
    for (let y = 0; y < h - 1; y += 1) {
      const below = (y + 1) * w;
      const twoBelow = y < h - 2 ? (y + 2) * w : below;
      const row = ((y + t) % TILE_ROWS) * w;
      for (let x = 0; x < w; x += 1) {
        const left = heat[below + Math.max(x - 1, 0)]!;
        const right = heat[below + Math.min(x + 1, w - 1)]!;
        const up = heat[y < h - 2 ? twoBelow + x : below + x]!;
        const average = (left + heat[below + x]! * 4 + right + up * 2) / 8;
        const n = tile[row + ((x + lean + w * 2) % w)]!;
        // Colder at the skin, which rounds the flame.
        const edge = Math.abs(x + 0.5 - half) / half;
        // The noise bites harder the higher it is: a solid body low down, torn tongues at the top,
        // and the last rows cold enough that a tip burns out before the grid can clip it.
        const rise = 1 - y / h;
        const carve = 3.4 * n * n * n * (0.25 + 1.1 * rise);
        const ceiling = y < h * 0.22 ? (1 - y / (h * 0.22)) * 4 : 0;
        const loss = cool * (0.14 + carve) + (edge > 0.5 ? (edge - 0.5) * 1.4 : 0) + ceiling;
        heat[y * w + x] = Math.max(0, average - loss);
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    cell: number,
    shakeX: number,
    shakeY: number,
    cols: number,
    rows: number,
  ) {
    const { heat, w, h, x0, y0 } = this;
    let last: string | null = null;
    for (let y = 0; y < h; y += 1) {
      const py = y0 + y + shakeY;
      if (py < 0 || py >= rows) continue;
      for (let x = 0; x < w; x += 1) {
        const ink = INKS[Math.floor(heat[y * w + x]!)];
        if (!ink) continue;
        const px = x0 + x + shakeX;
        if (px < 0 || px >= cols) continue;
        if (ink !== last) {
          ctx.fillStyle = ink;
          last = ink;
        }
        ctx.fillRect(px * cell, py * cell, cell, cell);
      }
    }
  }
}
