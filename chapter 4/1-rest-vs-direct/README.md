# 1 — REST route vs. direct Server Component access

Two versions of the same product page, both reading from the same mock
`lib/db.ts` (an in-memory stand-in for a real database client, with an
artificial 300ms delay so the difference is visible on localhost).

- `/before` — a Client Component that fetches from an internal REST
  route (`app/api/products/[id]/route.ts`) via `useEffect`.
- `/after` — a Server Component that calls the data layer
  (`lib/products.ts`) directly, no route in between.

## Run it yourself

```bash
npm install
npm run dev
```

Then open <http://localhost:3000> and follow the links to `/before` and
`/after`. Open the Network tab first:

1. `/before` sends an HTML shell with no product data, then a
   `/api/products/1` request fires only after the JS bundle hydrates —
   you'll see the "Loading..." text for a beat before the product
   appears.
2. `/after`'s HTML already contains the rendered product on arrival —
   there's no client-side request to watch for at all, because the
   fetch already happened on the server before any HTML was sent.

```bash
npm run build
```

### What we measured

Building this app (Next.js 15.5, React 19) reports:

| Route | Size | First Load JS |
|---|---|---|
| `/before` | 455 B | 103 kB |
| `/after` | 130 B | 103 kB |
| `/api/products/[id]` | 130 B | 103 kB (dynamic) |

`/after` ships less page-specific JS than `/before` (130 B vs. 455 B) —
`/before` still has to ship `useState`/`useEffect` plumbing and a
loading branch that `/after` never needs, on top of not needing a
round-trip to a route at all.

## Ties back to the chapter

See "Fetching Data Directly: Async Server Components, No REST Required"
in `chapter-04-draft-sections.md`. The REST route here isn't wrong, it's
just answering a question `/after` no longer asks: how does code
running in the browser reach the database. `/after`'s Server Component
already runs in the one place the database is reachable from, so the
route, the `fetch`, and the JSON encode/decode it required all disappear.
