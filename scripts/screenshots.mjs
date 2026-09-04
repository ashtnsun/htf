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
const ROUTES = (args.routes ?? "/").split(",");
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
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    // let mount reveals finish, then scroll through so in-view reveals fire
    await page.waitForTimeout(1200);
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);
    const file = path.join(OUT, `${slug}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("saved", file);
  }
  if (vp.mobile) {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.waitForTimeout(700);
    const file = path.join(OUT, `drawer-${vp.name}.png`);
    await page.screenshot({ path: file });
    console.log("saved", file);
  }
  await context.close();
}

await browser.close();
