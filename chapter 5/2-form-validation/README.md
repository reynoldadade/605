# 2: Form Handling and Validation

Sections 3 and 4's review form, assembled:

- `app/product/[id]/review-schema.ts`: the Zod schema, a Shared file with
  no directive. It also exports `REVIEW_MIN` and `REVIEW_MAX`, which the
  form uses for its HTML attributes (section 4's Tip).
- `app/product/[id]/actions.ts`: `submitReview` with `safeParse`,
  `z.flattenError`, the explicit field picks, the product existence check,
  and the returned `values`.
- `app/product/[id]/ReviewForm.tsx`: `useActionState`, `defaultValue`
  from `state.values`, the browser-side `required`/`minLength`/`maxLength`.
- `app/product/[id]/SubmitButton.tsx`: `useFormStatus`.
- `app/product/[id]/page.tsx`: binds `productId`. It lists known products
  in `generateStaticParams`, so the whole page, form included, is
  prerendered into the static shell (see example 1's README for why that
  matters with JavaScript disabled).

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

Open <http://localhost:3000/product/p1>. To see the server's validation,
open DevTools, delete the `required`/`minlength` attributes, and submit
something too short.

### What we measured

Next.js 16.3.8, React 19.3, Zod 4.6, production server, headless
Chromium. "Tampered" means the browser's validation attributes were
removed and a `47` option added to the select, which is what an edited
request amounts to.

| Scenario | JavaScript on | JavaScript disabled |
|---|---|---|
| Empty form submitted | no request sent (browser validation) | no request sent |
| Tampered: rating `47`, text `"  short   "` | "Please fix the highlighted fields." + both field errors; textarea still holds `"  short   "` | same, via a full page POST |
| Tampered: 2,500 characters | "Reviews can be at most 2,000 characters"; all 2,500 characters kept | (not run) |
| While the action runs (800 ms injected delay) | button reads "Posting..." and is disabled | n/a |
| Valid review | "Thanks, your review is live.", review in the list, textarea cleared | same, via a full page POST |

The "textarea still holds" cells are section 4's `values` +
`defaultValue` workaround doing its job: React 19 reset the form after the
action returned, and the fields reset to what the reader had typed.

**Submitting before hydration.** With every JavaScript file delayed by
6 seconds, a review submitted 136 ms after the page arrived went out as an
ordinary browser form `POST` (no `Next-Action` header). The server ran the
action and answered with a full page that already showed
"Thanks, your review is live." Delaying only the form's own chunk gave the
same result. So for a form whose action is the Server Action itself, a
pre-hydration submission isn't queued; it falls back to the native HTML
form submission, and nothing is lost either way. (Example 4 shows the
other case: a form whose action is a client function. That submission
*is* held and replayed after hydration.)

**Bound arguments in the page.** The progressively enhanced form carries
its bound arguments in a hidden input, in plain JSON:
`<input type="hidden" name="$ACTION_1:1" value='["p1",{"status":"idle"}]'>`.
That's the bound `productId` plus `useActionState`'s initial state.

## Ties back to the chapter

Sections 3 ("Form Handling") and 4 ("Validation"). The pre-hydration
and JavaScript-disabled results are the basis for section 3's "Before and
After Hydration" and its Tip about `<Suspense>`.
