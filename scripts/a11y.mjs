// axe-core accessibility scan of routes (desktop + phone, including the open drawer).
// Usage: pnpm a11y [--base http://localhost:3000] [--routes /,/projects,/students] [--dialog "Enlarge"]
// `--dialog` names a button (accessible-name substring); on routes where it exists it is
// clicked and the page is scanned again with that dialog open (e.g. the gallery lightbox).
// Exits 1 when any violation is found so it can gate CI later.
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const BASE = args.base ?? process.env.BASE_URL ?? "http://localhost:3000";
const ROUTES = String(args.routes ?? "/")
  .split(",")
  .map((r) => (r === "home" ? "/" : r.startsWith("/") ? r : `/${r}`));
const DIALOG = typeof args.dialog === "string" ? args.dialog : null;
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const browser = await chromium.launch();
let total = 0;

async function scan(page, label) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const { violations } = results;
  console.log(`\n${label}: ${violations.length} violation(s), ${results.passes.length} passes`);
  for (const v of violations) {
    total += 1;
    console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.helpUrl})`);
    for (const node of v.nodes.slice(0, 5)) {
      console.log(`     - ${node.target.join(" ")}`);
      console.log(`       ${node.failureSummary?.split("\n").join("\n       ")}`);
    }
  }
}

for (const [name, viewport] of [
  ["desktop 1440", { width: 1440, height: 900 }],
  ["phone 390", { width: 390, height: 844 }],
]) {
  const context = await browser.newContext({ viewport, colorScheme: "dark" });
  const page = await context.newPage();
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    await scan(page, `${name} ${route}`);
    if (DIALOG) {
      const trigger = page.getByRole("button", { name: DIALOG }).first();
      if ((await trigger.count()) > 0) {
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();
        await page.waitForTimeout(600);
        await scan(page, `${name} ${route} (dialog "${DIALOG}" open)`);
        await page.keyboard.press("Escape");
      }
    }
  }
  if (viewport.width < 1024) {
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.waitForTimeout(700);
    await scan(page, `${name} / (drawer open)`);
  }
  await context.close();
}

await browser.close();
console.log(total === 0 ? "\n✔ no accessibility violations" : `\n✖ ${total} violation(s)`);
process.exit(total === 0 ? 0 : 1);
