// Generates the dot-matrix world maps in public/maps (the Framer testimonial band and the
// "8 Final Nonprofits" Instagram graphic use the same motif). Land polygons come from
// Natural Earth 1:110m (public domain); each grid point on land becomes a round dot.
//
//   world-dots.svg           every land dot
//   world-dots-partners.svg  only the dots inside the countries HTF has worked in
//
// Both are drawn on the same grid at the same size, so the second lines up exactly on top of
// the first as a second mask (see components/ui/DottedMap).
//
// The output is committed. Re-run to change the density or the partner countries:
// node scripts/gen-world-dots.mjs (needs network access to download ~940 KB of GeoJSON).
import fs from "node:fs";
import path from "node:path";

const LAND_SRC =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson";
const COUNTRIES_SRC =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const OUT_DIR = path.join(process.cwd(), "public", "maps");

// Every country a project has run in, as Natural Earth ADM0_A3 codes. Keep in sync with the
// `location` frontmatter of content/projects/*.mdx (the countries stat counts the same set).
const PARTNER_COUNTRIES = new Set([
  "USA", // Indiana, Illinois, California, Pennsylvania
  "GBR", // United Kingdom
  "IND", // India
  "GHA", // Ghana
  "BWA", // Botswana
]);

const STEP = 1.25; // degrees between dots
const LAT_MAX = 84; // clip the poles: Antarctica adds nothing but a smear at the bottom
const LAT_MIN = -58;
const PITCH = 4; // SVG units between dot centres
const DOT = 2.4; // dot diameter in SVG units

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText} (${url})`);
  return res.json();
}

/** Flatten Polygon / MultiPolygon features into [{ bbox, rings }], keeping only `filter`ed ones. */
function toPolygons(geo, filter = () => true) {
  const polygons = [];
  for (const feature of geo.features) {
    if (!filter(feature)) continue;
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
  return polygons;
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

function makeHitTest(polygons) {
  return function hit(lon, lat) {
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
  };
}

const cols = Math.round(360 / STEP);
const rows = Math.round((LAT_MAX - LAT_MIN) / STEP);
const width = cols * PITCH;
const height = rows * PITCH;

// One path. Each row is a set of horizontal runs of dots; a zero-length dash pattern with
// round caps turns a run into evenly spaced dots (a 10-byte segment per run, not per dot).
function buildPath(include) {
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
      if (include(lon, lat)) {
        if (runStart < 0) runStart = c;
      } else {
        flush(c - 1);
      }
    }
    flush(cols - 1);
  }
  return { segments, dots };
}

function write(name, { segments, dots }) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<path fill="none" stroke="#03c652" stroke-width="${DOT}" stroke-linecap="round" stroke-dasharray="0 ${PITCH}" d="${segments.join("")}"/>` +
    `</svg>\n`;
  const out = path.join(OUT_DIR, name);
  fs.writeFileSync(out, svg);
  console.log(
    `wrote ${path.relative(process.cwd(), out)}: ${cols}x${rows} grid, ${dots} dots, ${segments.length} runs, ${(svg.length / 1024).toFixed(1)} KB`,
  );
}

const [land, countries] = await Promise.all([getJson(LAND_SRC), getJson(COUNTRIES_SRC)]);

const onLand = makeHitTest(toPolygons(land));
const inPartnerCountry = makeHitTest(
  toPolygons(countries, (f) => PARTNER_COUNTRIES.has(f.properties.ADM0_A3)),
);

fs.mkdirSync(OUT_DIR, { recursive: true });
write("world-dots.svg", buildPath(onLand));
// A partner dot has to be a land dot too, or it would have no dot underneath it to tint.
write(
  "world-dots-partners.svg",
  buildPath((lon, lat) => inPartnerCountry(lon, lat) && onLand(lon, lat)),
);
