// npm run measure: build with and without the compiler, then measure the
// before and after explorers the same way (Table 6.1 in the chapter).
import { writeFileSync } from "node:fs";
import type { Browser } from "playwright";
import {
  buildAndStart, domNodes, launch, openPage, renders, resetRenders,
  scriptBytes, stop, worstInteraction,
} from "./harness.mts";

const variants = [
  { name: "compiler off", env: { REACT_COMPILER: "0" }, port: 3601 },
  { name: "compiler on", env: { REACT_COMPILER: "1" }, port: 3602 },
];
const routes = ["/before/catalogue", "/after/catalogue"];
const build = !process.argv.includes("--no-build");
const TEXT = "trail sock"; // ten characters
// This example's own components; Next.js's router components also show up
// in the counts after a navigation, and are reported separately.
const APP = [
  "CataloguePage", "ProductCard", "SaleBanner", "FilterBar", "SaleCountdown",
  "CartBadge", "AddToCart", "CompareTray", "CompareToggle", "CartProvider",
  "CompareProvider", "Pagination",
];
const RUNS = 3;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function ready(browser: Browser, url: string, o: Parameters<typeof openPage>[2] = {}) {
  const page = await openPage(browser, url, o);
  await page.waitForSelector(".card", { timeout: 60_000 }); // before: fetched after load
  await page.waitForTimeout(500);
  return page;
}

const results: any[] = [];
const browser = await launch();
for (const v of variants) {
  const server = await buildAndStart({ env: v.env, port: v.port, build });
  const base = `http://localhost:${v.port}`;
  try {
    for (const route of routes) {
      const r: any = { variant: v.name, route };

      // Load: DOM size and compressed JavaScript for the route.
      let page = await ready(browser, base + route);
      r.domNodes = await domNodes(page);
      r.scriptKB = Math.round((await scriptBytes(page)) / 1024);
      r.fetchedDataKB = Math.round((await page.evaluate(`performance.getEntriesByType("resource")
        .filter((e) => e.initiatorType === "fetch")
        .reduce((a, e) => a + e.encodedBodySize, 0)`)) / 1024);

      // Sale countdown: does it still change after the page re-renders?
      const first = await page.textContent(".deal");
      await page.waitForTimeout(1500);
      await page.locator("text=Add to cart").first().click();
      await page.waitForTimeout(300);
      r.countdownChanged = first !== (await page.textContent(".deal"));
      await page.context().close();

      // Renders while typing ten characters, and for one compare toggle.
      page = await ready(browser, base + route, { counter: true });
      await page.click("input[placeholder=Search]");
      await resetRenders(page);
      await page.keyboard.type(TEXT, { delay: 150 });
      await page.waitForTimeout(2500); // after: debounce + server response
      r.typing = await renders(page);
      r.typingApp = await renders(page, APP);
      await page.context().close();

      page = await ready(browser, base + route, { counter: true });
      await resetRenders(page);
      await page.locator("input[type=checkbox]").first().click();
      await page.waitForTimeout(300);
      r.compareToggle = await renders(page, APP);
      await page.context().close();

      // Worst keystroke-to-paint on a 4x-throttled CPU (median of 3 runs).
      const worst: number[] = [];
      for (let i = 0; i < RUNS; i++) {
        page = await ready(browser, base + route, { timing: true, cpuThrottle: 4 });
        await page.click("input[placeholder=Search]");
        await page.keyboard.type(TEXT, { delay: 150 });
        await page.waitForTimeout(3000);
        worst.push(Math.round((await worstInteraction(page)).worst));
        await page.context().close();
      }
      r.worstKeystrokeMs = median(worst);
      r.worstRuns = worst;

      results.push(r);
      console.log(`${v.name.padEnd(13)} ${route.padEnd(18)} dom=${r.domNodes} js=${r.scriptKB}KB ` +
        `data=${r.fetchedDataKB}KB typing=${r.typingApp.total} (all ${r.typing.total}, commits ${r.typing.commits}) compare=${r.compareToggle.total} ` +
        `worst=${r.worstKeystrokeMs}ms ${JSON.stringify(worst)} countdownChanged=${r.countdownChanged}`);
    }
  } finally {
    stop(server);
  }
}
await browser.close();
writeFileSync("measurements.json", JSON.stringify(results, null, 2));
