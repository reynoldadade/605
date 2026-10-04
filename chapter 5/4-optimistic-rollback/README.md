# 4: Optimistic UI and Rollback

Section 7's `ReviewComposer`, with section 7's Tip built in: switches for
an artificial delay and a forced failure.

- `app/product/[id]/ReviewComposer.tsx`: section 7's code. `useOptimistic`
  for the reader's own pending reviews, `addPending` called inside the
  `useActionState` action, then the real Server Action.
- `app/product/[id]/actions.ts`: section 4's validated `submitReview`, plus
  development-only switches read from a cookie: delay (ms), and mode
  `ok`, `stale` (same as ok, but `revalidateTag("reviews", "max")` instead
  of `updateTag`), `error` (returns an expected failure), `throw`.
- `app/product/[id]/error.tsx`: section 8's route error boundary, with
  Next.js 16.3's `retry` prop.
- `/product-pe/p1`: a variant, see "A variant that keeps progressive
  enhancement" below.

The published reviews list stays a Server Component in its own
`<Suspense>`; only the composer is a Client Component.

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

Open <http://localhost:3000/product/p1>, pick a mode and a delay in the
"Demo" row, and post reviews.

### What we measured

Next.js 16.3.8, React 19.3, production server, headless Chromium. Server
delay 1,500 ms. A `requestAnimationFrame` loop in the page logged every
change to: is the pending entry on screen, is the real review in the
server-rendered list, what does the textarea hold, what does the status
line say. Each line below is a moment something changed.

```
=== mode=ok, server delay 1500ms ===
  13ms pending=false real=false textarea=typed text status="" 
  47ms pending=true real=false textarea=typed text status="" 
  1599ms pending=false real=true textarea=empty/other status="Thanks, your review is live." 
  frames with pending AND real both visible: 0

=== mode=stale, server delay 1500ms ===
  7ms pending=false real=false textarea=typed text status="" 
  56ms pending=true real=false textarea=typed text status="" 
  1573ms pending=false real=false textarea=empty/other status="Thanks, your review is live." 
  frames with pending AND real both visible: 0

=== mode=error, server delay 1500ms ===
  6ms pending=false real=false textarea=typed text status="" 
  40ms pending=true real=false textarea=typed text status="" 
  1557ms pending=false real=false textarea=typed text status="Only customers who bought this product can review it." 
  frames with pending AND real both visible: 0

=== mode=throw, server delay 1500ms ===
  1ms pending=false real=false textarea=typed text status="" 
  51ms pending=true real=false textarea=typed text status="" 
  1595ms pending=false real=false textarea=empty/other status="" error.tsx shown
  frames with pending AND real both visible: 0
```

What this settles:

- **The open claim from the outline holds.** Calling `addPending` inside
  the `useActionState` action keeps the optimistic entry on screen for
  the whole server call: from about 50 ms after the click until the
  response arrives about 1,550 ms later.
- **The swap is seamless.** On success, the pending entry disappears and
  the real review appears in the *same* frame. Zero frames showed both,
  and zero frames showed neither.
- **Section 7's `Note (Next.js 16)` holds.** With
  `revalidateTag("reviews", "max")`, the action reports success, the
  pending entry disappears, and the review is nowhere on screen: the
  response re-rendered the list from the stale cache.
- **Rollback is automatic.** On `error`, the entry disappears in the same
  frame the message appears, and the textarea still holds the reader's
  text. On `throw`, the entry is discarded and `error.tsx` takes over.

### A variant that keeps progressive enhancement

`ReviewComposer` hands `useActionState` a *client* function, the wrapper
that calls `addPending` first. That has a cost, which section 7
covers in "Keeping the Form Working Without JavaScript". A form whose action is a client function can't submit
without JavaScript: React renders it as
`<form action="javascript:throw new Error('React form unexpectedly submitted.')">`.
Measured with every JavaScript file delayed by 6 seconds: a review
submitted 164 ms after the page arrived was **held and replayed** once
the page hydrated, and appeared about 6.4 s later. Nothing was lost, but
with JavaScript disabled the form doesn't work at all.

`/product-pe/p1` gets the same optimistic entry differently.
`ReviewComposerPE` passes the Server Action to `useActionState` directly,
and a small `PendingReview` component inside the form reads
`useFormStatus()`, whose `data` is the `FormData` being submitted. Same
measurement:

```
=== mode=ok, server delay 1500ms ===
  5ms pending=false real=false textarea=typed text status="" 
  55ms pending=true real=false textarea=typed text status="" 
  1605ms pending=false real=true textarea=empty/other status="Thanks, your review is live." 
  frames with pending AND real both visible: 0

=== mode=stale, server delay 1500ms ===
  12ms pending=false real=false textarea=typed text status="" 
  46ms pending=true real=false textarea=typed text status="" 
  1564ms pending=false real=false textarea=empty/other status="Thanks, your review is live." 
  frames with pending AND real both visible: 0

=== mode=error, server delay 1500ms ===
  5ms pending=false real=false textarea=typed text status="" 
  55ms pending=true real=false textarea=typed text status="" 
  1589ms pending=false real=false textarea=typed text status="Only customers who bought this product can review it." 
  frames with pending AND real both visible: 0

=== mode=throw, server delay 1500ms ===
  6ms pending=false real=false textarea=typed text status="" 
  58ms pending=true real=false textarea=typed text status="" 
  1597ms pending=false real=false textarea=empty/other status="" error.tsx shown
  frames with pending AND real both visible: 0
```

The timeline is the same as `ReviewComposer`'s, frame for frame. Before
hydration, it submitted as an ordinary form `POST` and showed the result
after about 1.9 s, as example 2's form does. The trade-off: the pending
entry renders inside the form, and there's no `addOptimistic` to call
from other places. For a single form, that's usually fine.

## Ties back to the chapter

Section 7 ("Optimistic UI"), including its subsection "Keeping the Form
Working Without JavaScript", and section 8's `error.tsx`. Figure 5.2 is
drawn from the measurements above.
