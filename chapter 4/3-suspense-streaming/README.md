# 3 — Suspense Boundaries and Progressive Rendering

Three versions of the same product page, all reading from
`lib/mock-data.ts` (`getProduct`: 100ms, `getReviews`: 500ms,
`getRecommendations`: 1200ms — three sources with visibly different
delays).

- `/no-suspense` — `Promise.all` over all three, no `<Suspense>`
  anywhere. The whole page waits for the slowest fetch before sending
  any HTML.
- `/with-suspense` — one `<Suspense>` boundary around `Reviews`. The
  shell (the product title) can paint as soon as `getProduct` resolves.
- `/progressive` — two independent `<Suspense>` boundaries, one around
  `Reviews`, one around `Recommendations`. Three painting stages
  instead of one.

## Run it yourself

```bash
npm install
npm run build
npm start
```

Then compare time-to-first-byte against total response time:

```bash
curl -w "ttfb:%{time_starttransfer}s total:%{time_total}s\n" -o /dev/null http://localhost:3000/no-suspense
curl -w "ttfb:%{time_starttransfer}s total:%{time_total}s\n" -o /dev/null http://localhost:3000/with-suspense
curl -w "ttfb:%{time_starttransfer}s total:%{time_total}s\n" -o /dev/null http://localhost:3000/progressive
```

Or just open each route in a browser with the Network tab open and
watch the response streaming in over time rather than arriving all at
once.

### What we measured

Built and run with Next.js 15.5, React 19 (production server, `npm
start`):

| Route | Time to first byte | Total response time |
|---|---|---|
| `/no-suspense` | 1.250s | 1.254s |
| `/with-suspense` | 0.117s | 0.625s |
| `/progressive` | 0.123s | 1.327s |

`/no-suspense`'s TTFB and total time are nearly identical — the browser
gets nothing until everything is ready. `/with-suspense` and
`/progressive` both get their first bytes in about 120ms, the time for
`getProduct` alone, regardless of how long the rest of the page takes
to finish streaming in behind it.

## Ties back to the chapter

See "Suspense Boundaries and What They Unlock" and "Progressive
Rendering" in `chapter-04-draft-sections.md`. The TTFB numbers above are
the concrete version of the sentence "a Suspense boundary is about not
making the parts of a page that are ready wait on the part that isn't"
— the shell shows up at roughly the same time in both `/with-suspense`
and `/progressive`, no matter how slow `getRecommendations` is.
