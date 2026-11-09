import { NextResponse } from "next/server";
import { trace } from "@opentelemetry/api";

// Puts the request's trace context in a Server-Timing header, which the
// browser exposes to page scripts through the Navigation Timing API
// (PerformanceNavigationTiming.serverTiming). Field reports can then carry
// the trace ID of the document request they measured.
export function proxy() {
  const res = NextResponse.next();
  const ctx = trace.getActiveSpan()?.spanContext();
  if (ctx) {
    res.headers.set("Server-Timing",
      `traceparent;desc="00-${ctx.traceId}-${ctx.spanId}-01"`);
  }
  return res;
}

export const config = { matcher: ["/product/:id*"] };
