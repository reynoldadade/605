// npm run report: 75th percentile of each metric per route and navigation
// type, from data/vitals.ndjson.
import { readFileSync } from "node:fs";
import { pct } from "./harness.mts";

const lines = readFileSync("data/vitals.ndjson", "utf8").trim().split("\n").map((l) => JSON.parse(l));
const groups = new Map<string, number[]>();
for (const l of lines) {
  const k = [l.route, l.navigationType, l.name].join(" | ");
  groups.set(k, [...(groups.get(k) ?? []), l.value]);
}
console.log(`${lines.length} reports, releases: ${[...new Set(lines.map((l) => l.release))].join(", ")}`);
console.log("route | navigationType | metric | count | p75");
for (const [k, vs] of [...groups].sort()) {
  const p = pct(vs, 75);
  console.log(`${k} | ${vs.length} | ${p < 1 ? p.toFixed(3) : Math.round(p)}`);
}
