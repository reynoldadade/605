# 3: Hydration Analysis

Section 7's measurements: how long the most important island takes to
become ready, and what a locale mismatch costs.

- `instrumentation-client.ts` marks `hydration-start` before React
  hydrates, and keeps every error that reaches the global `error` event.
- `components/SizePicker.tsx` measures from that mark to its own first
  effect (`size-picker-ready`).
- `/product/alpine-shell` formats the price with the runtime's default
  locale (`components/PriceTag.tsx`). The server renders en-US; a browser
  set to German renders de-DE, and hydration mismatches. The island is
  wrapped in its own `<Suspense>` boundary, which is what React falls back
  to.
- `/fixed/alpine-shell` reads the reader's locale from `Accept-Language`
  on the server and passes it down, so both sides format the same string.

The price is prerendered into the static shell with the build machine's
default locale. On a machine whose default isn't en-US, the mismatch
appears for en-US readers instead.

## Run it yourself

```bash
npm install
npx playwright install chromium   # once, for npm run measure
npm run measure                   # builds, measures, writes measurements.json
```

## What we measured

Next.js 16.4.5, React 19.3.1, production build, headless Chromium 153, as a
phone (412 px viewport at 2x) with the CPU throttled 4x. Medians of 7 loads
per row. Measured 2026-11-09.

| Route | Reader's locale | Price shown | Mismatch errors per load | Island ready | CLS |
|---|---|---|---|---|---|
| `/product/alpine-shell` | en-US | $1,299.00 | 0 | 390 ms | 0 |
| `/product/alpine-shell` | de-DE | 1.299,00 $ | 1 | 450 ms | 0 |
| `/fixed/alpine-shell` | en-US | $1,299.00 | 0 | 408 ms | 0 |
| `/fixed/alpine-shell` | de-DE | 1.299,00 $ | 0 | 387 ms | 0 |

- The `hydration-start` mark from `instrumentation-client.ts` was visible
  to `performance.measure` in the island's effect on every load, so the
  two-mark approximation works in a production build.
- Each German load produced exactly one error at the global `error`
  listener: `Minified React error #418` with `args[]=text`, React's
  production message for a text mismatch during hydration. Grouping by
  that message is how a tracker counts these.
- The mismatch cost the island about 60 ms before it was ready, the time
  to render its boundary again on the client, on top of the normal
  hydration. The page didn't shift here (CLS 0), because the replacement
  price took the same space. In the case study, where the price sits above
  other content and changes width, the same mismatch caused a shift.
- With the locale chosen on the server, both locales hydrate without an
  error, and German readers get the same timing as everyone else.

Raw runs are in `measurements.json`.
