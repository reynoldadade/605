# 1: What the Compiler Produces

Section 3 and 4's components, plain source in `src/`, and what the React
Compiler turns them into in `out/`. No Next.js app: `npm run compile` runs
the same Babel plugin Next.js uses when `reactCompiler` is on.

- `src/ReviewList.tsx`: section 3's listing. `out/ReviewList.js` is the
  compiled version the chapter excerpts.
- `src/RatingStats.tsx`: memoization after an early return (section 4).
- `src/CartCount.tsx`: a context reader whose `<Badge>` is cached on
  `items.length` (section 4).
- `src/useToggle.ts`: custom hooks are compiled too.

## Run it yourself

```bash
npm install
npm run compile
```

## What we measured

React Compiler 1.0.0 with its default options. Measured 2026-10-23.

| Function | Cache slots | Guarded blocks |
|---|---|---|
| `ReviewList` | 16 | 6 |
| `RatingStats` | 4 | 2 |
| `CartCount` | 2 | 1 |
| `useToggle` | 3 | 2 |

`ReviewList`'s six blocks are the filter's predicate (keyed on
`minRating`), the list of `<ReviewItem>` elements (keyed on `expanded`,
`minRating`, and `reviews`), the `<ul>`, the click handler (keyed on
`expanded`), the `<button>`, and the outer `<section>`. `visible` and
`shown` get no slots of their own: they are recomputed inside the list's
block, because only values that reach the output are cached. The callback
that maps a review to an element reads nothing from the component, so it is
hoisted to module level as `_temp`.

In `RatingStats`, the sort sits after the early return, guarded by
`ratings`, which `useMemo` can't do.

Next.js applies the compiler to client code only. We confirmed it on a
16.4.2 build: the `"use client"` component in the browser bundle carried
the memo cache, while its server-rendering chunk and the async Server
Component beside it were emitted as written. React's server renderer also
hands every component a fresh, empty cache, so a compiled Server Component
would reuse nothing.
