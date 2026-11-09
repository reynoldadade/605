// npm run measure: the product island loaded in two locales, before and
// after the fix, on a 4x-throttled CPU, 7 runs each. Records hydration
// errors that reached window "error", the island-ready timing, and CLS.
import { writeFileSync } from "node:fs";
import { buildAndStart, launch, openPage, vitals, hide, median, round } from "./harness.mts";

const RUNS = Number(process.env.RUNS ?? 7);
const PORT = 3703;
const server = await buildAndStart({ port: PORT, build: !process.argv.includes("--no-build") });
const browser = await launch();
const results: any[] = [];
try {
  for (const path of ["/product/alpine-shell", "/fixed/alpine-shell"]) {
    for (const locale of ["en-US", "de-DE"]) {
      const ready: number[] = [], cls: number[] = [], errs: number[] = [];
      let sampleError = "", priceText = "";
      for (let i = 0; i < RUNS; i++) {
        const page = await openPage(browser, `http://localhost:${PORT}${path}`,
          { mobile: true, cpu: 4, locale });
        await page.waitForTimeout(2500);
        await hide(page);
        const r = await page.evaluate(() => ({
          errors: (window as any).__ERRORS__ as string[],
          ready: (window as any).__TIMINGS__?.["size-picker-ready"],
          price: document.querySelector(".price")?.textContent,
        }));
        const v = await vitals(page);
        ready.push(r.ready); cls.push(v.CLS?.value ?? 0); errs.push(r.errors.length);
        sampleError ||= r.errors[0] ?? ""; priceText = r.price ?? "";
        await page.context().close();
      }
      const row = { path, locale, price: priceText,
        hydrationErrorsPerLoad: median(errs), islandReadyMs: round(median(ready)),
        cls: Number(median(cls).toFixed(3)), sampleError,
        runs: { ready: ready.map(round), cls, errs } };
      results.push(row);
      console.log(JSON.stringify({ ...row, runs: undefined }));
    }
  }
} finally {
  await browser.close();
  try { process.kill(-server.pid!, "SIGTERM"); } catch {}
}
writeFileSync("measurements.json", JSON.stringify(results, null, 2));
