# 5: Error Reporting

Section 9's three reporting paths, and which errors each one sees in a
production build.

- **Server:** `onRequestError` in `instrumentation.ts`, for errors while
  rendering, in Route Handlers, Server Actions, and the proxy
- **Browser, uncaught:** `error` and `unhandledrejection` listeners in
  `instrumentation-client.ts`, which runs before hydration
- **Browser, caught by our boundary:** `app/product/[id]/error.tsx`, which
  reports what it catches from an effect

All reports go to `data/errors.ndjson` (browser reports through the
`/api/errors` Route Handler). `lib/serialize.ts` turns any thrown value into
JSON, since thrown values aren't always `Error` instances.

Scenarios:

| Route | What happens |
|---|---|
| `/product/trail-sock`, click Show size chart | a Client Component throws while rendering, inside the segment that has `error.tsx` |
| `/product/broken` | a Server Component throws while rendering, same segment |
| `/plain`, click Show size chart | the same client render error in a segment with no `error.tsx` anywhere above it |
| `/handler`, Throw in a handler | an `onClick` handler throws |
| `/handler`, Reject a promise | a promise rejects with no handler |

## Run it yourself

```bash
npm install
npx playwright install chromium   # once, for npm run measure
npm run measure                   # builds, triggers each error 5 times, writes measurements.json
```

## What we measured

Next.js 16.4.5, React 19.3.1, production build, headless Chromium 153.
Measured 2026-11-09. Each scenario was triggered 5 times, in a fresh page
each time, after the page had hydrated.

| Scenario | Server reports | Global listener reports | Boundary reports |
|---|---|---|---|
| Client render error, caught by `error.tsx` | 0 | 0 | 5 |
| Server Component error, caught by the same `error.tsx` | 5 | 0 | 5 |
| Client render error, no `error.tsx` (built-in boundary) | 0 | 5 | 0 |
| Error thrown in an event handler | 0 | 5 | 0 |
| Unhandled promise rejection | 0 | 5 | 0 |

- An error caught by our own `error.tsx` never reached the global `error`
  listener: 0 of 5. Next.js logs it to the console and nothing else, so the
  boundary has to report it. In the Next.js 16.4 source, the client's
  `onCaughtError` treats only its own built-in boundaries as uncaught.
- The same render error with no `error.tsx` above it reached the global
  listener every time, because Next.js passes errors caught by its
  built-in boundary on as uncaught.
- For the Server Component error, `onRequestError` received the original
  message (`inventory service returned 500`) with `routeType` `render`. The
  boundary in the browser received a replacement message, React's minified
  error #441, and the same `digest`: every boundary report's digest matched
  a server report.
- Browser stack traces point at minified chunks, such as
  `at o (http://localhost:3705/_next/static/chunks/173pmwvwkc0md.js:1:185)`.
  This example doesn't generate source maps; section 9 explains how to
  translate these without publishing the maps.

Full results are in `measurements.json`.
