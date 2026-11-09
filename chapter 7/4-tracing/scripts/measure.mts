// npm run measure: starts the collector and the reviews service, builds
// and starts the app with OpenTelemetry exporting to the collector, then
// loads a product page, calls a Server Action, and triggers a server
// error. Writes trace.json (one product page trace) and measurements.json.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { buildAndStart, launch, openPage } from "./harness.mts";

const PORT = 3704;
rmSync("data", { recursive: true, force: true });
const env = {
  OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318",
  OTEL_EXPORTER_OTLP_PROTOCOL: "http/json",
};
const side = [
  spawn("node", ["services/collector.mjs"], { stdio: "ignore", detached: true }),
  spawn("node", ["services/reviews.mjs"], { stdio: "ignore", detached: true }),
];
const server = await buildAndStart({ port: PORT, env, build: !process.argv.includes("--no-build") });
const browser = await launch();
const out: any = {};
try {
  const serverTiming: any[] = [];
  for (let i = 0; i < 3; i++) {
    const page = await openPage(browser, `http://localhost:${PORT}/product/trail-sock`, { vitals: false });
    await page.waitForSelector("text=Also bought");
    serverTiming.push(await page.evaluate(() =>
      (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)
        .serverTiming.map((s) => ({ name: s.name, description: s.description }))));
    if (i === 2) {
      await page.click("text=Add to wishlist");
      await page.waitForSelector("text=Add to wishlist");
      await page.waitForTimeout(500);
    }
    await page.context().close();
  }
  out.serverTiming = serverTiming;
  await fetch(`http://localhost:${PORT}/boom`).then((r) => r.text());
  await new Promise((r) => setTimeout(r, 7000)); // batch export interval
} finally {
  await browser.close();
  try { process.kill(-server.pid!, "SIGTERM"); } catch {}
  await new Promise((r) => setTimeout(r, 1500));
  for (const s of side) try { process.kill(-s.pid!, "SIGTERM"); } catch {}
}

const spans = readFileSync("data/spans.ndjson", "utf8").trim().split("\n").map((l) => JSON.parse(l));
const byId = new Map(spans.map((s) => [s.spanId, s]));
const rootOf = (s: any) => { while (s.parentSpanId && byId.has(s.parentSpanId)) s = byId.get(s.parentSpanId); return s; };
const roots = spans.filter((s) => !s.parentSpanId || !byId.has(s.parentSpanId));
out.rootSpanNames = [...new Set(roots.map((s) => `${s.service}: ${s.name} (${s.attributes["next.span_type"] ?? "-"})`))];
// the last full product page request
const root = rootOf(spans.filter((s) => s.name === "render route (app) /product/[id]").at(-1));
const inTrace = spans.filter((s) => s.traceId === root.traceId).sort((a, b) => a.start - b.start);
const t0 = root.start;
out.trace = inTrace.map((s) => ({
  service: s.service, name: s.name, startMs: Math.round(s.start - t0),
  durationMs: Math.round(s.end - s.start), spanId: s.spanId, parentSpanId: s.parentSpanId,
  nextSpanType: s.attributes["next.span_type"],
}));
const stId = out.serverTiming.at(-1)?.[0]?.description?.split("-")[1];
out.serverTimingTraceIdMatchesATrace = !!stId && spans.some((s) => s.traceId === stId);
out.serverTimingMatchesPageRender = !!stId && spans.some((s) => s.traceId === stId && /render route/.test(s.name));
const action = spans.filter((s) => s.name === "addToWishlist").at(-1);
const chain = (s: any) => { const c = [s.name]; while (s.parentSpanId && byId.has(s.parentSpanId)) { s = byId.get(s.parentSpanId); c.push(s.name); } return c.reverse(); };
out.serverAction = action && { chain: chain(action), rootAttributes: rootOf(action).attributes };
out.getProductSpansOnRequests = spans.filter((s) => s.name === "getProduct").length;
out.reviewsServiceGotTraceparent = spans.filter((s) => s.service === "reviews")
  .every((s) => s.name !== "GET /reviews/:id" || s.attributes["traceparent.received"]);
out.errors = readFileSync("data/errors.ndjson", "utf8").trim().split("\n").map((l) => JSON.parse(l));
out.errorTraceIdMatchesATrace = out.errors.map((e: any) => !!e.traceId && spans.some((s) => s.traceId === e.traceId));
writeFileSync("trace.json", JSON.stringify(out.trace, null, 2));
writeFileSync("measurements.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify({ ...out, trace: undefined }, null, 2));
for (const s of out.trace) console.log(`${String(s.startMs).padStart(5)} +${String(s.durationMs).padStart(5)}  ${s.service.padEnd(10)} ${s.name}`);
