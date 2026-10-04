# 3: Unguarded vs. Guarded Actions

Sections 5 and 6 as a running app, plus a script that attacks it.

- `app/unguarded/[id]/actions.ts`: section 2's `deleteReview`, no checks,
  and section 5's "risky" `submitReviewLeaky`, which returns whatever the
  query loaded.
- `app/product/[id]/actions.ts`: section 6's guarded `deleteReview`
  (scoped `deleteMany`) and `submitReview` (session first, then shape,
  then the purchase check).
- `lib/dal.ts`, `lib/session.ts`: `verifySession` wrapped in React's
  `cache`, over a signed `session` cookie (jose). The sign-in page lets you
  pick a seeded user without a password.
- `app/ReviewList.tsx`: only renders a Delete button next to reviews the
  viewer may delete. That's interface design, not access control.
- `proxy.ts`: section 6's optimistic redirect for `/account`.
- `scripts/attack.mts`: calls the actions with plain `fetch`, no browser.

Seed data: Alice and Bob both bought the shoe (`p1`); only Alice bought
the socks (`p2`); Ada is an admin who bought nothing. Alice's review of
`p1` is `r_alice`.

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

Then, in a second terminal:

```bash
npm run attack
```

### What we measured

Next.js 16.3.8, production server. Output of `npm run attack`:

```
Signed in as Bob, cookie: session=eyJhbGciOiJIUzI1NiJ9.e...

1. UNGUARDED deleteReview('r_alice'), sent with Bob's cookie
   HTTP 200; Alice's review still exists? false

2. GUARDED deleteReview('r_alice'), no cookie at all
   HTTP 200; returned {"status":"error","message":"Please sign in."}; still exists? true

3. GUARDED deleteReview('r_alice'), sent with Bob's cookie
   HTTP 200; returned {"status":"error","message":"Review not found."}; still exists? true

4. GUARDED deleteReview('does-not-exist'), Bob's cookie (same answer as 3: nothing to probe)
   HTTP 200; returned {"status":"error","message":"Review not found."}

5. GUARDED deleteReview('r_alice'), Alice's own cookie
   HTTP 200; returned {"status":"success"}; still exists? false

6. GUARDED submitReview for p2, which Bob never bought, with the bound productId edited by hand
   bound args as served: ["p1",{"status":"idle"}]
   bound args as sent:   ["p2",{"status":"idle"}]
   page re-rendered with: Only customers who bought this product can review it. 

7. submitReviewLeaky: never used by any page, but exported from a module a page imports
   HTTP 200; returned {"id":"cmutzy86s00001g7dnfsxkzfg","productId":"p2","authorId":"u_bob","rating":3,"text":"Leaky return value demo","createdAt":"$D2026-10-04T15:49:42.772Z","author":{"id":"u_bob","name":"Bob","email":"bob@example.com","ro

8. Cross-site request: valid action ID, Alice's own cookie (as a malicious page would send it), Origin: https://evil.example
   HTTP 500; Alice's review still exists? true

9. proxy.ts on /account: no cookie, then a forged cookie
   no cookie:     HTTP 307 -> /login
   forged cookie: HTTP 200, page says: Your session is invalid. Please sign in again.
```

Line by line, against the chapter:

1. **Section 5's central claim.** Bob's browser never rendered a Delete
   button for Alice's review, and it made no difference. The unguarded
   action deleted it.
2. to 5. **Section 6's guarded `deleteReview`.** No session is refused.
   Bob gets "Review not found." for Alice's review *and* for an ID that
   doesn't exist, so probing IDs reveals nothing. Alice can delete her
   own.
6. **Bound arguments are input.** The bound `productId` sits in a hidden
   field in plain JSON. Bob changed `"p1"` to `"p2"` before submitting,
   and the purchase check, not the binding, is what refused him.
7. **Section 5's return-value leak.** `submitReviewLeaky` is exported
   from the same `"use server"` file as an action the page uses, and
   nothing calls it. It still has an ID on the server and runs when
   called, and its return value carried Bob's email address. Its ID never
   appears in any page or client bundle, so in practice an attacker has
   to get it some other way. The safe habit stands: return shaped objects,
   and don't leave unused actions exported.
8. **The origin check.** A request carrying a valid action ID and the
   victim's cookie, but `Origin: https://evil.example`, was rejected with
   "Invalid Server Actions request" (HTTP 500) before the action ran.
9. **Proxy is a convenience, not the check.** No cookie: redirected by
   `proxy.ts`. A forged cookie: `proxy.ts` let it through (it only checks
   that a cookie exists), and `verifySession` on the page rejected it.

## Ties back to the chapter

Sections 5 ("Secure Mutations") and 6 ("Authentication and
Authorization"). Line 6 settles the outline's open question about `.bind`:
bound arguments are not encrypted. They travel as plain JSON, both in the
progressively enhanced form's hidden input and in the JavaScript call's
request body (see example 6's README). Line 7 is the basis for the
wording of section 5's "Dead-code elimination" bullet.
