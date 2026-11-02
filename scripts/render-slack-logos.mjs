// Rasterize reference/branding/Slack/*.svg to PNG at their own pixel size (Playwright).
// Usage: node scripts/render-slack-logos.mjs   (after python scripts/gen-slack-logos.py)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const dir = join(import.meta.dirname, "..", "reference", "branding", "Slack");
const browser = await chromium.launch();
const page = await browser.newPage();
for (const name of readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const svg = readFileSync(join(dir, name), "utf8");
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/).map(Number);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<body style="margin:0;background:#000">${svg}</body>`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h } });
  writeFileSync(join(dir, name.replace(/\.svg$/, ".png")), png);
  console.log(`wrote ${name.replace(/\.svg$/, ".png")}`);
}
await browser.close();
