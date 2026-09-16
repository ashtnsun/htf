/**
 * Wireframe geometry for the inner-page hero objects (components/layout/pageHeroes/heroObjects).
 *
 * The SVG globe (components/home/Globe) draws a sphere as latitude rings and meridian curves,
 * spun about the polar axis and projected orthographically from GLOBE_TILT above the equator.
 * These helpers build the same kind of drawing for objects that are not spheres, so every hero
 * object reads as one schematic family: the same construction, the same axis, the same rate.
 *
 * Pure geometry: no React, no DOM. Axes are x right, y up, z toward the viewer; models are
 * centred on the origin so the spin axis runs through the middle of the object and the
 * silhouette turns evenly rather than orbiting.
 */

import { DEG, GLOBE_TILT } from "@/lib/geo";

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];
export type Polyline = readonly Vec3[];
export type WireModel = readonly Polyline[];

const TAU = Math.PI * 2;
const SIN_TILT = Math.sin(GLOBE_TILT * DEG);
const COS_TILT = Math.cos(GLOBE_TILT * DEG);

/** Radius every model is normalised to. The globe's own radius is 100 in the same viewBox. */
export const WIRE_RADIUS = 94;

/** Repeat the first point so a polyline closes on itself. */
export function closed(points: Polyline): Polyline {
  const first = points[0];
  return first ? [...points, first] : points;
}

/** `steps` fractions across [0, 1). */
function fractions(steps: number): number[] {
  return Array.from({ length: steps }, (_, i) => i / steps);
}

/** A horizontal circle about the spin axis: one latitude ring of a solid of revolution. */
export function ring(radius: number, y: number, steps = 36): Polyline {
  return closed(
    fractions(steps).map((t): Vec3 => {
      const a = t * TAU;
      return [radius * Math.cos(a), y, radius * Math.sin(a)];
    }),
  );
}

/**
 * A [radius, height] outline placed at one longitude. Used both for a solid of revolution's
 * meridians and for the flat parts that stand in a plane through the axis (fins, a keel).
 */
export function atAngle(outline: readonly Vec2[], angle: number): Polyline {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return outline.map(([r, y]): Vec3 => [r * cos, y, r * sin]);
}

/** Turn a [radius, height] profile into a solid of revolution, drawn as the globe is drawn. */
export function lathe(
  profile: readonly Vec2[],
  { meridians = 12, ringEvery = 2, ringSteps = 36 } = {},
): Polyline[] {
  const out: Polyline[] = [];
  for (let i = 0; i < meridians; i += 1) out.push(atAngle(profile, (i / meridians) * TAU));
  profile.forEach(([radius, y], i) => {
    if (i % ringEvery !== 0 && i !== profile.length - 1) return;
    if (radius > 1e-3) out.push(ring(radius, y, ringSteps));
  });
  return out;
}

/**
 * An outline in the x-y plane given a thickness in z: the two faces, plus a join between them
 * at each listed vertex, which is what makes a thin part read as a solid while it turns.
 */
export function extrudeZ(
  outline: readonly Vec2[],
  halfDepth: number,
  joinsAt: readonly number[] = [],
): Polyline[] {
  const face = (z: number): Polyline => closed(outline.map(([x, y]): Vec3 => [x, y, z]));
  const joins = joinsAt.flatMap((i): Polyline[] => {
    const point = outline[i];
    return point
      ? [
          [
            [point[0], point[1], halfDepth],
            [point[0], point[1], -halfDepth],
          ],
        ]
      : [];
  });
  return [face(halfDepth), face(-halfDepth), ...joins];
}

/**
 * Turn a model about the vertical axis. Spinning is continuous, so this only sets where a model
 * starts — which is the pose it keeps under prefers-reduced-motion, and so worth choosing.
 */
export function spinY(polylines: readonly Polyline[], degrees: number): Polyline[] {
  const cos = Math.cos(degrees * DEG);
  const sin = Math.sin(degrees * DEG);
  return polylines.map((line) =>
    line.map(([x, y, z]): Vec3 => [x * cos + z * sin, y, z * cos - x * sin]),
  );
}

/**
 * Scale a model along the axes. A solid of revolution squashed front to back (the heart) keeps
 * every ring and meridian it was lathed with, so it still turns in the globe's language while
 * being wider than it is deep.
 */
export function scaleAxes(polylines: readonly Polyline[], [sx, sy, sz]: Vec3): Polyline[] {
  return polylines.map((line) => line.map(([x, y, z]): Vec3 => [x * sx, y * sy, z * sz]));
}

/**
 * Fit a model to the frame the globe fills, measured on what the viewer actually sees: the box
 * the drawing sweeps out over a whole turn, not the model's own bounding box. A deep object (the
 * paper aeroplane, most of whose length runs away from the viewer) would otherwise project far
 * smaller than a wide one, and the set has to match in size.
 *
 * The model is first centred in x and z so the spin axis runs up the middle of it — that is what
 * keeps the turn even rather than an orbit. A point at distance ρ from that axis then sweeps
 * x over ±ρ and y over ±ρ·sin(tilt) − y·cos(tilt), which gives the swept box in closed form.
 * Scaling is uniform, so the shape stays true; the leftover vertical offset centres it.
 */
export function normalize(polylines: readonly Polyline[], radius = WIRE_RADIUS): WireModel {
  const points = polylines.flat();
  const extent = (axis: 0 | 1 | 2) => {
    const values = points.map((point) => point[axis]);
    return (Math.min(...values) + Math.max(...values)) / 2;
  };
  const cx = extent(0);
  const cz = extent(2);

  let maxRho = 0;
  let top = -Infinity;
  let bottom = Infinity;
  for (const [x, y, z] of points) {
    const rho = Math.hypot(x - cx, z - cz);
    maxRho = Math.max(maxRho, rho);
    top = Math.max(top, rho * SIN_TILT - y * COS_TILT);
    bottom = Math.min(bottom, -rho * SIN_TILT - y * COS_TILT);
  }
  const span = Math.max(2 * maxRho, top - bottom);
  const scale = span > 0 ? (2 * radius) / span : 1;
  // what is left of the vertical centring, back in model units (screen y runs down)
  const dy = (((top + bottom) / 2) * scale) / COS_TILT;

  return polylines.map((line) =>
    line.map(([x, y, z]): Vec3 => [(x - cx) * scale, y * scale + dy, (z - cz) * scale]),
  );
}

/** Flatten a model to one packed x,y,z array per polyline, so a frame costs no allocation. */
export function packModel(model: WireModel): Float64Array[] {
  return model.map((line) => {
    const packed = new Float64Array(line.length * 3);
    line.forEach(([x, y, z], i) => {
      packed[i * 3] = x;
      packed[i * 3 + 1] = y;
      packed[i * 3 + 2] = z;
    });
    return packed;
  });
}

/**
 * One polyline's `points` attribute at the given spin (radians): rotate about the vertical axis,
 * then project orthographically with the globe's tilt. Matches projectOrthographic in lib/geo,
 * so an object and the globe turn identically.
 */
export function projectLine(packed: Float64Array, cos: number, sin: number): string {
  let out = "";
  for (let i = 0; i < packed.length; i += 3) {
    const x = packed[i]!;
    const y = packed[i + 1]!;
    const z = packed[i + 2]!;
    const sx = x * cos + z * sin;
    const sz = z * cos - x * sin;
    const sy = sz * SIN_TILT - y * COS_TILT;
    out += `${Math.round(sx * 100) / 100},${Math.round(sy * 100) / 100} `;
  }
  return out;
}

/** Every polyline's `points` attribute at the given spin (radians). */
export function projectModel(packed: readonly Float64Array[], spin: number): string[] {
  const cos = Math.cos(spin);
  const sin = Math.sin(spin);
  return packed.map((line) => projectLine(line, cos, sin));
}
