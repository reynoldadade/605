// npm run measure: simulated visits that each load the home page, then
// navigate client-side to two product pages, pick a size on each, and
// leave. The app's own reporter sends every metric to /api/vitals, which
// appends to data/vitals.ndjson; scripts/report.mts summarizes it.
import { rmSync } from "node:fs";
import { buildAndStart, launch, openPage, hide } from "./harness.mts";

const VISITS = Number(process.env.VISITS ?? 10);
const PORT = 3702;
rmSync("data/vitals.ndjson", { force: true });
const server = await buildAndStart({
  port: PORT, build: !process.argv.includes("--no-build"),
  env: { NEXT_DEPLOYMENT_ID: "2026-11-10-1" },
});
const browser = await launch();
try {
  for (let i = 0; i < VISITS; i++) {
    const page = await openPage(browser, `http://localhost:${PORT}/`, { vitals: false, cpu: 2 });
    // wait for hydration: a click on a link React hasn't hydrated yet is
    // an ordinary full page load, not a client-side navigation
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.click("text=Trail Sock");
    await page.waitForURL("**/product/trail-sock");
    await page.waitForTimeout(800);
    await page.click("button:has-text('L')");
    await page.waitForTimeout(400);
    await page.click("text=See also");
    await page.waitForURL("**/product/summit-beanie");
    await page.waitForTimeout(800);
    await page.click("button:has-text('S')");
    await page.waitForTimeout(400);
    await hide(page);
    await page.waitForTimeout(300);
    await page.context().close();
  }
} finally {
  await browser.close();
  try { process.kill(-server.pid!, "SIGTERM"); } catch {}
}
