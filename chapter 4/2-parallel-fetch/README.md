# 2 — Parallel Data Fetching

Four versions of the same "product + reviews" page, all reading from
`lib/mock-data.ts` (`getProduct`: 300ms delay, `getReviews`: 500ms
delay — two independent data sources with deliberately different
timings, so a sequential-vs-parallel difference is easy to measure).

- `/sequential` — two `await`s, one after another.
- `/parallel` — `Promise.all` over both.
- `/child-waterfall` — the harder case: a parent awaits its own data,
  then renders a nested Server Component that awaits its own,
  unrelated data. Looks fine in isolation; still a waterfall.
- `/promise-passing` — the fix for the harder case: fire `getReviews`
  before awaiting `getProduct`, hand the unresolved promise to
  `Reviews` as a prop, let `Reviews` keep owning its own `await`.

All four pages export `dynamic = "force-dynamic"` so each request
actually re-runs the fetches — useful for watching this live rather
than only reading a build-time number.

## Run it yourself

```bash
npm install
npm run build
npm start
```

Then request each route and compare:

```bash
curl -w "%{time_total}s\n" -o /dev/null http://localhost:3000/sequential
curl -w "%{time_total}s\n" -o /dev/null http://localhost:3000/parallel
curl -w "%{time_total}s\n" -o /dev/null http://localhost:3000/child-waterfall
curl -w "%{time_total}s\n" -o /dev/null http://localhost:3000/promise-passing
```

### What we measured

Built and run with Next.js 15.5, React 19 (production server, `npm
start`):

| Route | Total response time |
|---|---|
| `/sequential` | 0.872s |
| `/parallel` | 0.524s |
| `/child-waterfall` | 0.828s |
| `/promise-passing` | 0.520s |

`/parallel` and `/promise-passing` both land close to `max(300, 500) =
500ms`. `/sequential` and `/child-waterfall` both land close to `300 +
500 = 800ms`, confirming that the nested-component version is a real
waterfall even though neither of its two files contains two `await`s in
a row — the wait is hidden in the parent/child structure instead.

## Ties back to the chapter

See "Parallel Data Fetching" in `chapter-04-draft-sections.md`.
`/child-waterfall`'s own page prints how long the parent's `await`
took, right in the rendered HTML, so you can see `Reviews` hadn't even
started at that point — its own timer only starts once the parent
function returns.
