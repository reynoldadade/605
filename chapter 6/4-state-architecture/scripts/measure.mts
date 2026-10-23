// npm run measure: build with and without the compiler, perform the same
// interactions on each page, and count which component functions ran.
import { writeFileSync } from "node:fs";
import type { Page } from "playwright";
import { buildAndStart, launch, openPage, renders, resetRenders, stop } from "./harness.mts";

const variants = [
  { name: "compiler off", env: { REACT_COMPILER: "0" }, port: 3401 },
  { name: "compiler on", env: { REACT_COMPILER: "1" }, port: 3402 },
];
const build = !process.argv.includes("--no-build");

type Step = { route: string; action: string; run: (p: Page) => Promise<void> };
const steps: Step[] = [
  ...["effect", "calculated"].map((v) => ({
    route: `/derive/${v}`,
    action: "slider moved 5 steps",
    run: async (p: Page) => {
      await p.focus("input[type=range]");
      for (let i = 0; i < 5; i++) {
        await p.keyboard.press("ArrowLeft");
        await p.waitForTimeout(100);
      }
    },
  })),
  ...["single", "split", "store"].flatMap((v) => [
    { route: `/cart/${v}`, action: "open drawer",
      run: (p: Page) => p.click("text=Open cart") },
    { route: `/cart/${v}`, action: "add one item",
      run: (p: Page) => p.locator("text=Add to cart").first().click() },
  ]),
  { route: "/product/p1", action: "open disclosure",
    run: (p: Page) => p.click("text=Specifications") },
];

const results: any[] = [];
const browser = await launch();
for (const v of variants) {
  const server = await buildAndStart({ env: v.env, port: v.port, build });
  try {
    for (const s of steps) {
      const page = await openPage(browser, `http://localhost:${v.port}${s.route}`, { counter: true });
      await resetRenders(page);
      await s.run(page);
      await page.waitForTimeout(200);
      results.push({ variant: v.name, route: s.route, action: s.action, ...(await renders(page)) });
      await page.context().close();
    }
  } finally {
    stop(server);
  }
}
await browser.close();

writeFileSync("measurements.json", JSON.stringify(results, null, 2));
for (const r of results) {
  const detail = Object.entries(r.counts).map(([k, n]) => `${k}×${n}`).join(", ");
  console.log(`${r.variant.padEnd(13)} ${r.route.padEnd(18)} ${r.action.padEnd(22)} commits=${r.commits} renders=${r.total}  ${detail}`);
}
