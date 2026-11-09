// A minimal OTLP/HTTP JSON trace receiver standing in for an OpenTelemetry
// Collector or a tracing backend. Listens on :4318/v1/traces and appends
// one flattened span per line to data/spans.ndjson.
import { createServer } from "node:http";
import { appendFileSync, mkdirSync } from "node:fs";

mkdirSync("data", { recursive: true });
const attrs = (list = []) =>
  Object.fromEntries(list.map((a) => [a.key, Object.values(a.value ?? {})[0]]));

createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    try {
      const msg = JSON.parse(body);
      for (const rs of msg.resourceSpans ?? []) {
        const service = attrs(rs.resource?.attributes)["service.name"];
        for (const ss of rs.scopeSpans ?? []) {
          for (const s of ss.spans ?? []) {
            appendFileSync("data/spans.ndjson", JSON.stringify({
              service, name: s.name, traceId: s.traceId, spanId: s.spanId,
              parentSpanId: s.parentSpanId || null,
              start: Number(BigInt(s.startTimeUnixNano) / 1000n) / 1000,
              end: Number(BigInt(s.endTimeUnixNano) / 1000n) / 1000,
              status: s.status?.code ?? 0, attributes: attrs(s.attributes),
            }) + "\n");
          }
        }
      }
    } catch (e) {
      console.error("collector: could not parse", String(e).slice(0, 200));
    }
    res.writeHead(200, { "content-type": "application/json" }).end("{}");
  });
}).listen(4318, () => console.log("collector on :4318"));
