// npm run report: the case study's segments and Table 7.3, from the
// field data in data/*.ndjson. Writes measurements.json.
import { readFileSync, writeFileSync } from "node:fs";
import { pct, median, round } from "./harness.mts";

const read = (f: string) => readFileSync(`data/${f}`, "utf8").trim().split("\n").map((l) => JSON.parse(l));
const vitals = read("vitals.ndjson");
const errors = read("errors.ndjson");
const { lab, visits } = JSON.parse(readFileSync("data/visits.json", "utf8"));
const versionOf = (path: string) => (path.startsWith("/before") ? "before" : "after");

const out: any = { lab, segments: {}, table: {} };
for (const v of ["before", "after"]) {
  const mine = vitals.filter((m) => versionOf(m.route) === v);
  const p75 = (name: string, f: (m: any) => boolean) =>
    pct(mine.filter((m) => m.name === name && f(m)).map((m) => m.value), 75);
  const seg: any = {};
  for (const device of ["mobile", "desktop"]) {
    for (const locale of ["en-US", "de-DE"]) {
      const f = (m: any) => m.device === device && m.locale === locale;
      seg[`${device} ${locale}`] = {
        LCP: round(p75("LCP", f)), INP: round(p75("INP", f)),
        CLS: Number(p75("CLS", f).toFixed(3)), visits: mine.filter((m) => m.name === "LCP" && f(m)).length,
      };
    }
  }
  const lcpMobile = mine.filter((m) => m.name === "LCP" && m.device === "mobile");
  const parts = ["timeToFirstByte", "resourceLoadDelay", "resourceLoadDuration", "elementRenderDelay"];
  const medParts = Object.fromEntries(parts.map((k) => [k, round(median(lcpMobile.map((m) => m.lcpParts?.[k] ?? 0)))]));
  const inp = mine.filter((m) => m.name === "INP" && m.device === "mobile");
  const inpParts = Object.fromEntries(["inputDelay", "processingDuration", "presentationDelay"]
    .map((k) => [k, round(median(inp.map((m) => m.inpParts?.[k] ?? 0)))]));
  const scripts: Record<string, number> = {};
  for (const m of inp) for (const s of new Set<string>(m.inpParts?.scripts ?? [])) scripts[s] = (scripts[s] ?? 0) + 1;

  const deVisits = visits.filter((x: any) => x.version === v && x.locale === "de-DE").length;
  const mismatches = errors.filter((e) => versionOf(e.path) === v && e.source === "client"
    && /#418|#425|hydrat/i.test(e.error?.message ?? "")).length;
  const shownFallbacks = visits.filter((x: any) => x.version === v && x.reviewsFailed).length;
  const reported = errors.filter((e) => versionOf(e.path) === v && e.source === "boundary").length;
  const serverReports = errors.filter((e) => versionOf(e.path) === v && e.source === "server").length;

  out.segments[v] = { ...seg, lcpMobileMedianParts: medParts, inpMobileMedianParts: inpParts,
    inpMobileScriptsSeen: scripts };
  out.table[v] = {
    lcpP75Mobile: round(p75("LCP", (m) => m.device === "mobile")),
    lcpLargestPartMobile: parts.reduce((a, b) => (medParts[a] >= medParts[b] ? a : b)),
    inpP75Mobile: round(p75("INP", (m) => m.device === "mobile")),
    clsP75DeDE: Number(p75("CLS", (m) => m.locale === "de-DE").toFixed(3)),
    clsP75Mobile: Number(p75("CLS", (m) => m.device === "mobile").toFixed(3)),
    hydrationMismatchesPer1000DeVisits: Math.round((mismatches / Math.max(1, deVisits)) * 1000),
    sectionFallbacksShown: shownFallbacks,
    boundaryReports: reported, serverReports,
  };
}
writeFileSync("measurements.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
