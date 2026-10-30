import { Field, toDataUrl, type Box, type Hole, type Pt, type Stroke } from "./field";

/**
 * The cybersigil generator for the /merch hoodie, written in the style's own vocabulary
 * rather than as scattered clip-art: a vertebral spine of holed beads with paired claws,
 * long claw ribs fanning out and down like wings, arms of braided lattice with barbs that
 * all sweep one way, and needle tips with a crossbar. Everything is drawn into a distance
 * field (`field.ts`), so strokes swell, taper to needles and fuse where they meet.
 *
 * The back piece is drawn as its left half and mirrored about the centre line; its arms end
 * at each sleeve's armhole seam, where the sleeve piece starts at the same width, so the two
 * read as one line from cuff to cuff.
 */

export type SigilOptions = {
  seed: number;
  /** 0..1: how many barbs, vertebrae and ribs. */
  density: number;
  /** 0..1: how long the barbs and claws reach. */
  thorns: number;
  /** 0..1: line weight. */
  weight: number;
  ribs: boolean;
  lattice: boolean;
  beads: boolean;
  needles: boolean;
};

export type LineStyle = "solid" | "inline" | "outline";
export type BackLayout = "none" | "arms" | "arms-spine" | "full";

/** A rendered piece: white masks (the ink and the inline) placed over `box`. */
export type ArtPiece = { box: Box; fill: string; inline: string | null };

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

/** Catmull-Rom through the control points. */
function spline(ctrl: readonly Pt[], perSeg = 14): Pt[] {
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

/** Arc-length position (0..1) and length, unit tangent and left normal at each point. */
function frames(pts: readonly Pt[]) {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) {
    acc.push(acc[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]));
  }
  const total = acc[acc.length - 1] || 1;
  return pts.map((_, i) => {
    const a = pts[Math.max(i - 1, 0)]!;
    const b = pts[Math.min(i + 1, pts.length - 1)]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t: Pt = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    return { s: acc[i]! / total, len: acc[i]!, t, n: [-t[1], t[0]] as Pt };
  });
}

/** Swells just past the base, then thins to a needle. */
const clawProfile = (w: number) => (t: number) =>
  w * Math.pow(1 - t, 1.2) * (1 + 0.55 * Math.sin(Math.PI * Math.min(t * 1.7, 1)));
/** Pointed at both ends. */
const lensProfile = (w: number) => (t: number) => w * Math.pow(Math.sin(Math.PI * t), 0.75);

function curve(ctrl: readonly Pt[], profile: (t: number) => number, per = 14): Stroke {
  const pts = spline(ctrl, per);
  return { pts, r: frames(pts).map((x) => profile(x.s)) };
}

/** A claw: from `p` at `angle`, curling by `bend` radians, most of it near the tip. */
function claw(p: Pt, angle: number, len: number, w: number, bend: number): Stroke {
  const pts: Pt[] = [p];
  let [x, y] = p;
  let a = angle;
  const steps = 16;
  for (let i = 1; i <= steps; i++) {
    a += (bend * 2 * i) / (steps * (steps + 1));
    x += (Math.cos(a) * len) / steps;
    y += (Math.sin(a) * len) / steps;
    pts.push([x, y]);
  }
  const prof = clawProfile(w);
  return { pts, r: pts.map((_, i) => prof(i / steps)) };
}

type Sink = { strokes: Stroke[]; holes: Hole[] };

/**
 * Barbs along a centre line, leaning toward the direction of travel by `sweep` and hooking
 * further that way: even rhythm, a major and a minor barb in turn, the sides alternating
 * (or one `side`), the length on an envelope, so the line reads as grown, not scattered.
 */
function barbs(
  r: Rand,
  pts: readonly Pt[],
  opts: {
    count: number;
    len: number;
    w: number;
    sweep: number;
    hook: number;
    side?: 1 | -1;
    from?: number;
    to?: number;
  },
  out: Sink,
) {
  const f = frames(pts);
  const from = opts.from ?? 0.06;
  const to = opts.to ?? 0.94;
  let side: 1 | -1 = opts.side ?? (r() < 0.5 ? 1 : -1);
  for (let k = 0; k < opts.count; k++) {
    const target = from + ((to - from) * (k + 0.5)) / opts.count;
    const i = f.findIndex((x) => x.s >= target);
    if (i < 0) continue;
    const { t, n, s } = f[i]!;
    const env = 0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, Math.max(0, (s - from) / (to - from))));
    const minor = k % 2 === 1;
    const lean = opts.sweep * between(r, 0.85, 1.15);
    const dir: Pt = [
      n[0] * side * Math.cos(lean) + t[0] * Math.sin(lean),
      n[1] * side * Math.cos(lean) + t[1] * Math.sin(lean),
    ];
    const len = opts.len * env * (minor ? 0.55 : 1) * between(r, 0.85, 1.12);
    out.strokes.push(
      claw(
        pts[i]!,
        Math.atan2(dir[1], dir[0]),
        len,
        opts.w * (minor ? 0.75 : 1),
        -side * opts.hook,
      ),
    );
    if (!opts.side) side = side === 1 ? -1 : 1;
  }
}

/**
 * A braided arm: two strands weaving around the centre line, crossing every half wavelength
 * and leaving open cells between, with a holed bead where they cross.
 */
function braid(
  pts: readonly Pt[],
  amp: (s: number) => number,
  wave: number,
  w: (s: number) => number,
  beads: boolean,
  out: Sink,
) {
  const f = frames(pts);
  for (const phase of [0, Math.PI]) {
    const strand: Pt[] = [];
    f.forEach((x, i) => {
      const o = amp(x.s) * Math.sin((x.len / wave) * Math.PI * 2 + phase);
      strand.push([pts[i]![0] + x.n[0] * o, pts[i]![1] + x.n[1] * o]);
    });
    out.strokes.push({
      pts: strand,
      r: f.map((x) => w(x.s) * (0.55 + 0.75 * Math.abs(Math.cos((x.len / wave) * Math.PI * 2)))),
    });
  }
  if (!beads) return;
  const total = f[f.length - 1]!.len;
  for (let at = wave / 2; at < total - wave * 0.4; at += wave / 2) {
    const i = f.findIndex((x) => x.len >= at);
    if (i < 0) break;
    const { t, s } = f[i]!;
    const p = pts[i]!;
    const half = wave * 0.2;
    const bw = w(s) * 1.9;
    if (bw < 1.2) continue;
    out.strokes.push(
      curve(
        [[p[0] - t[0] * half, p[1] - t[1] * half], p, [p[0] + t[0] * half, p[1] + t[1] * half]],
        lensProfile(bw),
        6,
      ),
    );
    out.holes.push({ c: p, rx: half * 0.42, ry: bw * 0.32, angle: Math.atan2(t[1], t[0]) });
  }
}

/** A run of vertebrae down a vertical line: holed beads, claws curling out and down, a hook
 * curling up every other one, shrinking toward the end. `half` draws the left side only
 * (the mirror makes the pairs). */
function vertebrae(
  r: Rand,
  o: SigilOptions,
  x: number,
  y0: number,
  y1: number,
  size: number,
  out: Sink,
  half: boolean,
) {
  const n = Math.round(6 + o.density * 8);
  const reach = 0.5 + o.thorns * 0.9;
  const step0 = ((y1 - y0) / n) * 1.25;
  out.strokes.push(
    curve(
      [
        [x, y0 - size * 1.4],
        [x, (y0 + y1) / 2],
        [x, y1 + size * 2],
      ],
      (t) => size * 0.34 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.1)), 0.4) + 0.3,
      10,
    ),
  );
  let y = y0;
  for (let i = 0; i < n && y < y1; i++) {
    const k = 1 - (0.5 * i) / n;
    const sc = size * k;
    const step = step0 * k;
    if (o.beads) {
      out.strokes.push(
        curve(
          [
            [x, y - step * 0.36],
            [x, y],
            [x, y + step * 0.36],
          ],
          lensProfile(sc * 0.95),
          6,
        ),
      );
      out.holes.push({ c: [x, y], rx: sc * 0.28, ry: step * 0.15, angle: 0 });
    }
    for (const sd of half ? [-1] : [-1, 1]) {
      const tilt = between(r, 0.15, 0.45);
      const ang = sd < 0 ? Math.PI - tilt : tilt;
      out.strokes.push(
        claw(
          [x + sd * sc * 0.3, y],
          ang,
          sc * reach * between(r, 2.4, 3.6),
          sc * 0.42,
          sd < 0 ? -0.9 : 0.9,
        ),
      );
      if (i % 2 === 0) {
        out.strokes.push(
          claw(
            [x + sd * sc * 0.2, y - step * 0.2],
            sd < 0 ? Math.PI + 0.5 : -0.5,
            sc * reach * 1.3,
            sc * 0.3,
            sd < 0 ? 1.1 : -1.1,
          ),
        );
      }
    }
    y += step;
  }
  if (o.needles) needle(x, y1 + size * 2.4, size, out, half);
}

/** A needle point with a crossbar. */
function needle(x: number, y: number, size: number, out: Sink, half: boolean) {
  out.strokes.push(
    curve(
      [
        [x, y - size * 1.6],
        [x, y + size * 1.4],
        [x, y + size * 4.5],
      ],
      lensProfile(size * 0.42),
      10,
    ),
  );
  const bar = size * 1.7;
  out.strokes.push(
    curve(
      half
        ? [
            [x - bar, y],
            [x - bar * 0.5, y],
            [x, y],
          ]
        : [
            [x - bar, y],
            [x, y],
            [x + bar, y],
          ],
      (t) => size * 0.26 * Math.pow(Math.sin(Math.PI * (half ? t / 2 : t)), 0.55) + 0.2,
      8,
    ),
  );
}

/** Draws the strokes and holes into a field and returns the masks as data URLs. */
function render(box: Box, ppu: number, sink: Sink, line: LineStyle, mirror = false): ArtPiece {
  const field = new Field(box, ppu);
  for (const s of sink.strokes) field.stroke(s, 3.2);
  for (const h of sink.holes) field.hole(h, 1.2);
  const m = field.masks({ outline: line === "outline", inline: line === "inline", mirror });
  return {
    box: mirror ? { ...box, w: box.w * 2 } : box,
    fill: toDataUrl(m.fill, m.width, m.height),
    inline: m.inline ? toDataUrl(m.inline, m.width, m.height) : null,
  };
}

/** The sleeve piece, in the sleeve's frame: x across it, y down it from the armhole seam. */
export function sleevePiece(
  o: SigilOptions,
  line: LineStyle,
  length: number,
  width: number,
  from: number,
  to: number,
  ppu = 1,
): ArtPiece {
  const r = rng(o.seed * 7919 + 17);
  const sink: Sink = { strokes: [], holes: [] };
  const wk = 0.7 + o.weight * 0.8;
  const y0 = from * length;
  const y1 = to * length;
  const sway = width * between(r, 0.08, 0.16);
  const flip = r() < 0.5 ? 1 : -1;
  const pts = spline([
    [0, y0 - 14],
    [flip * sway, y0 + (y1 - y0) * 0.3],
    [-flip * sway * 0.7, y0 + (y1 - y0) * 0.62],
    [flip * sway * 0.3, y1 - 8],
  ]);
  const w = (s: number) => wk * 2.6 * (s < 0.85 ? 1 : Math.max(0, 1 - (s - 0.85) / 0.2)) + 0.3;
  if (o.lattice) {
    braid(
      pts,
      (s) => width * 0.07 * (0.7 + 0.3 * Math.sin(Math.PI * s)),
      width * 0.42,
      w,
      o.beads,
      sink,
    );
  } else {
    sink.strokes.push({ pts, r: frames(pts).map((x) => w(x.s) * 1.4) });
  }
  barbs(
    r,
    pts,
    {
      count: Math.round(8 + o.density * 12),
      len: width * (0.18 + o.thorns * 0.32),
      w: wk * 2.3,
      sweep: 0.75,
      hook: 0.9,
      from: 0.04,
      to: 0.8,
    },
    sink,
  );
  if (o.ribs) {
    // Long claws sweeping down the sleeve beside the line, like the ribs of a wing.
    for (const sd of [1, -1] as const) {
      const at = pts[Math.floor(pts.length * between(r, 0.12, 0.22))]!;
      sink.strokes.push(
        claw(at, Math.PI / 2 - sd * 0.55, (y1 - y0) * between(r, 0.38, 0.5), wk * 3.2, sd * 0.85),
      );
    }
  }
  // A short run of vertebrae on the forearm.
  const vy = y0 + (y1 - y0) * 0.6;
  const vp = pts.find((p) => p[1] >= vy) ?? pts[pts.length - 1]!;
  vertebrae(
    r,
    { ...o, density: o.density * 0.45, needles: false },
    vp[0],
    vy,
    vy + (y1 - y0) * 0.18,
    width * 0.075 * wk,
    sink,
    false,
  );
  if (o.needles) needle(pts[pts.length - 1]![0], y1 - 30, width * 0.07 * wk, sink, false);
  return render(
    { x: -width / 2 - 14, y: -16, w: width + 28, h: length + 24 },
    2.5 * ppu,
    sink,
    line,
  );
}

/**
 * The back piece, left half (mirrored about `cx`): arms from the centre to each sleeve's
 * seam (`anchor`) with barbs hanging from them, then optionally the spine down the centre
 * and claw ribs fanning out from it like wings. `top` is just under the hood.
 */
export function backPiece(
  o: SigilOptions,
  line: LineStyle,
  layout: Exclude<BackLayout, "none">,
  anchor: Pt,
  cx: number,
  top: number,
  bottom: number,
  /** Clear a space at the centre for the pixel dino. */
  clearHub = false,
  ppu = 1,
): ArtPiece {
  const r = rng(o.seed * 104729 + 3);
  const sink: Sink = { strokes: [], holes: [] };
  const wk = 0.7 + o.weight * 0.8;
  const [ax, ay] = anchor;
  const span = cx - ax;
  const hubY = top + 40;
  const arm = spline([
    [ax - 6, ay - 4],
    [ax + span * 0.22, ay + between(r, 34, 50)],
    [ax + span * 0.55, top + between(r, 4, 22)],
    [cx - span * 0.14, hubY - 4],
    [cx + 2, hubY],
  ]);
  const w = (s: number) => wk * 2.6 * (0.9 + 0.3 * s) + 0.3;
  if (o.lattice) {
    braid(arm, (s) => 9 * (0.75 + 0.25 * Math.sin(Math.PI * s)), 56, w, o.beads, sink);
  } else {
    sink.strokes.push({ pts: arm, r: frames(arm).map((x) => w(x.s) * 1.5) });
  }
  // Barbs hang from the arm and lean out toward the sleeve.
  barbs(
    r,
    arm,
    {
      count: Math.round(6 + o.density * 8),
      len: 34 + o.thorns * 80,
      w: wk * 2.6,
      sweep: -0.45,
      hook: -0.7,
      side: 1,
      from: 0.1,
      to: 0.92,
    },
    sink,
  );
  if (layout !== "arms") vertebrae(r, o, cx, hubY + 30, bottom - 80, 12 * wk, sink, true);
  if (layout === "full" && o.ribs) {
    // Wing fingers: long claws hanging from the arm, fanning from out-and-down at the
    // shoulder to straight down near the spine, longest in the middle, hooking in at the tip,
    // each with a few small barbs on its inner edge.
    const af = frames(arm);
    const count = 4 + Math.round(o.density * 2);
    for (let i = 0; i < count; i++) {
      const s = 0.14 + (0.6 * i) / (count - 1);
      const j = af.findIndex((x) => x.s >= s);
      const p = arm[j]!;
      const fan = 0.85 - (1.05 * i) / (count - 1);
      const len =
        (150 + o.thorns * 170) *
        (0.55 + 0.45 * Math.sin(Math.PI * (0.25 + (0.6 * i) / count))) *
        between(r, 0.9, 1.08);
      const rib = claw(p, Math.PI / 2 + fan, len, wk * (5 - i * 0.4), -0.65 - i * 0.05);
      sink.strokes.push(rib);
      barbs(
        r,
        rib.pts,
        {
          count: 2 + Math.round(o.density * 2),
          len: 16 + o.thorns * 22,
          w: wk * 1.5,
          sweep: 0.9,
          hook: 0.6,
          side: 1,
          from: 0.25,
          to: 0.75,
        },
        sink,
      );
    }
  }
  if (clearHub) sink.holes.push({ c: [cx, hubY + 4], rx: 24, ry: 26, angle: 0 });
  return render(
    { x: ax - 40, y: ay - 30, w: cx - ax + 40, h: bottom - ay + 40 },
    2 * ppu,
    sink,
    line,
    true,
  );
}
