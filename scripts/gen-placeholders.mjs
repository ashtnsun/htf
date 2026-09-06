// Generates branded placeholder images into public/placeholders/.
// Dark surface, subtle grid, mint outline (square corners, like the site), and a small label
// so slots are obviously placeholders.
// Covers come in four variants with a brand ornament (globe, checkerboard, zigzag, brackets)
// so a grid of placeholder cards has some rhythm before real photos land.
// Run: pnpm gen:placeholders   (no dependencies)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "placeholders",
);
fs.mkdirSync(outDir, { recursive: true });

const SURFACE = "#141414";
const LINE = "rgba(255,255,255,0.07)";
const MINT = "#00EB88";
const MUTED = "#A3A3A3";

/** Brand ornaments from the Instagram graphics, drawn as thin mint strokes. */
function ornament(kind, w, h) {
  const stroke = `fill="none" stroke="${MINT}" stroke-opacity="0.35" stroke-width="1.5"`;
  switch (kind) {
    case "globe": {
      const cx = w * 0.72;
      const cy = h * 0.5;
      const r = Math.min(w, h) * 0.28;
      return `<g ${stroke}>
        <circle cx="${cx}" cy="${cy}" r="${r}"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${r * 0.45}" ry="${r}"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.35}"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.75}"/>
        <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}"/>
        <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}"/>
      </g>`;
    }
    case "checker": {
      const cell = Math.round(w / 24);
      const x0 = w * 0.08;
      const y0 = h * 0.72;
      let rects = "";
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 9; col++) {
          if ((row + col) % 2 === 0) {
            rects += `<rect x="${x0 + col * cell}" y="${y0 + row * cell}" width="${cell}" height="${cell}" fill="${MINT}" fill-opacity="0.28"/>`;
          }
        }
      }
      return rects;
    }
    case "zigzag": {
      const step = w / 16;
      const yTop = h * 0.74;
      const yBottom = h * 0.82;
      const points = [];
      for (let i = 0; i <= 16; i++) {
        points.push(`${i * step},${i % 2 === 0 ? yTop : yBottom}`);
      }
      return `<polyline points="${points.join(" ")}" ${stroke}/>`;
    }
    case "brackets": {
      const s = Math.min(w, h) * 0.26;
      const cy = h * 0.5;
      const left = w * 0.14;
      const right = w * 0.86;
      return `<g fill="none" stroke="${MINT}" stroke-opacity="0.35" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="${left + s * 0.6},${cy - s} ${left},${cy} ${left + s * 0.6},${cy + s}"/>
        <polyline points="${right - s * 0.6},${cy - s} ${right},${cy} ${right - s * 0.6},${cy + s}"/>
        <line x1="${w * 0.56}" y1="${cy - s}" x2="${w * 0.44}" y2="${cy + s}"/>
      </g>`;
    }
    default:
      return "";
  }
}

function svg({ w, h, label, cell = 40, round = false, kind }) {
  const id = label.replace(/[^a-z0-9]/gi, "-").toLowerCase() + (kind ? `-${kind}` : "");
  const shape = round
    ? `<circle cx="${w / 2}" cy="${h / 2}" r="${w / 2 - 1.5}" fill="url(#g-${id})" stroke="${MINT}" stroke-opacity="0.6" stroke-width="1.5"/>`
    : `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="url(#g-${id})" stroke="${MINT}" stroke-opacity="0.6" stroke-width="1.5"/>`;
  const fontSize = Math.max(11, Math.round(Math.min(w, h) / 22));
  const mark = round
    ? ""
    : `<text x="${w / 2}" y="${h / 2 + fontSize / 3}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" letter-spacing="0.12em" fill="${MUTED}">${label.toUpperCase()}</text>
       <rect x="${w / 2 - fontSize * 3.2}" y="${h / 2 + fontSize}" width="${fontSize * 6.4}" height="1" fill="${MINT}" fill-opacity="0.5"/>`;
  const globe = round
    ? `<g fill="none" stroke="${MINT}" stroke-opacity="0.5" stroke-width="1"><circle cx="${w / 2}" cy="${h / 2}" r="${w * 0.28}"/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.12}" ry="${w * 0.28}"/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.28}" ry="${w * 0.1}"/></g>`
    : "";
  const clip = round ? ` clip-path="circle(${w / 2 - 2}px at ${w / 2}px ${h / 2}px)"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Placeholder image: ${label}">
  <defs>
    <pattern id="p-${id}" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">
      <path d="M ${cell} 0 L 0 0 0 ${cell}" fill="none" stroke="${LINE}" stroke-width="1"/>
    </pattern>
    <radialGradient id="r-${id}" cx="50%" cy="100%" r="80%">
      <stop offset="0" stop-color="${MINT}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${MINT}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SURFACE}"/>
      <stop offset="1" stop-color="#0f0f0f"/>
    </linearGradient>
  </defs>
  ${shape}
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="url(#p-${id})"${clip}/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="url(#r-${id})"${clip}/>
  ${kind ? ornament(kind, w, h) : ""}${globe}${mark}
</svg>
`;
}

const files = [
  // Project covers: 4:3 source so the 4:3 index card, 4:5 featured card and 16:9 hero all crop gently.
  ["cover-globe.svg", { w: 1600, h: 1200, label: "Project cover", kind: "globe" }],
  ["cover-checker.svg", { w: 1600, h: 1200, label: "Project cover", kind: "checker" }],
  ["cover-zigzag.svg", { w: 1600, h: 1200, label: "Project cover", kind: "zigzag" }],
  ["cover-brackets.svg", { w: 1600, h: 1200, label: "Project cover", kind: "brackets" }],
  ["gallery-1.svg", { w: 1600, h: 1000, label: "Screenshot 1" }],
  ["gallery-2.svg", { w: 1600, h: 1000, label: "Screenshot 2" }],
  ["gallery-3.svg", { w: 1600, h: 1000, label: "Screenshot 3" }],
  ["avatar.svg", { w: 400, h: 400, label: "Avatar", cell: 32, round: true }],
  ["exec.svg", { w: 800, h: 1000, label: "Exec photo" }],
  // Home "What we do" full-organization photo (21:9) and the Impact awards photo (3:2).
  ["org-photo.svg", { w: 2400, h: 1030, label: "Organization photo", cell: 60 }],
  ["award-photo.svg", { w: 1800, h: 1200, label: "Award photo", cell: 48 }],
];

// Remove outputs from earlier versions of this script so nothing stale is served.
for (const stale of ["cover-16x9.svg", "cover-4x5.svg", "gallery-16x10.svg"]) {
  fs.rmSync(path.join(outDir, stale), { force: true });
}

for (const [name, opts] of files) {
  fs.writeFileSync(path.join(outDir, name), svg(opts));
  console.log("wrote", path.relative(process.cwd(), path.join(outDir, name)));
}
