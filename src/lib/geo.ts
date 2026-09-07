/**
 * Geometry shared by the SVG globe (src/components/home/Globe.tsx) and the three.js partner
 * globe (src/components/globe). Both tip the north pole toward the viewer by GLOBE_TILT and
 * spin about the polar axis.
 */

export const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

/** Degrees the pole is tipped toward the viewer, like the Instagram globe graphic. */
export const GLOBE_TILT = 32;

/**
 * Point on the unit sphere for a latitude / longitude (degrees): x right, y up, z toward
 * the viewer. Longitude 0 faces the viewer when the spin is 0.
 */
export function sphericalToVector(lat: number, lng: number, r = 1): [number, number, number] {
  const phi = lat * DEG;
  const lambda = lng * DEG;
  return [
    r * Math.cos(phi) * Math.sin(lambda),
    r * Math.sin(phi),
    r * Math.cos(phi) * Math.cos(lambda),
  ];
}

/** Shortest signed rotation (radians) from angle `from` to angle `to`. */
export function shortestAngle(from: number, to: number): number {
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/**
 * Orthographic projection onto the tilted SVG globe: `x` right, `y` down (SVG), both in
 * units of the radius, and `depth` toward the viewer (visible when positive). `spin` is the
 * rotation about the polar axis in radians.
 */
export function projectOrthographic(
  lat: number,
  lng: number,
  spin: number,
  tilt = GLOBE_TILT * DEG,
): { x: number; y: number; depth: number } {
  const phi = lat * DEG;
  const a = lng * DEG + spin;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  return {
    x: cosPhi * Math.sin(a),
    y: cosPhi * Math.cos(a) * Math.sin(tilt) - sinPhi * Math.cos(tilt),
    depth: sinPhi * Math.sin(tilt) + cosPhi * Math.cos(a) * Math.cos(tilt),
  };
}
