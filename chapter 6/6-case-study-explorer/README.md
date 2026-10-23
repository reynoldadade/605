# 6: Case Study, Untangling the Product Explorer

The chapter's case study, before and after, in one app.

- `/before/catalogue`: the explorer as it grew. The page is one Client
  Component that fetches all 5,000 products from `/api/products` in an
  effect, keeps the filtered list in sync with another effect, sorts the
  products array in place, holds compare and cart state in one
  `ShopContext` read by every card, renders every match with index keys,
  and shows a sale countdown (`SaleBanner`) that reads `Date.now()`
  during render.
- `/after/catalogue`: a Server Component page. Filters live in the URL
  and are validated with Zod (`lib/filters.ts`); `getProductPage`
  (`lib/products.ts`, `"use cache"` + `cacheTag`) filters, sorts, and
  pages on the server, 24 products at a time. The client islands are
  `FilterBar` (local search text, URL updated in a transition after a
  300 ms pause), `AddToCart` and `CartBadge` (split contexts),
  `CompareToggle` and `CompareTray` (a small store read with selectors),
  and `SaleCountdown` (the time is state, ticked by an interval).
- `lib/search-params.ts` builds URLs without Zod, so the schema stays out
  of the browser bundle.

Cache Components and Partial Prefetching are enabled, as Next.js 16.4
recommends for new projects.

## Run it yourself

```bash
npm install
npx playwright install chromium   # once, for npm run measure
npm run build && npm start        # with the compiler, http://localhost:3000
npm run build:no-compiler         # same app without it, into .next-no-compiler
npm run measure                   # builds both, runs the checks, writes measurements.json
```

Requires Node.js 20 or later. `npm run measure -- --no-build` reuses existing
builds. Set `CHROMIUM_PATH` to use an already-installed Chromium instead of
the one Playwright downloads.

```bash
npm run lint                         # 2 errors, both in app/before
npm run compile-report app/before    # 3 components, none skipped
npm run compile-report app/after     # 8 components and 1 hook, none skipped
```

## What we measured

Next.js 16.4.2 (Turbopack), React 19.3.1, React Compiler (`babel-plugin-react-compiler`) 1.0.0, production builds made with `next build --no-mangling`, headless Chromium 141 driven by Playwright, on a 2-core cloud Linux container. Measured 2026-10-23.

| Measurement | Before, compiler off | Before, compiler on | After, compiler off | After, compiler on |
|---|---|---|---|---|
| Component renders while typing 10 characters | 18,049 | 6,558 | 19 | 19 |
| Worst keystroke-to-paint, CPU throttled 4x (median of 3) | 800 ms | 728 ms | 24 ms | 24 ms |
| Components re-rendered by one compare toggle | 4,935 | 4,934 | 2 | 2 |
| DOM elements after load | 29,641 | 29,641 | 190 | 190 |
| Client JavaScript for the route (compressed) | 179 KB | 180 KB | 183 KB | 184 KB |
| Catalogue data fetched by the browser | 380 KB JSON | 380 KB JSON | none | none |
| Sale countdown after the page re-renders | updates | **frozen** | updates | updates |
| Lint errors / components the compiler skipped | 2 / 0 | 2 / 0 | 0 / 0 | 0 / 0 |

Notes:

- Render counts are this app's components only. After a URL change the
  after version also re-renders about 45 of Next.js's own router
  components once, which `measurements.json` lists separately.
- The default price limit (300) shows 4,933 of the 5,000 products, which is
  why the compare toggle re-renders 4,933 cards plus the page.
- The JavaScript figures come from `--no-mangling` builds, so they are
  larger than a normal build's; the comparison between columns still
  holds. Client code size barely moved: the before version's cost was never
  its code, it was its data and its work.
- The compiler cut the before version's renders by almost two thirds, but
  its worst keystroke only from 800 to 728 ms, because the cost that
  remained was 4,933 cards' worth of DOM. It also froze the sale countdown,
  which had only looked live because the page re-rendered on almost every
  interaction. The structural rework did the rest, and with it in place the
  compiler made no measurable difference to this page.
- Running `next build` with `SaleBanner` prerendered fails under Cache
  Components ("encountered the unstable value `Date.now()` in a Client
  Component"). The before page escapes that check only because it renders
  a loading message until its fetch completes, so the banner is never
  part of the prerendered HTML.

### How renders are counted

`scripts/harness.mts` plays the part of React DevTools. React reports every
commit to `window.__REACT_DEVTOOLS_GLOBAL_HOOK__`, production builds
included, so the script installs that hook before the page loads and, on
each commit, counts every component whose function actually ran. Nothing in
the app itself is instrumented. Component names survive only because the
builds use `next build --no-mangling`, which keeps function names and
changes nothing else about how React renders. Counts are function calls:
a compiled component that runs and returns its cached output still counts
once, which is why the compiler-on numbers aren't zero.
