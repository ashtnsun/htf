import type { PageKey } from "@/components/layout/pageHeroes/usePageKey";
import {
  atAngle,
  closed,
  extrudeZ,
  lathe,
  normalize,
  puff,
  ring,
  spinY,
  stack,
  triangleMesh,
  type Polyline,
  type Vec2,
  type Vec3,
  type WireModel,
} from "@/lib/wireframe";

/**
 * The object that turns in each inner page's hero, drawn in the SVG globe's language: a mesh of
 * outlines over a real solid, spun about the vertical axis. About keeps the globe itself — the
 * motif belongs to the page about the club — so its entry is null and FinalHero renders
 * home/Globe.
 *
 * Density is the point. The globe reads as bright and finished because two dozen curves cross
 * all over its face, so every object here is meshed to the same weight — rings and uprights on
 * the briefcase, meridians and rings on the rocket, sections and rails on the heart, a fan and
 * spans over the aeroplane's folds — never a bare outline.
 *
 * Every model is built at a human scale and then normalised (lib/wireframe), which centres it on
 * the spin axis and fits it to the globe's frame, so the five heroes match in size and sit on
 * the same centre line.
 */

const TAU = Math.PI * 2;

/** Evenly spaced values from `from` to `to`, ends included. */
function spread(from: number, to: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));
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

/**
 * Projects: a briefcase — a meshed box (loops at nine heights, an upright at every point around
 * the case) with a lid seam, two clasps and an arched strap handle with a thickness.
 */
function briefcase(): Polyline[] {
  const W = 0.62; // half width
  const H = 0.37; // half height
  const D = 0.15; // half depth: a case, not a crate
  const SEAM = 0.13; // the lid seam, above the middle

  // the case's cross section, walked round in x and z with the long sides sampled more finely
  const across = spread(-W, W, 9);
  const deep = spread(D, -D, 3).slice(1, -1);
  const section: Vec2[] = [
    ...across.map((x): Vec2 => [x, D]),
    ...deep.map((z): Vec2 => [W, z]),
    ...[...across].reverse().map((x): Vec2 => [x, -D]),
    ...[...deep].reverse().map((z): Vec2 => [-W, z]),
  ];

  // the arched strap: an outer and an inner semi-ellipse joined into a band, given a thickness
  const STRAP_STEPS = 20;
  const arc = (rx: number, ry: number, reverse: boolean): Vec2[] =>
    Array.from({ length: STRAP_STEPS + 1 }, (_, i) => {
      const t = reverse ? 1 - i / STRAP_STEPS : i / STRAP_STEPS;
      const theta = Math.PI * t;
      return [rx * Math.cos(theta), H + ry * Math.sin(theta)] as Vec2;
    });
  const strap: Vec2[] = [...arc(0.26, 0.23, false), ...arc(0.17, 0.15, true)];
  const strapJoins = spread(0, STRAP_STEPS, 7).map((i) => Math.round(i));

  return [
    ...stack(section, spread(-H, H, 9)),
    closed(section.map(([x, z]): Vec3 => [x, SEAM, z])),
    rectXY(-0.34, -0.2, SEAM - 0.08, SEAM + 0.08, D),
    rectXY(0.2, 0.34, SEAM - 0.08, SEAM + 0.08, D),
    ...extrudeZ(strap, 0.035, [...strapJoins, ...strapJoins.map((i) => strap.length - 1 - i)]),
  ];
}

/**
 * Students: a rocket — a long pointed nose, a slim body and a flared nozzle lathed from one
 * profile, four swept fins, and a porthole drawn on the body so it sits on the surface.
 */
function rocket(): Polyline[] {
  const R = 0.135; // body radius
  const NOSE_TIP = 0.62;
  const NOSE_BASE = 0.24;

  const profile: Vec2[] = [];
  // the nose: a cone rounded just off the point, long enough to read as a rocket and not a bomb
  for (const t of spread(0, 1, 9)) {
    profile.push([R * t ** 0.85, NOSE_TIP - (NOSE_TIP - NOSE_BASE) * t]);
  }
  // the body
  for (const y of spread(0.14, -0.26, 5)) profile.push([R, y]);
  // the boat tail and the nozzle bell
  profile.push([0.112, -0.33], [0.12, -0.39], [0.15, -0.44], [0.185, -0.48], [0.2, -0.52]);

  // a swept fin, standing in a plane through the axis, meshed with two inner ribs
  const fin: Vec2[] = [
    [R - 0.01, -0.06],
    [R - 0.01, -0.34],
    [0.4, -0.48],
    [0.36, -0.32],
  ];
  const fins = [0, 1, 2, 3].flatMap((i) => {
    const angle = (i / 4) * TAU;
    const ribs = [0.4, 0.7].map((t): Polyline =>
      atAngle(
        [
          [fin[0]![0] + (fin[3]![0] - fin[0]![0]) * t, fin[0]![1] + (fin[3]![1] - fin[0]![1]) * t],
          [fin[1]![0] + (fin[2]![0] - fin[1]![0]) * t, fin[1]![1] + (fin[2]![1] - fin[1]![1]) * t],
        ],
        angle,
      ),
    );
    return [closed(atAngle(fin, angle)), ...ribs];
  });

  // a porthole: a circle drawn on the body, so it sits on the surface rather than in front of it
  const PORTHOLE_STEPS = 24;
  const porthole = (radius: number) =>
    closed(
      Array.from({ length: PORTHOLE_STEPS }, (_, i): Vec3 => {
        const t = (i / PORTHOLE_STEPS) * TAU;
        const a = (radius / R) * Math.cos(t);
        return [R * Math.cos(a), 0.02 + radius * Math.sin(t), R * Math.sin(a)];
      }),
    );

  return [
    ...lathe(profile, { meridians: 20, ringEvery: 1, ringSteps: 44 }),
    ...fins,
    porthole(0.055),
    porthole(0.034),
    ring(0.2, -0.52, 44),
  ];
}

/**
 * Nonprofits: a heart — the classic curve puffed into a rounded solid, meshed with nine sections
 * and two dozen rails. Lofted rather than revolved: revolving turns the two lobes into one ring,
 * where this keeps the silhouette a heart.
 */
function heart(): Polyline[] {
  const STEPS = 96;
  const outline = Array.from({ length: STEPS }, (_, i): Vec2 => {
    const t = (i / STEPS) * TAU;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [x / 17, y / 17];
  });
  return puff(outline, 0.46, { sections: 9, rails: 24, spread: 70 });
}

/**
 * Contact: a paper aeroplane — a folded dart, wings raised off the centre fold and a keel below
 * it, each fold meshed like a sheet of paper. Kept nearly as broad as it is long: a longer dart
 * all but disappears twice a turn as it comes nose-on.
 */
function paperPlane(): Polyline[] {
  const NOSE: Vec3 = [0, 0.03, 0.9];
  const TAIL: Vec3 = [0, 0.03, -0.46];
  const TIP_L: Vec3 = [-0.5, 0.24, -0.46];
  const TIP_R: Vec3 = [0.5, 0.24, -0.46];
  const KEEL: Vec3 = [0, -0.3, -0.46];

  return [
    ...triangleMesh(NOSE, TIP_L, TAIL, 9),
    ...triangleMesh(NOSE, TIP_R, TAIL, 9),
    ...triangleMesh(NOSE, KEEL, TAIL, 7),
    // the trailing edge seen end on: tip to tip across the wings, down to the keel and back
    closed([TIP_L, TIP_R, KEEL]),
  ];
}

/** Where each object starts its turn: the three-quarter view it holds under reduced motion. */
export const HERO_OBJECTS: Record<PageKey, WireModel | null> = {
  projects: normalize(spinY(briefcase(), 28)),
  about: null,
  students: normalize(spinY(rocket(), 22)),
  nonprofits: normalize(spinY(heart(), 16)),
  contact: normalize(spinY(paperPlane(), 132)),
};
