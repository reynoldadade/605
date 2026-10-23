// npm run measure: build with and without the compiler and check what the
// two rule-breaking pages actually do in the browser.
import { writeFileSync } from "node:fs";
import { buildAndStart, launch, openPage, stop } from "./harness.mts";

const variants = [
  { name: "compiler off", env: { REACT_COMPILER: "0" }, port: 3201 },
  { name: "compiler on", env: { REACT_COMPILER: "1" }, port: 3202 },
];
const build = !process.argv.includes("--no-build");
const results: any[] = [];
const browser = await launch();

for (const v of variants) {
  const server = await buildAndStart({ env: v.env, port: v.port, build });
  try {
    // Purity: re-render twice, a second apart, and read the timestamp.
    let page = await openPage(browser, `http://localhost:${v.port}/purity`);
    const times = [await page.textContent("#checked-at")];
    for (let i = 0; i < 2; i++) {
      await page.waitForTimeout(1000);
      await page.click("button");
      await page.waitForTimeout(100);
      times.push(await page.textContent("#checked-at"));
    }
    const buttonText = await page.textContent("button");
    results.push({ variant: v.name, page: "/purity", times, buttonText });
    await page.context().close();

    // Mutation: add two items to the basket and read what's on screen.
    page = await openPage(browser, `http://localhost:${v.port}/mutation`);
    for (let i = 0; i < 2; i++) {
      await page.click("button");
      await page.waitForTimeout(100);
    }
    const count = await page.textContent("#count");
    const listed = await page.$$eval("#price-list li", (lis) => lis.map((li) => li.textContent));
    results.push({ variant: v.name, page: "/mutation", count, listed });
    await page.context().close();
  } finally {
    stop(server);
  }
}
await browser.close();
writeFileSync("measurements.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
