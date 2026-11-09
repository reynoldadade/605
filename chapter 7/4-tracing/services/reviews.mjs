// The reviews service: a separate process with its own deploy. It reads
// the W3C `traceparent` header and reports its own spans to the collector
// as children of the caller's span, the way an instrumented service in
// any language would. (Written by hand to keep the example dependency-free.)
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const COLLECTOR = process.env.OTLP_URL ?? "http://localhost:4318/v1/traces";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowNs = () => BigInt(Date.now()) * 1_000_000n;
const id = (n) => randomBytes(n).toString("hex");

function exportSpans(spans) {
  return fetch(COLLECTOR, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ resourceSpans: [{
      resource: { attributes: [{ key: "service.name", value: { stringValue: "reviews" } }] },
      scopeSpans: [{ scope: { name: "reviews" }, spans }],
    }] }),
  }).catch(() => {});
}

createServer(async (req, res) => {
  const [, , productId] = req.url.split("/");           // /reviews/:id
  const [, traceId, parentId] = (req.headers.traceparent ?? "").split("-");
  const tid = traceId ?? id(16);
  const server = { traceId: tid, spanId: id(8), parentSpanId: parentId,
    name: "GET /reviews/:id", kind: 2, startTimeUnixNano: String(nowNs()) };
  const q = { traceId: tid, spanId: id(8), parentSpanId: server.spanId,
    name: "SELECT reviews", kind: 3, startTimeUnixNano: String(nowNs()) };
  await sleep(productId === "big" ? 1500 : 120);       // the query
  q.endTimeUnixNano = String(nowNs());
  const reviews = [
    { id: "r1", rating: 5, text: "Warm without being bulky." },
    { id: "r2", rating: 4, text: "Held up for a 40 km week." },
  ];
  res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(reviews));
  server.endTimeUnixNano = String(nowNs());
  server.attributes = [
    { key: "traceparent.received", value: { boolValue: !!traceId } },
    { key: "product.id", value: { stringValue: productId } },
  ];
  await exportSpans([server, q]);
}).listen(4001, () => console.log("reviews service on :4001"));
