import { appendFile, mkdir } from "node:fs/promises";

const NAMES = new Set(["TTFB", "FCP", "LCP", "CLS", "INP"]);

// Receives one beacon per metric. Validates the shape, adds what the
// server knows (time, mobile hint), and appends a line to an NDJSON file.
export async function POST(request: Request) {
  let m: any;
  try {
    m = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!NAMES.has(m?.name) || typeof m.value !== "number" || typeof m.route !== "string") {
    return new Response(null, { status: 400 });
  }
  const line = {
    at: new Date().toISOString(),
    name: m.name,
    value: m.value,
    rating: String(m.rating),
    navigationType: String(m.navigationType),
    route: m.route,
    release: String(m.release).slice(0, 64),
    mobile: request.headers.get("sec-ch-ua-mobile") === "?1",
  };
  await mkdir("data", { recursive: true });
  await appendFile("data/vitals.ndjson", JSON.stringify(line) + "\n");
  return new Response(null, { status: 204 });
}
