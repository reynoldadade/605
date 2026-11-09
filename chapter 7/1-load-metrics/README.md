# 1: Load Metrics

Section 3's LCP comparison. The same product page, built three ways:

- `/product/trail-sock`: the hero image in the static shell, loaded with
  `loading="eager"` and `fetchPriority="high"` (`components/ProductHero.tsx`)
- `/lazy/trail-sock`: the hero in the shell with `next/image`'s default,
  lazy loading
- `/suspended/trail-sock`: the hero inside a `<Suspense>` boundary whose
  component waits 800 ms for request-time data before it renders

Each page also streams a short reviews list from its own boundary, as
Chapter 4's product page does. Cache Components and Partial Prefetching
are on (`next.config.ts`).

## Run it yourself

```bash
npm install
npx playwright install chromium   # once, for npm run measure
npm run build && npm start        # http://localhost:3000
npm run measure                   # builds, measures, writes measurements.json
```

Requires Node.js 20 or later. `npm run measure -- --no-build` reuses the
existing build; `RUNS=5 npm run measure` changes the number of loads. Set
`CHROMIUM_PATH` to use an already-installed Chromium.

`scripts/harness.mts` injects the `web-vitals` attribution build into every
page before the app's own scripts run, so each load reports LCP and its
four parts exactly as field code using the same library would.

## What we measured

Next.js 16.4.5 (Turbopack), React 19.3.1, web-vitals 6.2.3, production
build, headless Chromium 153 driven by Playwright 1.63, on a 2-core cloud
Linux container. Measured 2026-11-09.

Each version was loaded 20 times, each in a fresh browser context (empty
cache), as a phone: 412 px wide viewport at 2x, CPU throttled 4x, and the
network throttled to Lighthouse's mobile profile (150 ms round trip,
1.6 Mbps down) through the DevTools protocol. The image optimizer was
warmed first, so the runs measure delivery, not resizing.

| Version | LCP, 75th percentile of 20 runs | Largest part (median) |
|---|---|---|
| Hero in the shell, eager with high priority | 1,124 ms | resource load duration (872 ms) |
| Hero in the shell, lazy-loaded (the default) | 1,268 ms | resource load duration (700 ms) |
| Hero inside a `<Suspense>` boundary that waits 800 ms | 1,484 ms | resource load delay (814 ms) |

Median LCP parts, in ms:

| Version | TTFB | Load delay | Load duration | Render delay |
|---|---|---|---|---|
| Eager, high priority | 7 | 211 | 872 | 21 |
| Lazy (default) | 6 | 536 | 700 | 21 |
| Behind an 800 ms boundary | 7 | 814 | 485 | 160 |

FCP was about 420 ms in all three, because the shell paints at the same
time whatever happens to the hero. The LCP element was the hero image
every time.

Lazy loading adds about 325 ms of load delay: the browser waits for
layout to place the image near the viewport before requesting it. The
download itself is a little shorter, because the image no longer competes
with the page's scripts. The boundary version's load delay is the 800 ms
the hero waits for, almost exactly. Making that image smaller would not
help much. Moving it out of the boundary does.

**About TTFB in these runs.** The DevTools protocol's network throttling
delays response bodies, not response headers, so the TTFB values above
show only the local server's time. The 150 ms round trip appears in the
other parts instead. Field TTFB on a real mobile network is much higher.

Raw runs are in `measurements.json`.
