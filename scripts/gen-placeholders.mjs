// Generates branded placeholder images into public/placeholders/.
// Dark surface, subtle grid, mint outline, and a small label so slots are obviously placeholders.
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

function svg({ w, h, label, cell = 40, round = false }) {
  const id = label.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const shape = round
    ? `<circle cx="${w / 2}" cy="${h / 2}" r="${w / 2 - 1.5}" fill="url(#g-${id})" stroke="${MINT}" stroke-opacity="0.6" stroke-width="1.5"/>`
    : `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="8" fill="url(#g-${id})" stroke="${MINT}" stroke-opacity="0.6" stroke-width="1.5"/>`;
  const fontSize = Math.max(11, Math.round(Math.min(w, h) / 22));
  const mark = round
    ? ""
    : `<text x="${w / 2}" y="${h / 2 + fontSize / 3}" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" letter-spacing="0.12em" fill="${MUTED}">${label.toUpperCase()}</text>
       <rect x="${w / 2 - fontSize * 3.2}" y="${h / 2 + fontSize}" width="${fontSize * 6.4}" height="1" fill="${MINT}" fill-opacity="0.5"/>`;
  const globe = round
    ? `<g fill="none" stroke="${MINT}" stroke-opacity="0.5" stroke-width="1"><circle cx="${w / 2}" cy="${h / 2}" r="${w * 0.28}"/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.12}" ry="${w * 0.28}"/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.28}" ry="${w * 0.1}"/></g>`
    : "";
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
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="8" fill="url(#p-${id})"${round ? ` clip-path="circle(${w / 2 - 2}px at ${w / 2}px ${h / 2}px)"` : ""}/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="8" fill="url(#r-${id})"${round ? ` clip-path="circle(${w / 2 - 2}px at ${w / 2}px ${h / 2}px)"` : ""}/>
  ${globe}${mark}
</svg>
`;
}

const files = [
  ["cover-16x9.svg", { w: 1600, h: 900, label: "Project cover" }],
  ["cover-4x5.svg", { w: 1200, h: 1500, label: "Project cover" }],
  ["gallery-16x10.svg", { w: 1600, h: 1000, label: "Screenshot" }],
  ["avatar.svg", { w: 400, h: 400, label: "Avatar", cell: 32, round: true }],
  ["exec.svg", { w: 800, h: 1000, label: "Exec photo" }],
  ["og.svg", { w: 1200, h: 630, label: "Hack the Future" }],
];

for (const [name, opts] of files) {
  fs.writeFileSync(path.join(outDir, name), svg(opts));
  console.log("wrote", path.relative(process.cwd(), path.join(outDir, name)));
}
