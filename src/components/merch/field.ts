/**
 * A signed distance field on a pixel grid, for drawing the sigil the way the style is drawn
 * by hand: strokes whose width swells and tapers to a needle, fused where they meet by a
 * smooth union (the melted, liquid-metal joins), with holes carved out by a smooth
 * subtraction. Strokes and holes are splatted segment by segment over their own bounding
 * boxes, so the cost is the ink, not the canvas.
 *
 * Units are the garment's (or the sleeve frame's); `ppu` is pixels per unit.
 */

export type Pt = readonly [number, number];
/** A centre line with a radius at each point. */
export type Stroke = { pts: Pt[]; r: number[] };
export type Hole = { c: Pt; rx: number; ry: number; angle: number };
export type Box = { x: number; y: number; w: number; h: number };

const FAR = 1e6;

/** Polynomial smooth minimum: a union whose seam is rounded over `k` units. */
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

export class Field {
  readonly cols: number;
  readonly rows: number;
  readonly d: Float32Array;

  constructor(
    readonly box: Box,
    readonly ppu: number,
  ) {
    this.cols = Math.ceil(box.w * ppu);
    this.rows = Math.ceil(box.h * ppu);
    this.d = new Float32Array(this.cols * this.rows).fill(FAR);
  }

  private range(x0: number, y0: number, x1: number, y1: number) {
    const { box, ppu } = this;
    return {
      c0: Math.max(0, Math.floor((x0 - box.x) * ppu)),
      c1: Math.min(this.cols - 1, Math.ceil((x1 - box.x) * ppu)),
      r0: Math.max(0, Math.floor((y0 - box.y) * ppu)),
      r1: Math.min(this.rows - 1, Math.ceil((y1 - box.y) * ppu)),
    };
  }

  /** Adds a stroke: the plain union of its own segments, smooth-unioned into the field. */
  stroke(s: Stroke, k: number) {
    const { pts, r } = s;
    if (pts.length < 2) return;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    pts.forEach(([x, y], i) => {
      const pad = r[i]! + k;
      x0 = Math.min(x0, x - pad);
      y0 = Math.min(y0, y - pad);
      x1 = Math.max(x1, x + pad);
      y1 = Math.max(y1, y + pad);
    });
    const R = this.range(x0, y0, x1, y1);
    if (R.c1 < R.c0 || R.r1 < R.r0) return;
    const w = R.c1 - R.c0 + 1;
    const local = new Float32Array(w * (R.r1 - R.r0 + 1)).fill(FAR);
    const { box, ppu } = this;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i]!;
      const [bx, by] = pts[i + 1]!;
      const ra = r[i]!;
      const rb = r[i + 1]!;
      const pad = Math.max(ra, rb) + k;
      const S = this.range(
        Math.min(ax, bx) - pad,
        Math.min(ay, by) - pad,
        Math.max(ax, bx) + pad,
        Math.max(ay, by) + pad,
      );
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy || 1e-9;
      for (let row = S.r0; row <= S.r1; row++) {
        const py = box.y + (row + 0.5) / ppu;
        for (let col = S.c0; col <= S.c1; col++) {
          const px = box.x + (col + 0.5) / ppu;
          let t = ((px - ax) * dx + (py - ay) * dy) / len2;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = px - ax - dx * t;
          const qy = py - ay - dy * t;
          const dist = Math.sqrt(qx * qx + qy * qy) - (ra + (rb - ra) * t);
          const li = (row - R.r0) * w + (col - R.c0);
          if (dist < local[li]!) local[li] = dist;
        }
      }
    }
    for (let row = R.r0; row <= R.r1; row++) {
      for (let col = R.c0; col <= R.c1; col++) {
        const v = local[(row - R.r0) * w + (col - R.c0)]!;
        if (v >= FAR) continue;
        const gi = row * this.cols + col;
        this.d[gi] = smin(this.d[gi]!, v, k);
      }
    }
  }

  /** Carves an elliptical hole, its rim rounded over `k` units. */
  hole(h: Hole, k: number) {
    const pad = Math.max(h.rx, h.ry) + k;
    const R = this.range(h.c[0] - pad, h.c[1] - pad, h.c[0] + pad, h.c[1] + pad);
    const cos = Math.cos(h.angle);
    const sin = Math.sin(h.angle);
    const m = Math.min(h.rx, h.ry);
    const { box, ppu } = this;
    for (let row = R.r0; row <= R.r1; row++) {
      const py = box.y + (row + 0.5) / ppu - h.c[1];
      for (let col = R.c0; col <= R.c1; col++) {
        const px = box.x + (col + 0.5) / ppu - h.c[0];
        const u = (px * cos + py * sin) / h.rx;
        const v = (-px * sin + py * cos) / h.ry;
        const e = (Math.sqrt(u * u + v * v) - 1) * m;
        const gi = row * this.cols + col;
        // Smooth max of the field and the hole's inside.
        this.d[gi] = -smin(-this.d[gi]!, e, k);
      }
    }
  }

  /**
   * The field as white-on-transparent masks: `fill` is the ink (solid, or an outline when
   * `outline` is set); `inline` is a thin line inset inside the thicker parts, the engraved
   * look, drawn in the second ink.
   */
  masks(opts: { outline: boolean; inline: boolean; mirror?: boolean }) {
    const { cols, rows, d, ppu } = this;
    const width = opts.mirror ? cols * 2 : cols;
    const fill = new Uint8ClampedArray(width * rows * 4);
    const inline = opts.inline ? new Uint8ClampedArray(width * rows * 4) : null;
    const lw = 0.75;
    const inset = 2.6;
    const put = (buf: Uint8ClampedArray, row: number, col: number, a: number) => {
      if (a <= 0) return;
      const v = Math.round(a * 255);
      const write = (c: number) => {
        const o = (row * width + c) * 4;
        buf[o] = 255;
        buf[o + 1] = 255;
        buf[o + 2] = 255;
        buf[o + 3] = v;
      };
      write(col);
      if (opts.mirror) write(width - 1 - col);
    };
    const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const v = d[row * cols + col]!;
        if (v > 3) continue;
        const a = opts.outline ? clamp(0.5 - (Math.abs(v) - lw) * ppu) : clamp(0.5 - v * ppu);
        if (inline) {
          const line =
            clamp(0.5 - (Math.abs(v + inset) - lw * 0.7) * ppu) * clamp((-v - inset * 0.6) * ppu);
          put(fill, row, col, a * (1 - line));
          put(inline, row, col, line);
        } else {
          put(fill, row, col, a);
        }
      }
    }
    return { fill, inline, width, height: rows };
  }
}

/** RGBA bytes to a PNG data URL (data URLs survive the PNG export's serialisation). */
export function toDataUrl(rgba: Uint8ClampedArray, width: number, height: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
  return canvas.toDataURL("image/png");
}
