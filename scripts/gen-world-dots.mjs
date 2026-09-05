// Generates public/maps/world-dots.svg: a dot-matrix world map (the Framer testimonial band
// and the "8 Final Nonprofits" Instagram graphic use the same motif). Land polygons come from
// Natural Earth 1:110m (public domain); each grid point on land becomes a round dot.
//
// The output is committed. Re-run only to change the density: node scripts/gen-world-dots.mjs
// (needs network access to download the ~140 KB GeoJSON).
import fs from "node:fs";
import path from "node:path";

const SRC =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson";
const OUT = path.join(process.cwd(), "public", "maps", "world-dots.svg");

const STEP = 1.25; // degrees between dots
const LAT_MAX = 84; // clip the poles: Antarctica adds nothing but a smear at the bottom
const LAT_MIN = -58;
const PITCH = 4; // SVG units between dot centres
const DOT = 2.4; // dot diameter in SVG units

const res = await fetch(SRC);
if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText}`);
const geo = await res.json();

/** Flatten Polygon / MultiPolygon features into [{ bbox, rings }]. */
const polygons = [];
for (const feature of geo.features) {
  const { type, coordinates } = feature.geometry;
  const polys = type === "Polygon" ? [coordinates] : type === "MultiPolygon" ? coordinates : [];
  for (const rings of polys) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [x, y] of rings[0]) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    polygons.push({ bbox: [minX, minY, maxX, maxY], rings });
  }
}

/** Ray casting point-in-ring test. */
function inRing(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function onLand(lon, lat) {
  for (const { bbox, rings } of polygons) {
    if (lon < bbox[0] || lon > bbox[2] || lat < bbox[1] || lat > bbox[3]) continue;
    if (!inRing(rings[0], lon, lat)) continue;
    let inHole = false;
    for (let r = 1; r < rings.length; r++) {
      if (inRing(rings[r], lon, lat)) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

const cols = Math.round(360 / STEP);
const rows = Math.round((LAT_MAX - LAT_MIN) / STEP);
const width = cols * PITCH;
const height = rows * PITCH;

// One path. Each row is a set of horizontal runs of land dots; a zero-length dash pattern
// with round caps turns a run into evenly spaced dots (a 10-byte segment per run, not per dot).
const segments = [];
let dots = 0;
for (let r = 0; r < rows; r++) {
  const lat = LAT_MAX - (r + 0.5) * STEP;
  const y = (r + 0.5) * PITCH;
  let runStart = -1;
  const flush = (endCol) => {
    if (runStart < 0) return;
    const x1 = (runStart + 0.5) * PITCH;
    const x2 = (endCol + 0.5) * PITCH;
    segments.push(endCol === runStart ? `M${x1} ${y}h0.01` : `M${x1} ${y}H${x2}`);
    dots += endCol - runStart + 1;
    runStart = -1;
  };
  for (let c = 0; c < cols; c++) {
    const lon = -180 + (c + 0.5) * STEP;
    if (onLand(lon, lat)) {
      if (runStart < 0) runStart = c;
    } else {
      flush(c - 1);
    }
  }
  flush(cols - 1);
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
  `<path fill="none" stroke="#03c652" stroke-width="${DOT}" stroke-linecap="round" stroke-dasharray="0 ${PITCH}" d="${segments.join("")}"/>` +
  `</svg>\n`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, svg);
console.log(
  `wrote ${path.relative(process.cwd(), OUT)}: ${cols}x${rows} grid, ${dots} dots, ${segments.length} runs, ${(svg.length / 1024).toFixed(1)} KB`,
);
