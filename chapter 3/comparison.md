# Boundary Placement comparison — dashboard example

Same feature (a dashboard with stat cards, a revenue chart, a date
range picker, and a recent-orders table), two different places to draw
the `"use client"` boundary. Both are complete, runnable Next.js apps —
readers can check them out for themselves rather than take the
comparison on faith.

## Run it yourself

```bash
cd 1-bad-boundary   # or 2-good-boundary
npm install
npm run dev         # open http://localhost:3000
```

With `1-bad-boundary` running, open the Network tab: the page first
renders a "Loading…" skeleton, then — only after the JS bundle
downloads, parses, and hydrates — three separate `fetch` calls fire.
With `2-good-boundary` running, view the page source: the data is
already in the server-rendered HTML, no loading state ever appears.

To compare bundle sizes directly:

```bash
npm run build
```

in each folder, and read the `Route (app)` table each one prints.

## What we measured

Built with Next.js 15 / React 19:

| | 1-bad-boundary | 2-good-boundary |
|---|---|---|
| `"use client"` location | Top of the page (`app/Dashboard.tsx`) | Only on the two genuine leaves (`app/DateRangePicker.tsx`, `app/RevenueChart.tsx`) |
| `/` route size | 110 kB | 102 kB |
| `/` First Load JS | **212 kB** | **204 kB** |
| Client bundle contents | `recharts`, `date-fns`, `lucide-react`, all table/card markup, React client runtime | `recharts` + a ~10-line `<select>` handler, React client runtime |
| Data fetching | Client-side `useEffect` waterfall, after JS downloads/parses/hydrates (each request carries an artificial 400ms delay, see `lib/mock-data.ts`) | Server-side `await`, resolved in parallel before any HTML is sent |
| Initial HTML | A "Loading…" skeleton only | Full dashboard content, already rendered |
| Re-render scope on range change | Whole tree (cards, table, chart all re-render) | Server re-renders `Dashboard`; chart/picker are the only client trees that reconcile |
| Diagnostic-checklist result | Fails: delete every hook/handler and the output is unchanged except the `<select>` | Passes: every `"use client"` file has real interactive behavior |

`recharts` ships in both bundles — the chart is a genuinely interactive
leaf either way, so that part of the client bundle isn't "waste" in
either version. The measured 8 kB gap is `date-fns` + `lucide-react` +
the extra client-side state/effect plumbing that the bad version pays
for and the good version doesn't. In a larger real app, with more
server-only-safe code sitting above the interactive leaf, that gap
grows a lot further past 8 kB — the bytes matter less here than the
fetch-waterfall difference does, which is why both are worth showing.

Use this pair to illustrate, in order:

1. **The Three Kinds of Components** — `StatCard`, the table rows, and
   the icon/date-fns usage are all Shared-Component-safe code that
   ended up client-only in the bad version purely because of where the
   boundary was drawn, not because of anything the code itself needs.
2. **Boundary Placement** — the push-to-the-leaves heuristic and the
   "Leaf Client Component" pattern, with the diagnostic checklist
   applied directly to `1-bad-boundary/app/Dashboard.tsx`.
3. **Hydration Costs** — bytes (library sizes), parse/compile
   (everything under the top-level boundary), and reconciliation
   (re-render scope) all worsen together when the boundary moves up a
   single level. The Network-tab waterfall is the most visceral of the
   three to actually watch happen.
4. **Dependency Management** — same underlying libraries, same
   feature, but the bad version's import graph is dragged wholesale
   into the client bundle while the good version keeps `date-fns` and
   `lucide-react` server-only.

Files:
- `1-bad-boundary/` — full Next.js app; `app/Dashboard.tsx` is the
  anti-pattern, `README.md` has the write-up.
- `2-good-boundary/` — full Next.js app; `app/Dashboard.tsx`,
  `app/DateRangePicker.tsx`, `app/RevenueChart.tsx` are the corrected
  split, `README.md` has the write-up.
