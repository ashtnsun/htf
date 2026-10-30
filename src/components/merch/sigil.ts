/**
 * The cybersigil generator for the /merch hoodie: thorned vines, crescent blades, concave
 * four-point sparkles, curled tendrils, beaded chains and a symmetric spine ornament, all
 * built as filled outlines (tapered strokes that end in points) so they print as one ink.
 * Deterministic: the same seed and options always draw the same piece.
 *
 * Coordinates are plain SVG user units. The sleeve piece is drawn in the sleeve's own frame
 * (x across the sleeve, y down it from the armhole seam); the back piece in the garment's
 * frame, left half only, mirrored about the centre line by the renderer.
 */

export type Pt = readonly [number, number];

/** What a shape is, so the renderer can give it the primary or the accent ink. */
export type SigilRole = "vine" | "ornament";
export type SigilPath = { d: string; role: SigilRole };

export type SigilOptions = {
  seed: number;
  /** 0..1: how many thorns, curls and ornaments. */
  density: number;
  /** 0..1: how long and sharp the thorns are. */
  thorns: number;
  /** 0..1: line weight. */
  weight: number;
  crescents: boolean;
  sparkles: boolean;
  curls: boolean;
  chains: boolean;
};

/** mulberry32: a small seeded generator, so a design is reproducible from its seed. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = ReturnType<typeof rng>;
const between = (r: Rand, a: number, b: number) => a + (b - a) * r();
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom through the control points, sampled evenly per segment. */
export function spline(ctrl: readonly Pt[], perSeg = 18): Pt[] {
  const out: Pt[] = [];
  const n = ctrl.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = ctrl[Math.max(i - 1, 0)]!;
    const p1 = ctrl[i]!;
    const p2 = ctrl[i + 1]!;
    const p3 = ctrl[Math.min(i + 2, n - 1)]!;
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(ctrl[n - 1]!);
  return out;
}

/** Unit tangent and left normal at each sample. */
function frames(pts: readonly Pt[]) {
  return pts.map((_, i) => {
    const a = pts[Math.max(i - 1, 0)]!;
    const b = pts[Math.min(i + 1, pts.length - 1)]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const t: Pt = [dx / len, dy / len];
    const n: Pt = [-t[1], t[0]];
    return { t, n };
  });
}

function arcLengths(pts: readonly Pt[]) {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) {
    acc.push(acc[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  }
  const total = acc[acc.length - 1] || 1;
  return acc.map((v) => v / total);
}

/**
 * A filled outline around a centre line whose width follows `width(t)`. `bias` pushes the
 * width to one side: 0 centred, 1 all to the left of the direction of travel (a crescent's
 * inner edge stays on the line).
 */
export function taper(pts: readonly Pt[], width: (t: number) => number, bias = 0): string {
  const f = frames(pts);
  const ts = arcLengths(pts);
  const left: string[] = [];
  const right: string[] = [];
  pts.forEach((p, i) => {
    const w = Math.max(width(ts[i]!), 0);
    const { n } = f[i]!;
    const wl = (w * (1 + bias)) / 2;
    const wr = (w * (1 - bias)) / 2;
    left.push(`${r1(p[0] + n[0] * wl)} ${r1(p[1] + n[1] * wl)}`);
    right.push(`${r1(p[0] - n[0] * wr)} ${r1(p[1] - n[1] * wr)}`);
  });
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}

/** Width profiles. */
const pointed =
  (w: number, p = 0.6) =>
  (t: number) =>
    w * Math.pow(Math.sin(Math.PI * t), p);
const tail =
  (w: number, p = 0.9) =>
  (t: number) =>
    w * Math.pow(1 - t, p);

/** Concave four-point star, the long axis vertical; `diag` adds four short diagonal rays. */
export function sparkle(cx: number, cy: number, h: number, w: number, diag = false): string {
  const k = Math.min(w, h) * 0.13;
  const star = (x: number, y: number, hh: number, ww: number, kk: number) =>
    `M${r1(x)} ${r1(y - hh)}Q${r1(x + kk)} ${r1(y - kk)} ${r1(x + ww)} ${r1(y)}` +
    `Q${r1(x + kk)} ${r1(y + kk)} ${r1(x)} ${r1(y + hh)}Q${r1(x - kk)} ${r1(y + kk)} ${r1(x - ww)} ${r1(y)}` +
    `Q${r1(x - kk)} ${r1(y - kk)} ${r1(x)} ${r1(y - hh)}Z`;
  let d = star(cx, cy, h, w, k);
  if (diag) {
    const s = Math.min(w, h) * 0.38;
    const q = s * 0.16;
    const rays: Pt[] = [
      [s, s],
      [-s, s],
      [s, -s],
      [-s, -s],
    ];
    for (const [dx, dy] of rays) {
      d += `M${r1(cx + dx)} ${r1(cy + dy)}L${r1(cx + q)} ${r1(cy)}L${r1(cx)} ${r1(cy + q * Math.sign(dy))}Z`;
      d += `M${r1(cx + dx)} ${r1(cy + dy)}L${r1(cx)} ${r1(cy - q)}L${r1(cx - q)} ${r1(cy)}Z`;
    }
  }
  return d;
}

function dot(cx: number, cy: number, r: number): string {
  return `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
}

/** A ring with spikes radiating from it, long and short in turn. */
export function sun(cx: number, cy: number, r: number, rays: number, base: number): string {
  const ri = r * 0.62;
  let d = dot(cx, cy, r);
  // The hole, wound the other way so it stays open under the nonzero rule.
  d += `M${r1(cx - ri)} ${r1(cy)}a${r1(ri)} ${r1(ri)} 0 1 1 ${r1(2 * ri)} 0a${r1(ri)} ${r1(ri)} 0 1 1 ${r1(-2 * ri)} 0Z`;
  d += dot(cx, cy, r * 0.28);
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 - Math.PI / 2;
    const len = r * (i % 2 ? 0.9 : 1.9);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const bx = cx + ca * r * 0.95;
    const by = cy + sa * r * 0.95;
    d += `M${r1(bx - sa * base)} ${r1(by + ca * base)}L${r1(cx + ca * (r + len))} ${r1(cy + sa * (r + len))}L${r1(bx + sa * base)} ${r1(by - ca * base)}Z`;
  }
  return d;
}

/** A straight line of beads hanging from `p`, the beads alternating in size. */
function drop(p: Pt, length: number, bead: number, out: SigilPath[]) {
  const n = Math.max(3, Math.round(length / (bead * 3.6)));
  for (let i = 1; i <= n; i++) {
    out.push({
      d: dot(p[0], p[1] + (length * i) / n, i % 2 ? bead : bead * 1.45),
      role: "ornament",
    });
  }
}

/** A curved spike growing from `p` in direction `dir` (unit), bending by `bend` radians. */
function spike(p: Pt, dir: Pt, len: number, base: number, bend: number): string {
  const pts: Pt[] = [];
  let [x, y] = p;
  let a = Math.atan2(dir[1], dir[0]);
  const steps = 9;
  pts.push([x, y]);
  for (let i = 1; i <= steps; i++) {
    a += bend / steps;
    x += (Math.cos(a) * len) / steps;
    y += (Math.sin(a) * len) / steps;
    pts.push([x, y]);
  }
  return taper(pts, tail(base, 1.1));
}

/** A spiral tendril that leaves `p` heading along `dir` and winds in on itself. */
function curl(p: Pt, dir: Pt, size: number, turn: 1 | -1, base: number): string {
  const pts: Pt[] = [];
  let a = Math.atan2(dir[1], dir[0]);
  let [x, y] = p;
  const steps = 34;
  let step = (size * 2.4) / steps;
  pts.push([x, y]);
  for (let i = 0; i < steps; i++) {
    a += (turn * (Math.PI * 1.9)) / steps + turn * i * 0.012;
    step *= 0.955;
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    pts.push([x, y]);
  }
  return taper(pts, tail(base, 0.8));
}

/** A crescent blade: an arc whose width swells in the middle and ends in two points. */
function crescent(c: Pt, r: number, a0: number, sweep: number, thick: number): string {
  const pts: Pt[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (sweep * i) / steps;
    pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
  }
  // Travelling clockwise in screen space the left normal points outward.
  return taper(pts, pointed(thick, 0.85), sweep > 0 ? -1 : 1);
}

/**
 * A thorned vine along `pts`: the stem, thorns on alternating sides that sweep back along
 * the growth, now and then a curl, a sparkle at a node or a beaded chain hanging off it.
 */
function vine(
  r: Rand,
  o: SigilOptions,
  pts: readonly Pt[],
  stem: (t: number) => number,
  scale: number,
  out: SigilPath[],
) {
  out.push({ d: taper(pts, stem), role: "vine" });
  const f = frames(pts);
  const ts = arcLengths(pts);
  const count = Math.round(6 + o.density * 16);
  let side = r() < 0.5 ? 1 : -1;
  for (let k = 0; k < count; k++) {
    const target = (k + 0.5 + between(r, -0.3, 0.3)) / count;
    const i = Math.max(
      1,
      ts.findIndex((t) => t >= target),
    );
    const p = pts[i]!;
    const { t, n } = f[i]!;
    const env = 0.45 + 0.55 * Math.sin(Math.PI * ts[i]!);
    const w = stem(ts[i]!);
    if (r() < 0.78) side = -side;
    const back = between(r, 0.35, 0.95);
    const dir: Pt = [
      n[0] * side * Math.cos(back) - t[0] * Math.sin(back) * -1,
      n[1] * side * Math.cos(back) - t[1] * Math.sin(back) * -1,
    ];
    const len = scale * (0.25 + o.thorns * 0.75) * between(r, 0.6, 1.25) * env;
    const roll = r();
    if (o.curls && roll < 0.12 + o.density * 0.12) {
      out.push({ d: curl(p, dir, len * 0.75, side > 0 ? -1 : 1, w * 0.8), role: "vine" });
    } else {
      out.push({
        d: spike(p, dir, len, Math.max(w * 0.9, 2.2), side * between(r, 0.15, 0.6)),
        role: "vine",
      });
      if (roll > 0.86) {
        // A forked thorn: a second, shorter spike from the same node.
        const d2: Pt = [dir[0] * 0.8 + t[0] * 0.6, dir[1] * 0.8 + t[1] * 0.6];
        const l2 = Math.hypot(d2[0], d2[1]);
        out.push({
          d: spike(p, [d2[0] / l2, d2[1] / l2], len * 0.6, Math.max(w * 0.6, 1.8), -side * 0.4),
          role: "vine",
        });
      }
    }
    if (o.sparkles && r() < 0.1 + o.density * 0.1) {
      const sp = scale * between(r, 0.18, 0.32);
      const off = len * 0.9;
      out.push({
        d: sparkle(p[0] + dir[0] * off, p[1] + dir[1] * off, sp, sp * 0.42, r() < 0.4),
        role: "ornament",
      });
    }
  }
  if (o.chains && r() < 0.5 + o.density * 0.5) {
    // A beaded chain slung from one node of the vine to another.
    const a = Math.floor(between(r, 0.15, 0.45) * (pts.length - 1));
    const b = Math.floor(between(r, 0.55, 0.85) * (pts.length - 1));
    const pa = pts[a]!;
    const pb = pts[b]!;
    const sag = scale * between(r, 0.5, 1.1) * (r() < 0.5 ? 1 : -1);
    const mid: Pt = [
      (pa[0] + pb[0]) / 2 + f[a]!.n[0] * sag,
      (pa[1] + pb[1]) / 2 + f[a]!.n[1] * sag,
    ];
    const chain = spline([pa, mid, pb], 40);
    const ct = arcLengths(chain);
    const bead = Math.max(1.6, scale * 0.045);
    let next = 0;
    let big = false;
    chain.forEach((p, i) => {
      if (ct[i]! >= next) {
        out.push({ d: dot(p[0], p[1], big ? bead * 1.5 : bead), role: "ornament" });
        big = !big;
        next += 0.045;
      }
    });
  }
}

/**
 * The symmetric spine: a shaft with stations along it (concave lozenges, lenses, upturned
 * barbs, crossbars, hooked crescents), pointed at both ends, a sparkle on top.
 */
export function spine(
  r: Rand,
  o: SigilOptions,
  x: number,
  y0: number,
  y1: number,
  s: number,
): SigilPath[] {
  const out: SigilPath[] = [];
  const top = y0 - s * 0.9;
  const bottom = y1 + s * 1.3;
  out.push({
    d: taper(
      spline([
        [x, top],
        [x, (top + bottom) / 2],
        [x, bottom],
      ]),
      pointed(s * (0.1 + o.weight * 0.1), 0.35),
    ),
    role: "ornament",
  });
  const stations = Math.round(3 + o.density * 3);
  for (let k = 0; k < stations; k++) {
    const y = y0 + ((y1 - y0) * (k + between(r, 0.2, 0.8))) / stations;
    const pick = Math.floor(r() * 7);
    const size = s * between(r, 0.5, 1);
    if (pick === 0) {
      out.push({ d: sparkle(x, y, size * 0.8, size * 0.42), role: "ornament" });
    } else if (pick === 1) {
      const lens: Pt[] = [
        [x, y - size * 0.7],
        [x, y + size * 0.7],
      ];
      out.push({ d: taper(spline(lens, 20), pointed(size * 0.45, 0.9)), role: "ornament" });
    } else if (pick === 2) {
      for (const side of [1, -1]) {
        out.push({
          d: spike(
            [x, y],
            [side * 0.94, -0.34],
            size * between(r, 0.9, 1.4),
            s * 0.12,
            -side * 0.9,
          ),
          role: "ornament",
        });
      }
    } else if (pick === 3) {
      out.push({
        d: taper(
          [
            [x - size * 1.1, y],
            [x, y],
            [x + size * 1.1, y],
          ],
          pointed(s * 0.12, 0.5),
        ),
        role: "ornament",
      });
      out.push({ d: sparkle(x, y, size * 0.35, size * 0.35), role: "ornament" });
    } else if (pick === 5) {
      // A sword cross: a long crossbar pointed at both ends, a sparkle at each tip.
      const reach = size * between(r, 1.6, 2.4);
      out.push({
        d: taper(
          [
            [x - reach, y],
            [x, y],
            [x + reach, y],
          ],
          pointed(s * 0.16, 0.3),
        ),
        role: "ornament",
      });
      if (o.sparkles) {
        for (const side of [1, -1]) {
          out.push({ d: sparkle(x + side * reach, y, size * 0.32, size * 0.16), role: "ornament" });
        }
      }
    } else if (pick === 6) {
      out.push({ d: sun(x, y, size * 0.32, 14, s * 0.06), role: "ornament" });
    } else {
      for (const side of [1, -1]) {
        out.push({
          d: crescent(
            [x + side * size * 0.15, y],
            size * 0.55,
            side > 0 ? -Math.PI * 0.55 : Math.PI * 1.55,
            side > 0 ? Math.PI * 1.1 : -Math.PI * 1.1,
            s * 0.14,
          ),
          role: "ornament",
        });
      }
    }
  }
  if (o.sparkles)
    out.push({ d: sparkle(x, top - s * 0.2, s * 0.9, s * 0.36, true), role: "ornament" });
  return out;
}

/** The sleeve piece, in the sleeve's frame: `length` down the sleeve, `width` across it. */
export function sleeveSigil(
  o: SigilOptions,
  length: number,
  width: number,
  from: number,
  to: number,
): SigilPath[] {
  const r = rng(o.seed * 7919 + 17);
  const out: SigilPath[] = [];
  const y0 = from * length;
  const y1 = to * length;
  const stemW = 3 + o.weight * 6;
  const sway = width * 0.3;
  const ctrl: Pt[] = [[0, y0 - 8]];
  const nodes = 5;
  let dir = r() < 0.5 ? 1 : -1;
  for (let i = 1; i <= nodes; i++) {
    dir = -dir;
    ctrl.push([
      dir * sway * between(r, 0.4, 1),
      y0 + ((y1 - y0) * i) / nodes - (i === nodes ? 0 : between(r, -12, 12)),
    ]);
  }
  const pts = spline(ctrl);
  // Full width at the seam so it meets the back piece, a point at the cuff end.
  vine(
    r,
    o,
    pts,
    (t) => stemW * (t < 0.08 ? 0.85 + t * 1.8 : Math.pow(1 - (t - 0.08) / 0.92, 0.7)),
    width * 0.55,
    out,
  );

  if (o.density > 0.35) {
    // A thinner second stem twisting around the first.
    const ctrl2: Pt[] = ctrl.map(([x, y], i) => [-x * 0.8 + (i % 2 ? 6 : -6), y + 14]);
    const pts2 = spline(ctrl2.slice(1));
    vine(
      r,
      { ...o, density: o.density * 0.5, chains: false },
      pts2,
      pointed(stemW * 0.55, 0.5),
      width * 0.3,
      out,
    );
  }
  if (o.crescents) {
    const at = pts[Math.floor(pts.length * between(r, 0.3, 0.55))]!;
    const side = at[0] > 0 ? -1 : 1;
    const rad = width * between(r, 0.4, 0.52);
    out.push({
      d: crescent(
        [at[0] + side * rad * 0.35, at[1]],
        rad,
        side > 0 ? Math.PI * 0.6 : Math.PI * 0.4,
        side > 0 ? Math.PI * 1.25 : -Math.PI * 1.25,
        stemW * 1.6,
      ),
      role: "vine",
    });
  }
  // A short spine on the forearm, crossing the vine.
  const sy0 = y0 + (y1 - y0) * 0.58;
  out.push(
    ...spine(
      r,
      o,
      between(r, -width * 0.12, width * 0.12),
      sy0,
      sy0 + (y1 - y0) * 0.22,
      width * 0.2,
    ),
  );
  if (o.chains) {
    // A bead chain hanging straight down from a node, as in the outlined pieces.
    const at = pts[Math.floor(pts.length * between(r, 0.25, 0.5))]!;
    drop(
      [at[0] + (at[0] > 0 ? -width * 0.08 : width * 0.08), at[1]],
      (y1 - y0) * between(r, 0.14, 0.22),
      Math.max(1.6, width * 0.018),
      out,
    );
  }
  if (o.sparkles) {
    for (let i = 0; i < 2 + Math.round(o.density * 3); i++) {
      const h = width * between(r, 0.08, 0.16);
      out.push({
        d: sparkle(
          between(r, -width * 0.36, width * 0.36),
          between(r, y0 + 30, y1 - 20),
          h,
          h * 0.4,
          r() < 0.3,
        ),
        role: "ornament",
      });
    }
  }
  return out;
}

/**
 * The back piece, left half: a thorned garland from the left sleeve's seam (`anchor`) that
 * dips below the hood to the centre line (`cx`, `low`), and, with `withSpine`, a spine hanging
 * from the centre. The renderer draws the half twice, the second mirrored about `cx`; the
 * spine is already symmetric and returned separately.
 */
export function backSigil(
  o: SigilOptions,
  anchor: Pt,
  cx: number,
  low: number,
  withGarland: boolean,
  spineLength: number,
  /** Leave the centre free for the pixel dino. */
  centreFree = false,
): { half: SigilPath[]; centre: SigilPath[] } {
  const r = rng(o.seed * 104729 + 3);
  const half: SigilPath[] = [];
  const centre: SigilPath[] = [];
  const stemW = 3 + o.weight * 6;
  if (withGarland) {
    const [ax, ay] = anchor;
    const span = cx - ax;
    const ctrl: Pt[] = [
      [ax, ay],
      [ax + span * 0.25, ay + (low - ay) * between(r, 0.42, 0.55)],
      [ax + span * 0.58, low - between(r, 4, 22)],
      [cx - span * 0.16, low + between(r, -6, 4)],
      [cx, low],
    ];
    const pts = spline(ctrl);
    vine(
      r,
      { ...o, chains: false },
      pts,
      (t) => stemW * (0.85 + 0.25 * Math.sin(Math.PI * t)),
      span * 0.22,
      half,
    );
    if (o.chains) {
      // The beaded swag under the garland, like a chain across the shoulders.
      const chain = spline(
        [
          [ax + span * 0.12, ay + 30],
          [ax + span * 0.55, low + 44],
          [cx, low + 58],
        ],
        30,
      );
      const ct = arcLengths(chain);
      let next = 0;
      let big = false;
      chain.forEach((p, i) => {
        if (ct[i]! >= next) {
          half.push({ d: dot(p[0], p[1], big ? 3.6 : 2.2), role: "ornament" });
          big = !big;
          next += 0.032;
        }
      });
    }
    if (o.crescents) {
      const at = pts[Math.floor(pts.length * 0.62)]!;
      half.push({
        d: crescent(
          [at[0] + 6, at[1] + 34],
          span * 0.2,
          Math.PI * 0.95,
          Math.PI * 1.15,
          stemW * 1.8,
        ),
        role: "vine",
      });
    }
    if (o.sparkles) {
      const at = pts[Math.floor(pts.length * between(r, 0.25, 0.45))]!;
      const h = span * 0.09;
      half.push({
        d: sparkle(at[0] + between(r, -10, 10), at[1] - h * 1.4, h, h * 0.4, true),
        role: "ornament",
      });
    }
  }
  if (spineLength > 0) {
    centre.push(...spine(r, o, cx, low + (centreFree ? 60 : 28), low + spineLength, 30));
  }
  if (withGarland && o.sparkles && !centreFree)
    centre.push({ d: sparkle(cx, low, 34, 16, true), role: "ornament" });
  return { half, centre };
}
