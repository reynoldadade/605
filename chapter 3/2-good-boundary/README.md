# 2 — Good boundary (push-to-the-leaves)

`app/Dashboard.tsx` stays a **Server Component**. It fetches its own
data with a direct `await` and renders the stat cards and orders table
as plain server-rendered markup. Only two files in this folder are
`"use client"`, and each is a genuine leaf:

- `app/DateRangePicker.tsx` — the only element with an event handler.
- `app/RevenueChart.tsx` — `recharts` requires the DOM, so this one
  legitimately needs the browser for hover/tooltip interaction.

## Run it yourself

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. View the page source (not just the
rendered DOM) and the stat cards, chart data, and order rows are
already there — the server resolved `getDashboardStats`,
`getOrders`, and `getRevenue` (each with the same artificial 400ms
delay as `1-bad-boundary`, running in parallel via `Promise.all`)
*before* sending any HTML. There's no "Loading…" state to see, because
there's nothing left for the client to fetch.

To see the bundle-size side of the story:

```bash
npm run build
```

and read the `Route (app)` table it prints — compare the `/` row's
"First Load JS" to the same command run in `../1-bad-boundary`.

### What we measured

Building this app (Next.js 15, React 19) reports:

| Route | Size | First Load JS |
|---|---|---|
| `/` | 102 kB | **204 kB** |

That's 8 kB lighter than `1-bad-boundary`'s 212 kB — the cost of
`date-fns` and `lucide-react` (plus the client-side state/effect
plumbing) that never needed to leave the server. `recharts` itself
ships in both versions' bundles, since the chart is a genuinely
interactive leaf either way; the point isn't that this page ships zero
client JS, it's that the *only* client JS it ships is JS the page
actually needs.

## Why this is the boundary the chapter recommends

- **Bytes**: `date-fns` and `lucide-react` are resolved entirely on the
  server and produce plain HTML — they never appear in the client
  bundle at all. The client bundle is limited to `recharts` (needed
  either way) plus a tiny `<select>` handler — nothing else's import
  graph rides along.
- **Time-to-Interactive**: `stats`, `orders`, and `revenue` are fetched
  directly on the server before any HTML is sent, so there's no
  client-side fetch waterfall for them. The page can be interactive as
  soon as the two small leaf bundles hydrate, not after the whole
  page's JS has downloaded and parsed.
- **Reconciliation cost**: changing the date range navigates the
  server route (`DateRangePicker` calls `router.push`), so the server
  re-renders `Dashboard` with fresh data — the client-side React tree
  for the chart and picker doesn't have to reconcile the stat cards or
  table at all, since those aren't client components in the first
  place.

## The one-way rule this demonstrates

A boundary is a one-way decision *below* itself: once `DateRangePicker`
and `RevenueChart` are marked `"use client"`, anything *they* import
also ships to the client. But because the boundary is drawn at the
leaf, that "anything" is small and deliberate — not the whole page's
dependency graph, as in `1-bad-boundary`.
