// One hero shot per inner-page hero variant (the Shift + M setting), on the pages that use
// the switch. The choice is seeded into localStorage before the page loads, the way a browser
// with a saved choice would have it.
// Usage: node scripts/shot-page-heroes.mjs [outDir] [--reduced] [--base http://localhost:3000]
// Needs `pnpm dev` (or a production server) running.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const OUT = args.find((a) => !a.startsWith("--")) ?? "docs/screenshots/page-heroes";
const BASE = value("base", "http://localhost:3000");
const REDUCED = flag("reduced");
/** Every id in PAGE_HERO_VARIANTS (src/lib/config/options.ts). */
const DEFAULT_VARIANTS = [
  "frame",
  "globe",
  "radar",
  "corridor",
  "trace",
  "dither",
  "dino",
  "editorial",
  "pixels",
  "viewfinder",
  "cameo",
  "dock",
  "final",
];
/** `--only a,b` shoots just those variants. */
const VARIANTS = value("only", "") ? value("only", "").split(",") : DEFAULT_VARIANTS;
/** About has a blurb, Students does not, Contact is the shortest hero. */
const ROUTES = ["/about", "/students", "/contact"];
/** The graphics need their entrance (the dinosaur's walk is the longest, at 3.6s). */
const SETTLE = 4600;

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const vp of [
  { name: "1440", width: 1440, height: 900 },
  { name: "390", width: 390, height: 844, mobile: true },
]) {
  for (const variant of VARIANTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: Boolean(vp.mobile),
      hasTouch: Boolean(vp.mobile),
      colorScheme: "dark",
      ...(REDUCED ? { reducedMotion: "reduce" } : {}),
    });
    await context.addInitScript(
      ([v]) => {
        window.localStorage.setItem(
          "htf:config:v1",
          JSON.stringify({ hero: "photo", involved: "globe", pageHero: v }),
        );
      },
      [variant],
    );
    const page = await context.newPage();
    for (const route of ROUTES) {
      if (vp.mobile && route === "/contact") continue;
      await page.goto(`${BASE}${route}`, { waitUntil: "load" });
      await page.waitForTimeout(SETTLE);
      const slug = route.replace(/^\//, "");
      const suffix = REDUCED ? "-reduced" : "";
      const file = path.join(OUT, `${slug}-${variant}-${vp.name}${suffix}.png`);
      await page.screenshot({ path: file });
      console.log("saved", file);
    }
    await context.close();
  }
}
await browser.close();
