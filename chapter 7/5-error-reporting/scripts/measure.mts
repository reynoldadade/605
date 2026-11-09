// npm run measure: triggers each kind of error in a production build and
// counts which reporting path saw it. Writes measurements.json.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { buildAndStart, launch, openPage } from "./harness.mts";

const PORT = 3705;
const REPEAT = 5;
rmSync("data", { recursive: true, force: true });
const server = await buildAndStart({ port: PORT, build: !process.argv.includes("--no-build") });
const browser = await launch();
const scenarios = [
  { name: "Client render error, caught by app/product/[id]/error.tsx", path: "/product/trail-sock", click: "text=Show size chart" },
  { name: "Server Component error, caught by the same error.tsx", path: "/product/broken" },
  { name: "Client render error, no error.tsx (built-in boundary)", path: "/plain", click: "text=Show size chart" },
  { name: "Error thrown in an event handler", path: "/handler", click: "text=Throw in a handler" },
  { name: "Unhandled promise rejection", path: "/handler", click: "text=Reject a promise" },
];
const results: any[] = [];
try {
  for (const s of scenarios) {
    rmSync("data/errors.ndjson", { force: true });
    for (let i = 0; i < REPEAT; i++) {
      const page = await openPage(browser, `http://localhost:${PORT}${s.path}`, { vitals: false });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      if (s.click) await page.click(s.click);
      await page.waitForTimeout(800);
      await page.context().close();
    }
    await new Promise((r) => setTimeout(r, 500));
    let lines: any[] = [];
    try { lines = readFileSync("data/errors.ndjson", "utf8").trim().split("\n").map((l) => JSON.parse(l)); } catch {}
    const count = (src: string) => lines.filter((l) => l.source === src).length;
    const server = lines.filter((l) => l.source === "server");
    const boundary = lines.filter((l) => l.source === "boundary");
    results.push({
      scenario: s.name, triggered: REPEAT,
      reportsBySource: { server: count("server"), client: count("client"), boundary: count("boundary") },
      boundaryMessages: [...new Set(boundary.map((l) => l.error?.message))],
      digestsMatch: boundary.length ? boundary.every((b) => !b.digest || server.some((x) => x.digest === b.digest)) : null,
      serverRouteType: server[0]?.routeType,
      sampleClientStack: lines.find((l) => l.source !== "server")?.error?.stack?.split("\n").slice(0, 2).join(" | "),
    });
    console.log(JSON.stringify(results.at(-1)));
  }
} finally {
  await browser.close();
  try { process.kill(-server.pid!, "SIGTERM"); } catch {}
}
writeFileSync("measurements.json", JSON.stringify(results, null, 2));
