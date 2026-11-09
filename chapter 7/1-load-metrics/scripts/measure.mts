// npm run measure: LCP of the same product page built three ways, on a
// throttled mobile profile (4x CPU, Lighthouse's slow 4G), 20 cold loads
// each. Writes measurements.json.
import { writeFileSync } from "node:fs";
import { buildAndStart, launch, openPage, vitals, hide, pct, median, round, SLOW_4G } from "./harness.mts";

const RUNS = Number(process.env.RUNS ?? 20);
const PORT = 3701;
const routes = [
  { name: "Hero in the shell, eager with high priority", path: "/product/trail-sock" },
  { name: "Hero in the shell, lazy-loaded (the default)", path: "/lazy/trail-sock" },
  { name: "Hero inside a Suspense boundary that waits 800 ms", path: "/suspended/trail-sock" },
];
const PARTS = ["timeToFirstByte", "resourceLoadDelay", "resourceLoadDuration", "elementRenderDelay"];

const server = await buildAndStart({ port: PORT, build: !process.argv.includes("--no-build") });
const browser = await launch();
const results: any[] = [];
try {
  // warm the image optimizer so every run measures delivery, not resizing
  for (const r of routes) {
    const p = await openPage(browser, `http://localhost:${PORT}${r.path}`, { mobile: true });
    await p.waitForTimeout(1500); await p.context().close();
  }
  for (const r of routes) {
    const runs: any[] = [];
    for (let i = 0; i < RUNS; i++) {
      const page = await openPage(browser, `http://localhost:${PORT}${r.path}`,
        { mobile: true, cpu: 4, network: SLOW_4G });
      await page.waitForTimeout(2500);
      await hide(page);
      const v = await vitals(page);
      runs.push({ lcp: v.LCP?.value, fcp: v.FCP?.value, ttfb: v.TTFB?.value,
        cls: v.CLS?.value, target: v.LCP?.attribution?.target, ...v.LCP?.attribution });
      await page.context().close();
    }
    const parts = Object.fromEntries(PARTS.map((k) => [k, round(median(runs.map((x) => x[k])))]));
    const largest = PARTS.reduce((a, b) => (parts[a] >= parts[b] ? a : b));
    const row = {
      version: r.name, path: r.path,
      lcpP75: round(pct(runs.map((x) => x.lcp), 75)),
      fcpP75: round(pct(runs.map((x) => x.fcp), 75)),
      lcpElement: runs[0].target,
      medianParts: parts, largestPart: largest,
      runs: runs.map((x) => ({ lcp: round(x.lcp), fcp: round(x.fcp), ttfb: round(x.ttfb),
        cls: x.cls, ...Object.fromEntries(PARTS.map((k) => [k, round(x[k])])) })),
    };
    results.push(row);
    console.log(JSON.stringify({ ...row, runs: undefined }));
  }
} finally {
  await browser.close();
  try { process.kill(-server.pid!, "SIGTERM"); } catch {}
}
writeFileSync("measurements.json", JSON.stringify(results, null, 2));
