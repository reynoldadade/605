// npm run measure: build the app with and without the React Compiler,
// type the same ten characters into the review box on both routes, and
// count which component functions ran.
import { writeFileSync } from "node:fs";
import { buildAndStart, launch, openPage, renders, resetRenders, stop } from "./harness.mts";

const TEXT = "Great shoe"; // ten characters
const routes = ["/product/p1", "/moved/p1"];
const variants = [
  { name: "compiler off", env: { REACT_COMPILER: "0" }, port: 3101 },
  { name: "compiler on", env: { REACT_COMPILER: "1" }, port: 3102 },
];

const results: any[] = [];
const browser = await launch();
for (const v of variants) {
  const server = await buildAndStart({ env: v.env, port: v.port, build: !process.argv.includes("--no-build") });
  try {
    for (const route of routes) {
      const page = await openPage(browser, `http://localhost:${v.port}${route}`, { counter: true });
      await page.click("textarea");
      await resetRenders(page);
      await page.keyboard.type(TEXT, { delay: 30 });
      await page.waitForTimeout(200);
      const r = await renders(page);
      results.push({ variant: v.name, route, ...r });
      await page.context().close();
    }
  } finally {
    stop(server);
  }
}
await browser.close();

writeFileSync("measurements.json", JSON.stringify(results, null, 2));
for (const r of results) {
  console.log(`\n${r.variant}  ${r.route}  commits=${r.commits}  component renders=${r.total}`);
  for (const [k, n] of Object.entries(r.counts).sort((a: any, b: any) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${k}`);
  }
}
