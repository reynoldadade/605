# 3: When the Rules Are Broken

Section 5's failure modes as real components, with the tools that find
them: the compiler-powered lint rules, a compile report built on the
compiler's own logger, and a runtime check of the two cases the compiler
compiles anyway.

| File | Rule broken | Compiler | Lint (`recommended-latest`) |
|---|---|---|---|
| `app/purity/PricesCheckedAt.tsx` | `Date.now()` during render | compiled; timestamp frozen | `purity` error |
| `app/mutation/PriceList.tsx` | `items.sort()` on a prop | compiled | not reported |
| `app/mutation/Basket.tsx` | `items.push()` on state | compiled | not reported |
| `app/refs/RenderCount.tsx` | `ref.current` during render | skipped | `refs` errors |
| `app/inner/Outer.tsx` | component defined inside a component | compiled | `static-components` error |
| `app/effect-sync/FullName.tsx` | `setState` in an effect to sync derived state | compiled | `set-state-in-effect` error |
| `app/manual-memo/Matches.tsx` | `useMemo` missing a dependency | skipped ("Existing memoization could not be preserved") | `exhaustive-deps` warning |
| `app/annotation/FilterPanel.tsx` | none: opts in with `"use memo"` | compiled, in both modes | clean |

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
npm run lint                       # eslint-plugin-react-hooks 7, recommended-latest
npm run compile-report             # what the compiler compiled or skipped, and why
npm run compile-report:annotation  # same, with compilationMode: "annotation"
```

The compile report only lists `"use client"` files, since Next.js compiles
client code only. In annotation mode it lists just `FilterPanel`.

## What we measured

Next.js 16.4.2 (Turbopack), React 19.3.1, React Compiler (`babel-plugin-react-compiler`) 1.0.0, production builds made with `next build --no-mangling`, headless Chromium 141 driven by Playwright, on a 2-core cloud Linux container. Measured 2026-10-23.

`npm run measure` builds the app both ways and does in the browser what a
reader would.

| Check | Compiler off | Compiler on |
|---|---|---|
| `/purity`: timestamp after two re-renders, a second apart | 04:41:50.059, 04:41:51.935, 04:41:53.072 | 04:42:07.021 three times |
| `/mutation`: basket after adding two items | "4 items", 4 listed | "4 items", 2 listed |

With the compiler on, the re-render counter on `/purity` still went up (the
button label changed), but the timestamp didn't: `Date.now()` depends on
nothing reactive, so the compiler put it in a block that runs once. On
`/mutation`, `Basket` pushes into the same array and bumps a counter.
The count, keyed on `items.length`, updated. The `<PriceList>` element,
keyed on the array's identity, came back from the cache with two items.

Whether an impure call freezes depends on how the compiler groups it. In
example 6, `product.dealEndsAt - Date.now()` inside a product card was
recomputed on every run of the card; a banner whose countdown read only a
constant and `Date.now()` froze. That unpredictability is the reason to
follow the rule rather than reason about the output.

With Cache Components enabled, `next build` also refuses a Client
Component that calls `Date.now()` while the page is being prerendered
("encountered the unstable value `Date.now()` in a Client Component"),
and suggests a `<Suspense>` boundary or moving the read into an effect or
event handler. This example doesn't enable Cache Components, so the
purity page builds and shows the frozen value.
