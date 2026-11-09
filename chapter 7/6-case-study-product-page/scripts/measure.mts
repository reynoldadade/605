// npm run measure: a simulated field. A fleet of visits to the before and
// after versions with mixed devices (mobile: 4x CPU + slow 4G; desktop:
// unthrottled) and locales (en-US, de-DE). Each visit taps the size picker
// early and again later, as readers do, then leaves. The app's own
// reporters send Web Vitals and errors to data/*.ndjson; report.mts
// summarizes them. Also records a lab baseline (unthrottled desktop).
// Mobile visits: two thirds on slow 4G, one third on a slow 3G-class link.
import { rmSync, writeFileSync } from "node:fs";
import { buildAndStart, launch, openPage, vitals, hide, pct, round, SLOW_4G } from "./harness.mts";

// The slower end of a real mobile audience: a congested 3G-class link.
const SLOW_3G = { latency: 400, down: 400 * 1024 / 8, up: 400 * 1024 / 8 };

async function tap(page: import("playwright").Page, selector: string) {
  const box = (await page.locator(selector).boundingBox())!;
  // reading the position needs the main thread, so wait a random moment
  // before tapping, as a reader's finger would
  await page.waitForTimeout(Math.random() * 500);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

const VISITS = Number(process.env.VISITS ?? 40);   // per version
const PORT = 3706;
rmSync("data", { recursive: true, force: true });
const server = await buildAndStart({ port: PORT, build: !process.argv.includes("--no-build"),
  env: { NEXT_DEPLOYMENT_ID: "release-214" } });
const browser = await launch();
const visits: any[] = [];
const lab: any = {};
try {
  // lab baseline: a developer's laptop, unthrottled, five loads
  for (const v of ["before", "after"]) {
    const lcp: number[] = [];
    for (let i = 0; i < 5; i++) {
      const page = await openPage(browser, `http://localhost:${PORT}/${v}/product/alpine-shell`);
      await page.waitForTimeout(1500); await hide(page);
      lcp.push((await vitals(page)).LCP?.value); await page.context().close();
    }
    lab[v] = { desktopUnthrottledLcpP75: round(pct(lcp, 75)) };
  }
  rmSync("data", { recursive: true, force: true });

  for (let i = 0; i < VISITS; i++) {
    for (const v of ["before", "after"]) {
      const mobile = i % 2 === 0;
      const network = i % 6 === 0 ? SLOW_3G : SLOW_4G;  // a third of mobile visits
      const locale = Math.floor(i / 2) % 2 === 0 ? "en-US" : "de-DE";
      const tent = i % 5 === 4;                       // every fifth visit
      const id = tent ? "expedition-tent" : "alpine-shell";
      const page = await openPage(browser, null, mobile
        ? { mobile: true, cpu: 4, network, locale, vitals: false }
        : { locale, vitals: false });
      await page.goto(`http://localhost:${PORT}/${v}/product/${id}`, { waitUntil: "commit" });
      // readers start tapping soon after something appears on screen
      await page.waitForFunction(() => performance.getEntriesByType("paint").length > 0,
        null, { polling: 100 });
      await page.waitForTimeout(1500);
      // Taps in the first seconds, sent as raw input at the button's
      // position: page.click() waits for the page's main thread to answer
      // its checks, so it would only ever tap between long tasks.
      await tap(page, "button >> text=/^L$/");
      await page.waitForTimeout(1300);
      await tap(page, "button >> text=/^S$/");
      await page.waitForTimeout(800);
      // stay until the page has fully loaded, so even the slowest visits
      // report their metrics (a reader who leaves earlier never does)
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000);
      const reviewsFailed = await page.locator(".section-error").count() > 0;
      await hide(page);
      await page.waitForTimeout(300);
      visits.push({ version: v, mobile, locale, product: id, reviewsFailed });
      await page.context().close();
    }
  }
} finally {
  await browser.close();
  try { process.kill(-server.pid!, "SIGTERM"); } catch {}
}
writeFileSync("data/visits.json", JSON.stringify({ lab, visits }, null, 2));
console.log(JSON.stringify(lab));
