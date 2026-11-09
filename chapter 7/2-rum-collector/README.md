# 2: RUM Collector

Section 5's field data collection, built from scratch:

- `app/_components/WebVitals.tsx` reports every metric from
  `useReportWebVitals` with `navigator.sendBeacon`. The callback is defined
  at module level, the route is reported as its pattern (`lib/routes.ts`),
  and every report carries the release.
- `app/api/vitals/route.ts` validates each beacon and appends it to
  `data/vitals.ndjson`.
- `scripts/report.mts` computes the 75th percentile per route, navigation
  type, and metric.
- `next.config.ts` sets `deploymentId` and exposes the same value to the
  client as `NEXT_PUBLIC_RELEASE`.

## Run it yourself

```bash
npm install
npx playwright install chromium   # once, for npm run measure
npm run measure                   # builds, simulates 10 visits
npm run report                    # summarizes data/vitals.ndjson
```

Each simulated visit loads the home page, waits for hydration, navigates
client-side to a product, picks a size, follows a link to a second
product, picks a size, and leaves the tab.

## What we measured

Next.js 16.4.5, React 19.3.1, production build, headless Chromium 153 with
the CPU throttled 2x, release `2026-11-10-1`. Measured 2026-11-09.

```text
130 reports, releases: 2026-11-10-1
route | navigationType | metric | count | p75
/ | navigate | CLS | 10 | 0.000
/ | navigate | FCP | 10 | 96
/ | navigate | INP | 10 | 16
/ | navigate | LCP | 10 | 96
/ | navigate | TTFB | 10 | 10
/product/[id] | soft-navigation | CLS | 20 | 0.000
/product/[id] | soft-navigation | FCP | 20 | 51
/product/[id] | soft-navigation | INP | 20 | 8
/product/[id] | soft-navigation | LCP | 20 | 75
```

- Every client-side navigation produced its own LCP, FCP, CLS, and INP,
  with `navigationType` `soft-navigation` and a `navigationURL` for the
  product page, which `lib/routes.ts` turned into `/product/[id]`. That's
  `useReportWebVitals` in Next.js 16.4 passing `reportSoftNavs: true` to
  web-vitals, in a Chromium version with the Soft Navigations API.
- No TTFB was reported for soft navigations.
- The home page's INP is the tap on the product link, which happened on
  the home page before the navigation.
- A click on a link before hydration is an ordinary full page load. The
  first version of the script clicked too early and recorded every product
  view as a `navigate`; it now waits for hydration.

Two things we found while building it:

- Next.js writes the deployment ID to `<html data-dpl-id>`, but its client
  runtime removes the attribute during start-up (to avoid a hydration
  mismatch), so code running after hydration reads nothing there. Expose
  the release to the client yourself, as `next.config.ts` does.
- `deploymentId` may only contain letters, digits, hyphens, and
  underscores; a value such as `2026-11-10.1` fails the build.
