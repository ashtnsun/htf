// Measures how tall each section of the Google Form on /apply needs to be, at every width the
// frame steps at, so the form never scrolls inside its frame. Playwright can reach into the
// cross-origin frame; the site itself cannot, which is why the heights are baked into
// src/components/apply/ApplyForm.tsx (SECTION_HEIGHTS) instead of measured at runtime.
//
// It fills each section with throwaway answers and clicks "Next" to reach the next one. It
// never clicks "Submit", so no response is recorded.
//
// Usage: `pnpm build && pnpm start -p 3100`, then
//   node scripts/measure-apply-form.mjs --base=http://localhost:3100 [--widths=390,768]
// Compare "needs" with "frame": a negative slack means that width and section scroll inside.
import { chromium } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const BASE = args.base ?? "http://localhost:3000";
const WIDTHS = String(args.widths ?? "320,360,420,480,520,640,768,880,1440")
  .split(",")
  .map(Number);
const SELECTOR = "iframe[title$='application form']";

/** The form's own document height, measured with the frame squeezed so it cannot stretch. */
async function neededHeight(page, child) {
  await page.$eval(SELECTOR, (el) => {
    el.dataset.restore = el.style.height;
    el.style.height = "300px";
  });
  await page.waitForTimeout(600);
  const needed = await child.evaluate(() =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
  );
  await page.$eval(SELECTOR, (el) => {
    el.style.height = el.dataset.restore ?? "";
  });
  await page.waitForTimeout(300);
  return needed;
}

/** Throwaway answers for every question on the current section. */
async function fillSection(child) {
  for (const item of await child.$$("div[role=listitem]")) {
    const textarea = await item.$("textarea");
    if (textarea) {
      await textarea.fill("Test answer").catch(() => {});
      continue;
    }
    const input = await item.$("input:not([type=hidden])");
    const type = input ? await input.getAttribute("type") : null;
    if (input && (type === "email" || type === "text")) {
      await input.fill(type === "email" ? "test@purdue.edu" : "Test answer").catch(() => {});
      continue;
    }
    const option = await item.$("div[role=radio], div[role=checkbox]");
    if (option) {
      await option.click().catch(() => {});
      continue;
    }
    const listbox = await item.$("div[role=listbox]");
    if (listbox) {
      await listbox.click().catch(() => {});
      await child.waitForTimeout(400);
      for (const choice of await child.$$("div[role=option]")) {
        const label = (await choice.textContent())?.trim();
        if (label && !/choose/i.test(label)) {
          await choice.click().catch(() => {});
          break;
        }
      }
      await child.waitForTimeout(250);
    }
  }
}

const browser = await chromium.launch();
let short = 0;
for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/apply`, { waitUntil: "load" });
  await page.frameLocator(SELECTOR).locator("form").waitFor({ state: "attached", timeout: 30_000 });
  await page.waitForTimeout(1000);
  const child = page.frames().find((f) => f.url().includes("docs.google.com"));
  const row = [];
  for (let section = 1; section <= 8; section++) {
    const needed = await neededHeight(page, child);
    const applied = await page.$eval(SELECTOR, (el) => el.clientHeight);
    const slack = applied - needed;
    if (slack < 0) short += 1;
    row.push(
      `${section}: needs ${needed} frame ${applied} ${slack < 0 ? `SHORT ${-slack}` : `+${slack}`}`,
    );
    await fillSection(child);
    const labels = await child.$$eval("div[role=button]", (els) =>
      els.map((e) => e.textContent.trim()),
    );
    if (labels.some((l) => /^submit$/i.test(l))) break; // last section: never submit
    const next = await child.$("div[role=button]:has-text('Next')");
    if (!next) break;
    await next.click();
    await page.waitForTimeout(1800);
  }
  console.log(`${String(width).padStart(4)}px  ${row.join("  |  ")}`);
  await context.close();
}
await browser.close();
console.log(
  short
    ? `\n${short} section(s) scroll inside the frame.`
    : "\nNo section scrolls inside the frame.",
);
