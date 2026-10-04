# 6: Case Study, Hardening a Review Form

The full worked version of the chapter's Case Study. Both versions sit on
Chapter 4's product page (product header, reviews and recommendations
streamed in their own `<Suspense>` boundaries, a route `error.tsx`), on
the same Prisma data.

- `/before/p1`: `app/before/[id]/`. A Server Component form with hidden
  `productId` and `authorId` fields, and a `postReview` action that trusts
  all of them, writes the review and the rating summary separately, and
  calls `revalidateTag("reviews", "max")`.
- `/after/p1`: `app/after/[id]/`. The Case Study's sample answer:
  `submitReview` in section 10's six steps, section 7's `ReviewComposer`,
  section 8's `SectionBoundary` (`catchError`) around recommendations.

(In the chapter both versions live at `app/product/[id]/`; here they sit
side by side under `before/` and `after/`.)

Seed data: Alice and Bob both bought the shoe (`p1`); Ada is an admin who
bought nothing. Alice has already reviewed `p1`.

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

Sign in at `/login`, then compare `/before/p1` and `/after/p1`. The home
page has a switch that takes the recommendations service down. For the
scripted comparison, in a second terminal:

```bash
npm run compare
```

### What we measured

Next.js 16.3.8, React 19.3, Prisma 7.10, production server.

**Direct requests** (`npm run compare`). The data is reset before each
version; "saved" lists the new reviews of `p1` in the database afterwards:

```
Signed out, form edited to say authorId=u_bob
  before responses: HTTP 200
         saved: [{"author":"Bob","rating":1}]
  after  responses: "Sign in to post a review."
         saved: []

Ada (admin), never bought p1
  before responses: HTTP 200
         saved: [{"author":"Ada (admin)","rating":1}]
  after  responses: "Only customers who bought this product can review it."
         saved: []

Bob, rating 47 and text "ok"
  before responses: HTTP 200
         saved: [{"author":"Bob","rating":47}]
  after  responses: "Please fix the highlighted fields."
         saved: []

Bob, valid review, submitted twice at once
  before responses: HTTP 200 | HTTP 500 (error page)
         saved: [{"author":"Bob","rating":4}]
  after  responses: "Thanks, your review is live." | "You've already reviewed this product."
         saved: [{"author":"Bob","rating":4}]

Bob, valid review, once
  before responses: HTTP 200
         saved: [{"author":"Bob","rating":4}]
  after  responses: "Thanks, your review is live."
         saved: [{"author":"Bob","rating":4}]
```

**In the browser** (headless Chromium, signed in as Bob):

```
before: text on screen after never (3s)ms; in the server-rendered list after never (3s)ms; summary: Average 5.00 from 1 reviews
after: text on screen after 71ms; in the server-rendered list after 862ms; summary: Average 4.50 from 2 reviews
before, recommendations down: product heading visible=false, review form visible=false, route error.tsx=true, section fallback=false
after, recommendations down: product heading visible=true, review form visible=true, route error.tsx=false, section fallback=true
after, service back up, clicked Try again: recommendations rendered=true, form text kept="half-written review, typed before retrying"
```

Reading the two together:

- Every write the before version accepted from a forged, unauthorized, or
  malformed request, the after version refused, with a message the form
  can show.
- The double submission is one review either way, because the
  `@@unique([productId, authorId])` constraint holds in both. The
  difference is what the second request sees: an error page before, a
  sentence after.
- Before, the reader's own review never appears (stale-while-revalidate),
  and the rating summary on screen stays at the old value. After, the
  optimistic entry is on screen in about 70 ms and hands over to the real,
  server-rendered review when the response lands (about 860 ms here,
  including the re-render of the page). The summary updates in the same
  response.
- With recommendations down, the before page is entirely `error.tsx`. The
  after page keeps the product, the reviews, and the form, and only the
  recommendations section shows a retry prompt. When the service came
  back, `retry()` re-fetched just that section, and the half-written
  review in the textarea survived the retry.

**About the after side of `npm run compare`.** `ReviewComposer` gives
`useActionState` a client wrapper (section 7), so the form can't be
posted like a no-JavaScript form. The script calls the action the way the
browser's JavaScript does, copied from a captured request: `Next-Action`
header, arguments in field `"0"` (`["p1", {"status":"idle"}, "$K1"]`, with
the bound `productId` first, in plain JSON), form fields prefixed `_1_`.
From Node, such a call occasionally comes back as HTTP 500 *after* the
action has already returned its result (the server logs "Unexpected end
of form"), so the script reports what the action said rather than the
status code. Browsers didn't hit this in any run.

## Ties back to the chapter

Section 11 (Case Study) and section 10 (Anatomy of a Mutation).
