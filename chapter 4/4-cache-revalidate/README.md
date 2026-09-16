# 4 — Cache, Revalidate, Invalidate

A reviews list wrapped in `unstable_cache` with an 8-second `revalidate`
window (the chapter's own examples use an hour or a day — 8 seconds
here purely so this demo finishes in under a minute) and a `"reviews"`
tag for on-demand invalidation.

- `lib/reviews.ts` — `getReviews`, cached via `unstable_cache`, returns
  the review list plus the timestamp it was fetched at, so staleness is
  visible on the page itself.
- `app/actions.ts` — a Server Action, `addReview`, used by the page's
  own form: pushes a review, then calls `revalidateTag("reviews")`.
- `app/api/add-review/route.ts` — a plain route handler doing the same
  thing, included only so this example's on-demand invalidation can be
  triggered with a single `curl` request for testing (the page itself
  uses the Server Action above, not this route).

## Run it yourself

```bash
npm install
npm run build
npm start
```

Open <http://localhost:3000>, note the fetched-at timestamp, and reload
a few times within 8 seconds — it stays the same. Submit the form, or
in another terminal:

```bash
curl -X POST http://localhost:3000/api/add-review \
  -H "Content-Type: application/json" \
  -d '{"text":"a new review"}'
```

Reload the page immediately after — the timestamp updates right away,
without waiting for the 8-second window.

### What we measured

Built and run with Next.js 15.5, React 19 (production server, `npm
start`, cache cleared beforehand):

| Time | Request | Timestamp returned |
|---|---|---|
| t=0s | first request | `20:12:40.607Z` (cache populated) |
| t=2s | within the 8s window | `20:12:40.607Z` (same — cache hit) |
| t=9s | just past the window | `20:12:40.607Z` (same — stale served immediately, refresh kicked off in the background) |
| t=11s | after the background refresh | `20:12:49.676Z` (new) |
| — | `POST /api/add-review` | `revalidateTag("reviews")` called |
| immediately after | next request | `20:12:51.740Z` (new, no wait) |

The t=9s row is the one worth sitting with: the request that lands
right after the window expires does **not** wait for a fresh fetch, it
gets the same stale value the t=2s request got, instantly. Only the
request after that (t=11s) sees the refreshed data. The on-demand
invalidation, by contrast, is visible on the very next request, no
matter where in the 8-second window it lands.

## Ties back to the chapter

See "Cache Layers" and "Revalidation and Invalidation Strategies" in
`chapter-04-draft-sections.md`. This is the stale-while-revalidate
behavior described there, made observable: "the request right after
expiry gets the stale cached value immediately... the request after
THAT gets fresh data."
