# 4 — Passing Server Components as children

This one illustrates the `children`-slot pattern from "Passing Server
Components as Children": a Client Component (`Modal`) providing
interactive chrome around Server Component content (`ProductReviews`)
it receives as `children`, without ever importing or knowing about it.

## Run it yourself

```bash
npm install
npm run dev
```

Then open <http://localhost:3000> and open your browser's Network tab
before clicking "See reviews." Nothing fires when you click it: the
reviews were already fetched (`getReviews`, with an artificial 350ms
delay, see `lib/mock-data.ts`) and rendered into HTML on the server
before the page was ever sent. Clicking the button only toggles local
client state in `Modal.tsx`; it does not trigger a fetch, because there
is nothing left to fetch.

To see the bundle side of it:

```bash
npm run build
```

`app/Modal.tsx` is the only `"use client"` file in this example, and
the build's `Route (app)` table shows it: 397 B of route-specific code,
just the modal's open/close state and markup. `ProductReviews.tsx` and
its `getReviews` call never appear in that number at all, because
`Modal.tsx` never imports that file.

## What to look at

- `app/Modal.tsx`: `"use client"`, `useState` for open/closed, and two
  props, `trigger` and `children`. It has no idea what `children`
  contains.
- `app/ProductReviews.tsx`: a genuine Server Component, `async`, doing
  a real server-only data fetch. Never imported by `Modal.tsx`.
- `app/page.tsx`: the Server Component that imports both and composes
  them, `<Modal trigger="See reviews"><ProductReviews productId={...} /></Modal>`.
  This is the only file that knows both `Modal` and `ProductReviews`
  exist.

## Why this needed a pattern at all

If `Modal.tsx` instead imported `ProductReviews` directly and rendered
it inside its own JSX, that import would pull `ProductReviews` into the
same client subtree `Modal` already belongs to (the "a boundary cannot
be undone below itself" rule from earlier in the chapter), and
`ProductReviews`'s server-only `getReviews` call would have no way to
run in the browser. Passing it in through `children` instead means
`page.tsx`, a Server Component, does the importing and rendering, and
only the finished result ever crosses into `Modal`.
