# 4: Distributed Tracing

Section 8's tracing setup, end to end, with nothing outside this folder:

- `instrumentation.ts` registers OpenTelemetry with `@vercel/otel` and
  lists the reviews service in `propagateContextUrls`, so outgoing `fetch`
  calls to it carry a `traceparent` header. Its `onRequestError` records
  each server error with the active trace ID.
- `lib/data/*.ts` is the data access layer. Every function runs inside a
  custom span (`lib/data/tracer.ts`). `getProduct` is cached with
  `"use cache"`, `getReviews` calls the reviews service, and
  `getRecommendations` takes about 600 ms.
- `services/reviews.mjs` is a separate service. It reads `traceparent` and
  reports its own spans as children of the caller's span.
- `services/collector.mjs` is a minimal OTLP/HTTP JSON receiver standing in
  for an OpenTelemetry Collector or a tracing backend. It writes one span
  per line to `data/spans.ndjson`.
- `proxy.ts` puts the request's trace context in a `Server-Timing` header,
  which page scripts can read from the Navigation Timing API.

## Run it yourself

```bash
npm install
npx playwright install chromium   # once, for npm run measure
npm run measure                   # starts everything, writes trace.json and measurements.json
```

To explore by hand, run `npm run collector` and `npm run reviews` in two
terminals, then build and start the app with
`OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` and
`OTEL_EXPORTER_OTLP_PROTOCOL=http/json` set (`@vercel/otel` defaults to
protobuf, which this small collector doesn't read). Spans are exported in
batches every few seconds.

## What we measured

Next.js 16.4.5, React 19.3.1, @vercel/otel 2.2.0, OpenTelemetry SDK 2.12,
production build, on a 2-core cloud Linux container. Measured 2026-11-09.

**One product page request** (`/product/trail-sock`, the third of three
loads), from `trace.json`. Start and duration in ms, relative to the root
span; `·` marks depth in the tree. Zero-length spans are omitted.

| Span | Service | Start | Duration |
|---|---|---|---|
| GET | storefront | 0 | 3 |
| · GET /product/[id] | storefront | 3 | 625 |
| · · prepare route module | storefront | 4 | 1 |
| · · render route (app) /product/[id] | storefront | 7 | 618 |
| · · · · resolve segment modules | storefront | 8 | 1 |
| · · · build component tree | storefront | 8 | 6 |
| · · start response | storefront | 9 | 0 |
| · · · · fetch GET http://localhost:4001/reviews/trail-sock | storefront | 21 | 125 |
| · · · getReviews | storefront | 21 | 126 |
| · · · getRecommendations | storefront | 23 | 601 |
| · · · · · GET /reviews/:id | reviews | 24 | 149 |
| · · · · · · SELECT reviews | reviews | 24 | 119 |
| · · NextNodeServer.clientComponentLoading | storefront | 25 | 3 |
| · · · build component tree | storefront | 165 | 1 |

- The root `GET` span ends after 3 ms and `GET /product/[id]` carries the
  rendering: Next.js's request span and its route span are separate.
- `start response` at 9 ms is the static shell being sent. `getReviews` and
  `getRecommendations` start after it, inside their `<Suspense>` boundaries,
  and run in parallel. Recommendations set the length of the response.
- The reviews service's spans (`GET /reviews/:id`, `SELECT reviews`) are
  children of the storefront's `fetch` span: the trace crosses services.
- There is no `getProduct` span. The product was cached at build time, so
  the function body, and the span inside it, never ran during these
  requests (0 `getProduct` spans across all three loads).

**Other checks**

- `Server-Timing` from `proxy.ts`: on every load, the trace ID in the
  header matched a trace in the collector that contained the
  `render route (app) /product/[id]` span. The proxy runs inside the
  request's trace (its span is named `middleware GET`).
- Server Action: clicking Add to wishlist produced a trace whose root span
  is `POST` (`http.target` `/product/trail-sock`), with a child
  `POST /product/[id]` and the action's own `addToWishlist` span under it.
  No attribute names the action, so a custom span inside it is what makes
  an action identifiable in a trace.
- `onRequestError`: the error thrown by `/boom` was recorded with
  `routeType` `render` and a trace ID that matched a trace in the
  collector, so `trace.getActiveSpan()` works inside `onRequestError`.
- `register instrumentation` and `load instrumentation module` appear as
  their own root spans, separate from any request, as the Next.js
  documentation describes.

Full results are in `measurements.json`.
