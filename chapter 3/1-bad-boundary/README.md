# 1 — Bad boundary (client boundary drawn too high)

`app/Dashboard.tsx` marks the **entire page** `"use client"`, even though
only one element on the page — the date-range `<select>` — needs an event
handler.

## Run it yourself

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. Open your browser's Network tab
before the page finishes loading and you'll see:

1. The initial HTML arrives with just a "Loading…" skeleton — none of
   the dashboard's data is in the server-rendered response.
2. Only after the JS bundle downloads, parses, and hydrates do three
   separate `fetch` calls fire (`/api/dashboard/stats`,
   `/api/dashboard/orders`, `/api/dashboard/revenue`), each carrying an
   artificial 400ms delay (see `lib/mock-data.ts`) so the wait is easy
   to see rather than instant on localhost.

To see the bundle-size side of the story:

```bash
npm run build
```

and read the `Route (app)` table it prints — compare the `/` row's
"First Load JS" to the same command run in `../2-good-boundary`.

### What we measured

Building this app (Next.js 15, React 19) reports:

| Route | Size | First Load JS |
|---|---|---|
| `/` | 110 kB | **212 kB** |

## What this costs (ties to Chapter 3, "Hydration Costs" and
"Dependency Management")

- **Bytes**: `date-fns` and `lucide-react` cross the boundary and ship
  to the browser, even though nothing in the stat cards or the orders
  table is interactive — despite being small individually, they (plus
  the extra client-side plumbing: `useState`/`useEffect` and the
  duplicated component code) account for the ~8 kB gap in the measured
  numbers above. (`recharts` ships in both versions here, since the
  chart is a genuinely interactive leaf either way — see
  `2-good-boundary`'s notes on that.) The client boundary drags its
  *whole import graph* with it — in a larger real app, with more
  server-only-safe code living above the interactive leaf, this gap
  grows a lot larger than 8 kB.
- **Time-to-Interactive**: because the whole page is now a Client
  Component, it can't `await` data during render. Fetching moves into a
  `useEffect`, so the sequence becomes *download JS → parse/compile →
  hydrate → only then does the network request for data even start*.
  Run it yourself and you'll see the "Loading…" skeleton for a
  noticeably longer stretch than the good-boundary version's page ever
  shows one at all.
- **Reconciliation cost**: every re-render of `Dashboard` (e.g. when
  `range` changes) re-renders the stat cards, chart, and table too,
  even though only the fetched data changed — there's no boundary
  isolating the parts that don't need to re-run.

## Diagnostic checklist (misplaced boundary)

Ask of this file: if you deleted every `onClick`/`onChange`/`useState`/
`useEffect`, would the rendered output look identical? Here, yes — for
everything except the `<select>`. That's the signal the boundary is in
the wrong place: push it down to just the element that failed the test.
