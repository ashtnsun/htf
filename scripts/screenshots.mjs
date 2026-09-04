// Full-page screenshots of key routes at desktop and phone widths, plus the open mobile drawer.
// Usage: pnpm screenshots [--base http://localhost:3000] [--out docs/screenshots/session-1] [--routes /,/projects]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const BASE = args.base ?? process.env.BASE_URL ?? "http://localhost:3000";
const OUT = args.out ?? "docs/screenshots/session-1";
const ROUTES = String(args.routes ?? "/")
  .split(",")
  .map((r) => (r === "home" ? "/" : r.startsWith("/") ? r : `/${r}`));
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "390", width: 390, height: 844, mobile: true },
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: Boolean(vp.mobile),
    hasTouch: Boolean(vp.mobile),
    colorScheme: "dark",
  });
  const page = await context.newPage();
  for (const route of ROUTES) {
    const slug = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
    await page.goto(`${BASE}${route}`, { waitUntil: "load" });
    // let mount reveals finish, then scroll through so in-view reveals fire
    await page.waitForTimeout(1200);
    await page.evaluate(async () => {
      // instant scrolling (the site uses smooth scroll-behavior) so in-view reveals fire
      const step = window.innerHeight * 0.6;
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 200));
      }
      await new Promise((r) => setTimeout(r, 900));
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForTimeout(600);
    const file = path.join(OUT, `${slug}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("saved", file);
  }
  if (vp.mobile) {
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.waitForTimeout(700);
    const file = path.join(OUT, `drawer-${vp.name}.png`);
    await page.screenshot({ path: file });
    console.log("saved", file);
  }
  await context.close();
}

await browser.close();
