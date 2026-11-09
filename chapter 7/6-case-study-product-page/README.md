# 6: Case Study, the Product Page That Was Only Slow in Production

The Case Study's two versions, side by side in one app, and a simulated
field that measures both with the app's own reporting code.

- `/before/product/[id]` (`app/(before)/`): the hero, name, and price wait
  together for the pricing service (about 600 ms) inside one `<Suspense>`
  boundary; the price formats with the runtime's default locale; a chat
  widget (`public/chat-widget.js`) loads with `strategy="beforeInteractive"`;
  the reviews section's boundary (`components/SectionBoundary.tsx`, made with
  `catchError`) doesn't report; there is no server-side error reporting.
- `/after/product/[id]` (`app/(after)/`): the hero and name are in the
  static shell and only the price waits, with a same-size skeleton; the
  server picks the locale from `Accept-Language`; the chat widget's script
  loads when the reader presses the chat button (`components/ChatButton.tsx`);
  the reviews boundary reports, and `instrumentation.ts` records server
  errors for these routes.
- Both versions: `components/WebVitals.tsx` reports Web Vitals from the
  `web-vitals/attribution` build with route, release, locale, device class,
  and the LCP and INP breakdowns, to `/api/vitals`; `instrumentation-client.ts`
  reports uncaught browser errors to `/api/errors`.
- The reviews service (`lib/catalog.ts`) times out for products with more
  than 500 reviews (`/…/product/expedition-tent`).

The chat widget is a stand-in: about 1.2 s of start-up work in 120 ms
chunks, then a 300 ms task every 500 ms for about 12 seconds.

## Run it yourself

```bash
npm install
npx playwright install chromium   # once, for npm run measure
npm run build && npm start        # http://localhost:3000/before/product/alpine-shell
npm run measure                   # lab baseline + simulated field (about 15 minutes)
npm run report                    # segments and the case study's table, writes measurements.json
```

`VISITS=10 npm run measure` makes a quicker, noisier run.

## The simulated field

40 visits to each version, alternating between them:

- Half on a phone (412 px viewport at 2x, CPU throttled 4x). Two thirds of
  those on Lighthouse's slow 4G profile (150 ms, 1.6 Mbps), one third on a
  slower 3G-class link (400 ms, 400 Kbps). Half on an unthrottled desktop.
- Half with an English (en-US) browser, half German (de-DE).
- Every fifth visit opens the product whose reviews time out.

Each visitor taps the size picker 1.5 s after the first paint, taps again
1.3 s later, waits for the page to finish loading, and leaves. Taps are
sent as raw input at the button's position after a random pause of up to
half a second: `page.click()` waits for the page's main thread to answer
its checks, so it only ever taps between long tasks and never sees input
delay.

## What we measured

Next.js 16.4.5, React 19.3.1, web-vitals 6.2.3, production build, headless
Chromium 153 driven by Playwright 1.63, on a 2-core cloud Linux container,
release `release-214`. Measured 2026-11-09.

**Lab baseline** (unthrottled desktop, 5 loads, 75th percentile LCP):
before 772 ms, after 100 ms.

**Field, by segment** (75th percentiles):

| Version | Segment | LCP | INP | CLS |
|---|---|---|---|---|
| Before | mobile, en-US | 1,372 ms | 104 ms | 0 |
| Before | mobile, de-DE | 1,400 ms | 32 ms | 0 |
| Before | desktop, en-US | 764 ms | 224 ms | 0.052 |
| Before | desktop, de-DE | 896 ms | 248 ms | 0.052 |
| After | mobile, en-US | 1,160 ms | 24 ms | 0 |
| After | mobile, de-DE | 1,156 ms | 24 ms | 0 |
| After | desktop, en-US | 156 ms | 16 ms | 0 |
| After | desktop, de-DE | 108 ms | 16 ms | 0 |

**The case study's table:**

| Measurement | Before | After |
|---|---|---|
| LCP, 75th percentile, mobile | 1,380 ms | 1,160 ms |
| Median LCP resource load delay, mobile | 632 ms | 189 ms |
| INP, 75th percentile, mobile | 96 ms | 24 ms |
| INP, 75th percentile, slowest segment | 248 ms | 24 ms |
| CLS, 75th percentile, desktop | 0.052 | 0 |
| Hydration mismatches per 1,000 German visits | 1,000 | 0 |
| Reviews failures shown to readers, and reported | 8 shown, 0 reported | 8 shown, 8 reported |

- Median mobile LCP parts, before: TTFB 7, load delay 632, load duration
  691, render delay 35 ms. After: 7, 189, 922, 23 ms. The download is the
  largest part in both, but before, the photo also waited for the pricing
  service on every load.
- INP, before: 19 of 39 visits that reported INP had an interaction slower
  than 100 ms. In those, the median input delay was 183 ms against 4 ms of
  processing, and the long animation frames attached to all 19 named
  `chat-widget.js`. After: one interaction over 100 ms in 40 visits, and no
  chat widget script in any.
- Every German visit to the before version produced one `Minified React
  error #418` report through the global listener.
- The reviews timeout was shown 8 times in each version. Before, nothing
  reached error reporting. After, each failure produced a server report
  (`onRequestError`) and a boundary report with the same digest.
- The desktop CLS came from the before version's hero boundary: its
  fallback was one line of text, and the hero that replaced it moved the
  size picker and the reviews.
- **Caveat:** on 7 of the 20 mobile visits per version (the slowest), the
  first tap came before the reporting code had loaded, and web-vitals
  reported no LCP for those visits, so the mobile LCP values cover the other
  13. Field data under-represents the slowest visits for reasons like this.

Raw data is in `data/` after a run (ignored by git); the summary is in
`measurements.json`.
