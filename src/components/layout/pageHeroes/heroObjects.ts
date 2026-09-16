import type { PageKey } from "@/components/layout/pageHeroes/usePageKey";
import {
  atAngle,
  closed,
  extrudeZ,
  lathe,
  normalize,
  scaleAxes,
  spinY,
  type Polyline,
  type Vec2,
  type Vec3,
  type WireModel,
} from "@/lib/wireframe";

/**
 * The object that turns in each inner page's hero, drawn in the SVG globe's language: outlines
 * on a real solid, spun about the vertical axis. About keeps the globe itself — the motif
 * belongs to the page about the club — so its entry is null and FinalHero renders home/Globe.
 *
 * Every model is built at a human scale and then normalised (lib/wireframe), which centres it
 * on the spin axis and fits it to the same radius, so the five heroes match in size and sit on
 * the same centre line.
 */

const TAU = Math.PI * 2;

/** A rectangle in the horizontal plane at height `y` (a box's top or bottom). */
function rectXZ(halfWidth: number, halfDepth: number, y: number): Polyline {
  return closed([
    [-halfWidth, y, -halfDepth],
    [halfWidth, y, -halfDepth],
    [halfWidth, y, halfDepth],
    [-halfWidth, y, halfDepth],
  ] as Vec3[]);
}

/** A rectangle lying in a face at depth `z` (the clasps on the briefcase front). */
function rectXY(x0: number, x1: number, y0: number, y1: number, z: number): Polyline {
  return closed([
    [x0, y0, z],
    [x1, y0, z],
    [x1, y1, z],
    [x0, y1, z],
  ] as Vec3[]);
}

/** Projects: a briefcase — a box with a lid seam, two clasps and an arched strap handle. */
function briefcase(): Polyline[] {
  const W = 0.62; // half width
  const H = 0.37; // half height
  const D = 0.155; // half depth: a case, not a crate
  const SEAM = 0.13; // the lid seam, above the middle

  const corners: Vec2[] = [
    [-W, -D],
    [W, -D],
    [W, D],
    [-W, D],
  ];

  // the arched strap: an outer and an inner semi-ellipse joined into a band, given a thickness
  const STRAP_STEPS = 18;
  const arc = (rx: number, ry: number, reverse: boolean): Vec2[] =>
    Array.from({ length: STRAP_STEPS + 1 }, (_, i) => {
      const t = reverse ? 1 - i / STRAP_STEPS : i / STRAP_STEPS;
      const theta = Math.PI * t;
      return [rx * Math.cos(theta), H + ry * Math.sin(theta)] as Vec2;
    });
  const strap: Vec2[] = [...arc(0.26, 0.23, false), ...arc(0.17, 0.15, true)];

  return [
    rectXZ(W, D, H),
    rectXZ(W, D, -H),
    ...corners.map(([x, z]): Polyline => [
      [x, -H, z],
      [x, H, z],
    ]),
    rectXZ(W, D, SEAM),
    rectXY(-0.34, -0.2, SEAM - 0.08, SEAM + 0.08, D),
    rectXY(0.2, 0.34, SEAM - 0.08, SEAM + 0.08, D),
    ...extrudeZ(strap, 0.035, [0, STRAP_STEPS, STRAP_STEPS + 1, strap.length - 1]),
  ];
}

/** Students: a rocket — an ogive nose, a body, a flared nozzle, three swept fins, a porthole. */
function rocket(): Polyline[] {
  const R = 0.145; // body radius
  const NOSE_TIP = 0.58;
  const NOSE_BASE = 0.18;
  const NOSE_STEPS = 7;

  const profile: Vec2[] = [];
  for (let i = 0; i <= NOSE_STEPS; i += 1) {
    const t = i / NOSE_STEPS; // 0 at the tip, 1 where the nose meets the body
    profile.push([R * t ** 0.8, NOSE_TIP - (NOSE_TIP - NOSE_BASE) * t]);
  }
  profile.push([R, 0.06], [R, -0.06], [R, -0.18], [R, -0.28]);
  profile.push([0.122, -0.36], [0.134, -0.42], [0.172, -0.47], [0.19, -0.5]);

  // a swept fin, standing in a plane through the axis
  const fin: Vec2[] = [
    [R - 0.01, -0.07],
    [R - 0.01, -0.34],
    [0.4, -0.46],
    [0.36, -0.34],
  ];

  // a porthole: a circle drawn on the body, so it sits on the surface rather than in front of it
  const PORTHOLE_STEPS = 20;
  const porthole = closed(
    Array.from({ length: PORTHOLE_STEPS }, (_, i): Vec3 => {
      const t = (i / PORTHOLE_STEPS) * TAU;
      const a = (0.05 / R) * Math.cos(t);
      return [R * Math.cos(a), 0.0 + 0.05 * Math.sin(t), R * Math.sin(a)];
    }),
  );

  return [
    ...lathe(profile, { meridians: 12, ringEvery: 2, ringSteps: 36 }),
    ...[0, 1, 2].map((i) => closed(atAngle(fin, (i / 3) * TAU))),
    porthole,
  ];
}

/**
 * Nonprofits: a heart — the right half of the classic heart curve taken as a profile and turned
 * about the vertical axis, then squashed front to back. Revolving it keeps the silhouette a
 * heart from the front, dimples the notch between the lobes and tapers the tip, and it is the
 * globe's own construction, so it turns as evenly and never goes flat.
 */
function heart(): Polyline[] {
  const STEPS = 30;
  const profile = Array.from({ length: STEPS + 1 }, (_, i): Vec2 => {
    const t = Math.PI * (1 - i / STEPS); // π at the bottom tip, 0 at the notch between the lobes
    const r = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [r / 17, y / 17];
  });
  return scaleAxes(lathe(profile, { meridians: 12, ringEvery: 2, ringSteps: 36 }), [1, 1, 0.5]);
}

/**
 * Contact: a paper aeroplane — a folded dart, wings raised off the centre fold and a keel below
 * it. Kept nearly as broad as it is long: a longer dart all but disappears twice a turn as it
 * comes nose-on.
 */
function paperPlane(): Polyline[] {
  const NOSE: Vec3 = [0, 0.02, 0.62];
  const TAIL: Vec3 = [0, 0.02, -0.44];
  const TIP_L: Vec3 = [-0.54, 0.17, -0.44];
  const TIP_R: Vec3 = [0.54, 0.17, -0.44];
  const KEEL: Vec3 = [0, -0.24, -0.44];

  /** A point on the tail edge, `v` of the way from the centre fold out to the wing tip. */
  const alongTail = (tip: Vec3, v: number): Vec3 => [
    TAIL[0] + (tip[0] - TAIL[0]) * v,
    TAIL[1] + (tip[1] - TAIL[1]) * v,
    TAIL[2],
  ];

  const creases = [TIP_L, TIP_R].flatMap((tip) =>
    [0.32, 0.62].map((v): Polyline => [NOSE, alongTail(tip, v)]),
  );

  return [
    closed([NOSE, TIP_L, TAIL] as Vec3[]),
    closed([NOSE, TIP_R, TAIL] as Vec3[]),
    closed([NOSE, KEEL, TAIL] as Vec3[]),
    [NOSE, TAIL],
    ...creases,
  ];
}

/** Where each object starts its turn: the three-quarter view it holds under reduced motion. */
export const HERO_OBJECTS: Record<PageKey, WireModel | null> = {
  projects: normalize(spinY(briefcase(), 28)),
  about: null,
  students: normalize(spinY(rocket(), 18)),
  nonprofits: normalize(spinY(heart(), 12)),
  contact: normalize(spinY(paperPlane(), 58)),
};
