# 2: Counting Renders, With and Without the Compiler

A product page island in the style of Chapter 5's: a Server Component page
renders one Client Component, which holds a gallery, a price, a size
picker, a review list (12 reviews), and a review composer with a controlled
textarea, a character count, and a star picker.

- `/product/p1`: the review draft is state in the island's top component,
  `ProductIsland`, so every keystroke starts there (sections 2 to 4).
- `/moved/p1`: the same island with the draft moved down into
  `LocalReviewComposer` (section 6).
- `next.config.ts`: `reactCompiler` is on unless `REACT_COMPILER=0`, and
  the two builds go to different folders so both can be measured.

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

Typing the ten characters `Great shoe` into the review box. Each cell is
the number of component functions that ran during those ten keystrokes
(ten commits in every case).

| Route | Compiler off | Compiler on |
|---|---|---|
| `/product/p1` (draft at the top) | 470 | 31 |
| `/moved/p1` (draft in the composer) | 50 | 31 |

Compiler off, draft at the top: every keystroke re-ran all 47 components
in the island, including 12 `ReviewItem`s, 12 `Stars`, 8 `SizeButton`s,
and 6 `Thumb`s. Compiler on: `ProductIsland`, `ReviewComposer`, and
`CharCount` ran once per keystroke, and `SubmitButton` once, when the
draft reached ten characters and the button was enabled. Everything else
returned the cached element and was skipped.

Moving the state down gives the same 31 with the compiler on: here the
compiler had already reduced the high state to one cheap extra function
call per keystroke. Without the compiler, the move alone takes 470 down to
50. Example 4 shows the cases where structure still matters with the
compiler on.

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
