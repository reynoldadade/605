import { registerOTel } from "@vercel/otel";
import { trace } from "@opentelemetry/api";
import type { Instrumentation } from "next";

export function register() {
  // Exports to OTEL_EXPORTER_OTLP_ENDPOINT (set by scripts/measure.mts).
  registerOTel({
    serviceName: "storefront",
    instrumentationConfig: {
      // traceparent goes only to the app's own URLs by default
      fetch: { propagateContextUrls: [/localhost:4001/] },
    },
  });
}

// Server errors, with the trace ID of the request that failed.
export const onRequestError: Instrumentation.onRequestError = async (
  err, request, context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const traceId = trace.getActiveSpan()?.spanContext().traceId ?? null;
  const { record } = await import("./lib/record");
  await record("errors.ndjson", {
    message: err instanceof Error ? err.message : String(err),
    path: request.path,
    routeType: context.routeType,
    traceId,
  });
};
