// npm run measure: keystroke responsiveness on a 4x-throttled CPU (search),
// state kept across tab switches (tabs), and subscriptions opened (stock).
import { writeFileSync } from "node:fs";
import { buildAndStart, launch, openPage, stop, worstInteraction } from "./harness.mts";

const variants = [
  { name: "compiler off", env: { REACT_COMPILER: "0" }, port: 3501 },
  { name: "compiler on", env: { REACT_COMPILER: "1" }, port: 3502 },
];
const build = !process.argv.includes("--no-build");
const RUNS = 3;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const results: any[] = [];
const browser = await launch();
for (const v of variants) {
  const server = await buildAndStart({ env: v.env, port: v.port, build });
  const base = `http://localhost:${v.port}`;
  try {
    for (const route of ["/search/plain", "/search/deferred", "/search/bounded"]) {
      const worst: number[] = [];
      for (let i = 0; i < RUNS; i++) {
        const page = await openPage(browser, base + route, { timing: true, cpuThrottle: 4 });
        await page.click("input");
        await page.keyboard.type("trail sock", { delay: 150 });
        await page.waitForTimeout(1500);
        worst.push(Math.round((await worstInteraction(page)).worst));
        await page.context().close();
      }
      results.push({ variant: v.name, route, worstKeystrokeMs: median(worst), runs: worst });
    }

    for (const route of ["/tabs/conditional", "/tabs/activity"]) {
      const page = await openPage(browser, base + route);
      await page.click("text=Questions");
      await page.fill("textarea", "Does it run small?");
      await page.click("text=Reviews");
      await page.click("text=Questions");
      results.push({ variant: v.name, route, textareaAfterSwitch: await page.inputValue("textarea") });
      await page.context().close();
    }

    for (const route of ["/stock/dependency", "/stock/effect-event"]) {
      const page = await openPage(browser, base + route);
      for (let i = 0; i < 3; i++) {
        await page.click("button");
        await page.waitForTimeout(100);
      }
      const subs = await page.evaluate(() => document.body.dataset.subscriptions);
      results.push({ variant: v.name, route, subscriptionsAfter3Toggles: Number(subs) });
      await page.context().close();
    }
  } finally {
    stop(server);
  }
}
await browser.close();
writeFileSync("measurements.json", JSON.stringify(results, null, 2));
for (const r of results) console.log(JSON.stringify(r));
