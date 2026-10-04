# 1: API Route vs. Server Action

The same review form wired up two ways, against the same Prisma data and
the same cached read (`getReviews`, tagged `"reviews"`).

- `/api-version/p1` (before): a Client Component form that `fetch`es a
  hand-written Route Handler (`app/api/reviews/route.ts`), then calls
  `router.refresh()` to re-render the page. `updateTag` only works inside
  Server Actions, so the Route Handler has to use
  `revalidateTag("reviews", "max")`.
- `/product/p1` (after): section 2's code exactly. `ReviewForm` is a
  Server Component whose `action` is `submitReview.bind(null, productId)`,
  the action ends with `updateTag("reviews")`, and `DeleteReviewButton`
  calls `deleteReview` inside `startTransition`.

Both actions are deliberately unguarded, as in section 2. Example 3 shows
what that costs.

## Run it yourself

```bash
npm install
npm run setup     # generates the Prisma client, creates and seeds dev.db
npm run build
npm start
```

Requires Node.js 20 or later. `npm run setup` creates the SQLite tables
from `prisma/schema.sql`, which mirrors `prisma/schema.prisma` exactly,
and then seeds them through Prisma. Running `npx prisma db push` instead
is equivalent on a normal network; the SQL file exists because some
corporate networks block the engine download `db push` needs. If
`prisma generate` also fails on such a network, set
`PRISMA_SCHEMA_ENGINE_BINARY` to any existing file and run it again;
generating the client doesn't actually use that engine. Run
`npm run setup` again at any point to reset the data.

Open both pages with the Network tab open and post a review on each.

### What we measured

Built and run with Next.js 16.3.8, React 19.3, Prisma 7.10 (production
server, `npm start`), three submissions per version, driven by a headless
Chromium:

| | Requests per submission | New review on screen |
|---|---|---|
| `/api-version/p1` | 2: `POST /api/reviews`, then `GET /api-version/p1?_rsc=...` | **never** (3 of 3 runs), only after a manual reload |
| `/product/p1` | 1: `POST /product/p1` with a `Next-Action` header | after 77 to 90 ms |

The "never" is the point of section 2's `Note (Next.js 16)`. The Route
Handler can only call `revalidateTag("reviews", "max")`, which marks the
cache stale and refreshes it in the background. `router.refresh()` fires
immediately, gets the stale list, and shows it: the reader's own review is
missing until some later request. The Server Action's `updateTag` gives
read-your-writes, and its response already carries the re-rendered page,
so there's no second request at all.

The action request, as captured from the browser:

```
POST /product/p1
next-action: 60b58920cf0a45a2d7f9614e2d5c35111a1e9d9ec9
accept: text/x-component
content-type: multipart/form-data; boundary=...

$ACTION_0:1  ["p1"]
$ACTION_0:0  {"id":"60b58920cf...","bound":"$@1"}
rating       4
text         run 1 via /product/p1
```

Two things worth noticing. The action ID, the `POST`, and the header are
all visible, exactly as section 2's closing paragraph says. And the bound
`productId` (`["p1"]`) travels as plain JSON in the request body, editable
like any other field. Example 3 edits it.

### One finding about JavaScript-disabled browsers

`ReviewForm` here sits inside the page's `<Suspense>` boundary, because
the page reads `params` at request time. With Cache Components on,
streamed Suspense content arrives in a hidden `<div>` and is revealed by
a small inline script. A browser with JavaScript **disabled entirely**
therefore never shows this form (measured: the form is in the HTML but
stays hidden). With JavaScript enabled, the inline script runs before any
bundle loads, so "submit before the JavaScript has loaded" still holds.
Example 2 prerenders its form into the static shell with
`generateStaticParams`, and there the form works with JavaScript off.

## Ties back to the chapter

Section 2, "Server Actions: A Function Call That Crosses the Network":
the mechanism, the single round trip, and the `updateTag` versus
`revalidateTag(tag, "max")` Note, made observable.
