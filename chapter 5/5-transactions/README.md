# 5: Transactional Workflows

Section 9, both halves.

**Reviews** (`app/product/[id]/actions.ts`): the review insert and the
product's rating summary update in one `db.$transaction`, the narrow
`P2002` catch around it, `updateTag("reviews")` after the commit, and the
`@@unique([productId, authorId])` constraint in `prisma/schema.prisma`.
The application-level "already reviewed?" check is kept in front, as
section 9 recommends.

**Checkout** (`app/checkout/`, `lib/orders.ts`, `lib/payments.ts`):
`placeOrder` exactly in section 9's order. Reserve stock and create a
pending order in one transaction (`reserveOrder`, conditional `stock`
decrements, total computed from database prices). Then charge, with the
order ID as the provider's idempotency key. Then confirm (`confirmOrder`:
mark paid, clear the cart, insert an `Outbox` row, one transaction), or
compensate on decline (`releaseOrder`). The idempotency key is
`@@unique([userId, idempotencyKey])` on `Order`. Also:

- `lib/payments.ts`: a fake provider, idempotent by key, switchable to
  approve, decline, or time out. A timeout means the card *was* charged
  but our request never heard back; the provider then calls the webhook.
- `app/api/payments/webhook/route.ts`: the Route Handler that settles a
  pending order, using `revalidateTag(tag, "max")` since `updateTag` isn't
  available there.
- `scripts/outbox-worker.mts` (`npm run outbox`): drains the outbox.
- Development-only switches (cookies, set from the home page): payment
  mode, a crash between the review insert and the rating update, and
  a delay between the application check and the write.

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

Sign in at `/login` (Bob has the socks in his cart), set the switches on
the home page, and try `/product/p1` and `/checkout`. For the scripted
runs, in a second terminal:

```bash
npm run scenarios
npm run outbox
```

### What we measured

Next.js 16.3.8, Prisma 7.10 on SQLite, production server. `npm run
scenarios` submits forms the way a browser without JavaScript would, so
two submissions can leave at exactly the same moment:

```
A. Review double-submit: two identical submissions from Bob, at the same moment
   -- with 0ms between the application check and the write --
   request 1: HTTP 200 "Thanks, your review is live."
   request 2: HTTP 200 "You've already reviewed this product."
   Bob's reviews of p1 in the database: 1
   p1 summary: {"ratingAverage":4.5,"ratingCount":2}
   -- with 200ms between the application check and the write --
   request 1: HTTP 200 "You've already reviewed this product."
   request 2: HTTP 200 "Thanks, your review is live."
   Bob's reviews of p1 in the database: 1
   p1 summary: {"ratingAverage":4.5,"ratingCount":2}
   (server log says which layer stopped each duplicate)

B. Failure between the two writes (Alice reviewing p2, crash after the insert)
   HTTP 500  (thrown error -> error boundary)
   Alice's reviews of p2: 0; p2 summary before {"ratingAverage":0,"ratingCount":0}, after {"ratingAverage":0,"ratingCount":0}
   same review, no crash: HTTP 200 "Thanks, your review is live."; p2 summary now {"ratingAverage":5,"ratingCount":1}

C. Checkout double-submit: same attempt key, two requests at once (socks, stock 1)
   request 1: HTTP 303 -> /orders/cmuu001bo0005de7d25mw4y42
   request 2: HTTP 303 -> /orders/cmuu001bo0005de7d25mw4y42
   Bob's orders: [{"status":"paid","total":1900}]; socks stock: 0

D. Checkout again with the socks back in the cart, but none left in stock
   HTTP 200 "Merino Running Socks is out of stock."
   Bob's orders: [{"status":"paid","total":1900}]; socks stock: 0

E. Payment declined: compensation releases the reservation
   HTTP 200 "Your payment was declined. You have not been charged."
   Bob's orders: [{"status":"cancelled","total":1900}]; socks stock: 1

F. Payment times out (the charge actually went through)
   HTTP 303 -> /orders/cmuu001x8000ade7d1cvkbzfz
   order page right away: "We're confirming your payment"; db: [{"status":"pending","total":1900}]
   2.5s later, after the webhook: "Paid: $19.00."; db: [{"status":"paid","total":1900}]
   outbox rows waiting to send: 1; Bob's cart items: 0
```

The server log for scenario A said which layer stopped each duplicate:

```
[submitReview] duplicate stopped by the application check
[submitReview] duplicate stopped by the unique constraint (P2002)
```

and `npm run outbox` afterwards:

```
sending order-confirmation-email {"orderId":"cmuu001x8000ade7d1cvkbzfz"}
1 message(s) sent
```

What this settles:

- **A: section 9's check-then-act gap is real, and the constraint closes
  it.** With no delay, the application check caught the duplicate: this
  SQLite database answers in microseconds, so the first request finished
  before the second one reached its check. With a 200 ms gap, standing
  in for network latency to a real database server, both requests passed
  the check and the unique constraint stopped the second. Either way: one
  review, a friendly message, a correct summary.
- **B: the transaction rolled back.** The crash after the insert left no
  review and an untouched summary. The same review without the crash went
  through and the summary moved to 5.00 from 1.
- **C: idempotency.** Two submissions with the same attempt key produced
  one order, one stock decrement, and both requests landed on the same
  order page. The second lost the race on the `Order` unique constraint,
  its whole reservation transaction rolled back, and `reserveOrder` handed
  back the winner's order.
- **D: conditional decrement.** No stock, no order, nothing charged.
- **E: compensation.** A declined card cancelled the order and put the
  sock back in stock.
- **F: the unknown outcome.** The action left the order pending and said
  so. The webhook confirmed it about 1.5 s later: order paid, cart
  cleared, confirmation email waiting in the outbox for the worker.

### Two details worth knowing

1. **The checkout page needs `await connection()` under Next.js 16.**
   Calling `randomUUID()` directly during render, as a Next.js 15 page
   would, fails the build with Cache Components on: *Route "/checkout":
   Next.js encountered the unstable value
   `require('node:crypto').randomUUID()` while prerendering.* Otherwise the
   key would be baked into the static shell and shared by every visitor.
   `app/checkout/page.tsx` calls `await connection()` first, inside a
   `<Suspense>` boundary. Section 9 shows this version and explains it in
   a `Note (Next.js 16)`.
2. **The timeout case is handled in code.** Section 9 describes it in
   prose and leaves it out of the listing. Here `payments.charge` throws
   `PaymentTimeoutError`, and `placeOrder` redirects to the order page
   without releasing or confirming. The purchase check in `submitReview`
   also counts only `paid` orders, since this example creates pending and
   cancelled ones.

## Ties back to the chapter

Section 9 ("Transactional Workflows"), and section 8's narrow `P2002`
catch.
