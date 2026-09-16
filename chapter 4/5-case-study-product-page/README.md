# 5 — Case Study: Redesigning a Product Page's Data Strategy

The full worked version of the chapter's Case Study. Both routes read
the same three mock data sources from `lib/db.ts` (`getProduct`: 300ms,
`getReviews`: 500ms, `getRecommendations`: 1200ms).

- `/before` — sequential `await`s, no `<Suspense>`, no caching beyond
  the framework's defaults.
- `/after` — `getProduct` wrapped in React's `cache()`, `getReviews`
  and `getRecommendations` wrapped in `unstable_cache` (1-hour and
  1-day windows, matching the chapter's own numbers), fired before
  either `<Suspense>` boundary and streamed in independently.

## Run it yourself

```bash
npm install
npm run build
npm start
```

Open <http://localhost:3000/before> and <http://localhost:3000/after>
with the Network tab open, or compare directly:

```bash
curl -w "ttfb:%{time_starttransfer}s total:%{time_total}s\n" -o /dev/null http://localhost:3000/before
curl -w "ttfb:%{time_starttransfer}s total:%{time_total}s\n" -o /dev/null http://localhost:3000/after
curl -w "ttfb:%{time_starttransfer}s total:%{time_total}s\n" -o /dev/null http://localhost:3000/after
```

(Run `/after` twice — the second request hits the warm Data Cache for
reviews and recommendations.)

### What we measured

Built and run with Next.js 15.5, React 19 (production server, `npm
start`, cache cleared beforehand):

| Route | Time to first byte | Total response time |
|---|---|---|
| `/before` | 2.078s | 2.085s |
| `/after`, first visit (cold cache) | 0.368s | 1.564s |
| `/after`, second visit (warm cache) | 0.319s | 0.321s |

`/before`'s TTFB and total are nearly identical — nothing arrives until
every fetch, including the slowest one (recommendations, 1200ms), has
finished. `/after`'s first visit already cuts total time by roughly a
third, purely from firing the fetches together and streaming the shell
in before recommendations resolve. Its second visit is where the
caching pays off: with reviews and recommendations already in the Data
Cache, the only remaining cost is `getProduct`'s per-request
memoization, which is never persisted across requests on purpose,
since price and stock need to stay close to real-time. That gap
between `/after`'s two rows is the concrete version of the case
study's closing point — each piece of data ended up with a genuinely
different answer to the same four questions.

## Ties back to the chapter

See the Case Study in `chapter-04-draft-sections.md`. This is the exact
before/after code from that section, wired up to real (mocked) data so
the improvement is a measured number rather than only an argument.
