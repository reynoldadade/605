# 4: State Architecture

Section 6's structural fixes, each measured with the compiler off and on.

- `/derive/effect` and `/derive/calculated`: a price filter over 24
  products, synchronized by an effect versus calculated during render.
- `/cart/single`, `/cart/split`, `/cart/store`: the same cart (badge,
  drawer toggle, drawer, 24 Add to cart buttons inside server-rendered
  cards) held in one context, in three contexts split by rate of change,
  and in a small external store read through `useSyncExternalStore` with
  selectors. The store is hand-rolled in `app/cart/store/store.ts`;
  libraries such as Zustand provide the same shape. The chapter's
  subsection on external stores was cut for length; the Case Study's
  compare store uses the same pattern.
- `/product/p1`: a Client Component `Disclosure` around a Server
  Component `SpecTable` passed as `children`.

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

## What we measured

Next.js 16.4.2 (Turbopack), React 19.3.1, React Compiler (`babel-plugin-react-compiler`) 1.0.0, production builds made with `next build --no-mangling`, headless Chromium 141 driven by Playwright, on a 2-core cloud Linux container. Measured 2026-10-23.

Component functions that ran, and commits, for each interaction.

| Page | Interaction | Compiler off | Compiler on |
|---|---|---|---|
| `/derive/effect` | slider moved 5 steps | 260 renders, 10 commits | 135 renders, 10 commits |
| `/derive/calculated` | slider moved 5 steps | 130 renders, 5 commits | 130 renders, 5 commits |
| `/cart/single` | open the drawer | 28 | 28 |
| `/cart/split` | open the drawer | 27 | 3 |
| `/cart/store` | open the drawer | 2 | 2 |
| `/cart/single` | add one item | 28 | 28 |
| `/cart/split` | add one item | 28 | 3 |
| `/cart/store` | add one item | 2 | 2 |
| `/product/p1` | open the disclosure | 1 | 1 |

What the numbers say:

- **Derive, don't synchronize:** the effect version commits twice per
  change with or without the compiler. The compiler hides most of the
  second commit's work (135 against 260 renders), but not the commit
  itself, or the frame in which the slider and the list disagree.
- **One context:** every consumer runs on every change, compiler or not:
  the badge, the toggle, the drawer, and all 24 buttons. With the compiler,
  each returns its cached output, but each still runs.
- **Split context:** with the compiler, only the provider and the two
  consumers of the part that changed run. Without it, the split barely
  helps (27), because the `actions` object is recreated on every provider
  render and the 24 buttons read it. The compiler creates it once, since it
  only closes over stable state setters. Without the compiler, it needs a
  `useMemo` (or `useState(() => ...)`) to be stable.
- **External store:** each component subscribes to one value and runs
  only when that value changes, with or without the compiler.
- **Disclosure:** only `Disclosure` runs. `SpecTable` never runs in the
  browser at all.

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
