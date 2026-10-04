"""Chapter 5 front matter and end-of-chapter pedagogy (inline `code` and
**keywords** are parsed by build_chapter_05.py)."""

CHAPTER_NUMBER = 5
CHAPTER_NAME = "Mutations with Server Actions"

INTRODUCTION = [
    "Chapters 3 and 4 were about reading: where the code that renders a page runs, and how the data behind it arrives and stays fresh. This chapter is about the moment a reader stops reading and changes something, such as posting a review, updating an address, or placing an order. We will send data from the browser to the server with Server Actions, validate it, decide who is allowed to change what, keep the interface responsive while the server works, handle the failures that come back, and make multi-step changes behave as a single unit.",
    "By the end of this chapter, we will be able to write a Server Action that checks everything it must before it changes anything, in a fixed order, and to design a form that stays fast and honest for the reader while those checks run. We will also be able to explain why every Server Action is a public HTTP endpoint, whatever the code that calls it looks like, and what that means for how we write one.",
    "Every example in this chapter is a runnable Next.js 16 application in the book's repository, https://github.com/reynoldadade/605, under the `chapter 5/` folder. The listings in the text keep to the lines under discussion, and the line below each one names the file that holds the complete version, with a link to it. Each example also has a README with the commands to run it and the results we measured, so any claim in the text can be checked on our own machine. Where an API differs from material written for Next.js 15, React 18, Zod 3, or Prisma 6, a Note box says what changed.",

]

STRUCTURE = [
    "Why Mutation Design Matters",
    "Server Actions: A Function Call That Crosses the Network",
    "Form Handling",
    "Validation",
    "Secure Mutations",
    "Authentication and Authorization",
    "Optimistic UI",
    "Error Handling",
    "Transactional Workflows",
    "Anatomy of a Mutation",
    "Case Study: Hardening a Review Form",
    "Conclusion",
    "Questions and Exercises",
]

POINTS_TO_REMEMBER = [
    "A Server Action is a function marked `\"use server\"` that client code can call, and on the wire every call is a `POST` request anyone can copy and resend",
    "Inside an action that responds to the user's own change, use `updateTag`; Route Handlers use `revalidateTag(tag, \"max\")`",
    "A Server Action passed to a form, or to `useActionState`, keeps the form working before hydration and without JavaScript",
    "`useActionState` turns an action's return value into state the form renders, and `useFormStatus` reports whether the enclosing form is submitting",
    "Validate on the server with a Shared schema and `safeParse`, pick fields by name, and return the reader's values so a reset form keeps their input",
    "Bound arguments travel through the browser in plain JSON and must be validated like any other input",
    "Identity always comes from the verified session, never from the request body",
    "Put ownership rules inside the write itself, such as a scoped `deleteMany`, so there is no gap between checking and acting",
    "Proxy, hidden buttons, and disabled submit buttons improve the experience but never replace checks inside the action",
    "Optimistic UI changes only what the reader sees while the action runs; every server-side check still runs",
    "Expected failures are returned as values, unexpected failures are thrown to the nearest error boundary, and `redirect()` stays outside `try`",
    "Writes that must succeed or fail together go in one transaction, and rules that must never break are enforced by unique constraints",
    "An idempotency key makes a retried submission find the existing result instead of creating a second one",
    "Invalidate caches and send notifications only after the transaction commits",
    "Every action is a front door: authenticate, validate shape, authorize, mutate, invalidate, report back, in that order",
]

SOLVED_EXERCISES = [
    {
        "problem": "A teammate writes an action that deletes a saved address: it calls `verifySession()`, returns an error if there is no user, and then runs `db.address.delete({ where: { id: addressId } })` with the `addressId` the client sent. The UI only shows a Delete button next to the user's own addresses. Is the action safe? If not, fix it.",
        "solution": "No. It authenticates but never authorizes, which is an insecure direct object reference. Any signed-in user can call the action with someone else's address ID, and hiding the button changes nothing because the action reference ships to every visitor whose page uses it. The fix puts the ownership rule into the write: `const { count } = await db.address.deleteMany({ where: { id: addressId, userId: user.userId } });` followed by `if (count === 0) return { status: \"error\", message: \"Address not found.\" };`. Checking and deleting are now one statement, and an address that belongs to someone else produces the same answer as one that does not exist, so probing IDs reveals nothing.",
    },
    {
        "problem": "A review form uses `useActionState`. When the server rejects a 1,500-character review because the rating is missing, the error message appears, but the textarea is empty. Explain why, and fix it without making the fields controlled.",
        "solution": "React 19 resets a form's uncontrolled fields after its action finishes, and that includes an action that returns an error instead of throwing. The fields fall back to their default values, which are empty. The fix has two parts. The action returns the raw input along with the errors, for example `values: { rating: raw.rating, text: raw.text }`. The form then uses those values as defaults, as in `defaultValue={state.values?.text ?? \"\"}`. After the reset, each field's default is what the reader typed, so nothing is lost.",
    },
    {
        "problem": "An action creates an order and, inside the same `db.$transaction` callback, calls `updateTag(\"orders\")` and sends a confirmation email. Name two problems with this placement and say where each call belongs.",
        "solution": "First, if the transaction rolls back after the callback has already run those lines, the email announces an order that was never saved, and that cannot be undone. Second, `updateTag` purges the cache before the commit, so the next request may read the old data again, or pay for a refetch of data that never changed. Only the database's own writes belong inside the transaction. `updateTag` runs after the transaction resolves. The email should be recorded as an outbox row inside the transaction and sent by a background worker, so it is sent if and only if the order committed, and retried if the email service is down.",
    },
    {
        "problem": "Put these lines of a review action into the correct order and justify the position of the authorization step: (a) `reviewSchema.safeParse(raw)`, (b) `updateTag(\"reviews\")`, (c) `verifySession()`, (d) the purchase check query, (e) the `$transaction` that saves the review and updates the rating summary, (f) `return { status: \"success\" }`.",
        "solution": "The order is (c), (a), (d), (e), (b), (f). Authentication comes first so no work is spent on a caller who will be refused anyway. Shape validation comes next. Authorization (d) comes after it because the purchase query needs a well-formed product ID to query with, and before the write because nothing may change until the caller is known to be allowed. The transaction (e) is followed by invalidation (b) only after the commit, and the shaped result (f) is returned last.",
    },
]

MCQS = [
    {
        "question": "What does a Server Action become when it reaches the browser?",
        "options": [
            "A copy of the function's code, minified",
            "An opaque ID plus the machinery to send a request carrying it",
            "A WebSocket subscription",
            "A Route Handler at `/api/actions`",
        ],
        "answer": "B",
    },
    {
        "question": "Inside a Server Action that saves the reader's own review, which call gives read-your-writes behavior in Next.js 16?",
        "options": [
            "`revalidateTag(\"reviews\")`",
            "`revalidateTag(\"reviews\", \"max\")`",
            "`updateTag(\"reviews\")`",
            "`refresh()`",
        ],
        "answer": "C",
    },
    {
        "question": "Why does a validating action return the reader's input as `values`?",
        "options": [
            "React 19 resets uncontrolled fields after the action finishes, even when it returns an error",
            "Zod requires it to report field errors",
            "Without it, the action cannot be bound to a product ID",
            "It makes the form a controlled component",
        ],
        "answer": "A",
    },
    {
        "question": "Which statement about arguments bound with `.bind` is true?",
        "options": [
            "They are encrypted and cannot be read by the browser",
            "They never leave the server",
            "They travel through the browser as plain JSON and must be validated like any input",
            "They are signed, so the server can detect tampering",
        ],
        "answer": "C",
    },
    {
        "question": "Where should a Server Action get the caller's user ID from?",
        "options": [
            "A hidden input in the form",
            "A bound argument set by the page",
            "The verified session cookie, read on the server",
            "The Referer header",
        ],
        "answer": "C",
    },
    {
        "question": "What is the main reason `proxy.ts` cannot be the only authorization check?",
        "options": [
            "It runs too late in the request",
            "It cannot read cookies",
            "It only runs where its matcher says and cannot make record-level decisions",
            "It is not supported in Next.js 16",
        ],
        "answer": "C",
    },
    {
        "question": "With `useOptimistic` called inside a `useActionState` action, how long does the optimistic entry stay on screen?",
        "options": [
            "Until the next page navigation",
            "Exactly as long as the action is running",
            "For a fixed 300 ms",
            "Until the reader clicks it",
        ],
        "answer": "B",
    },
    {
        "question": "Which failure should an action return as a value rather than throw?",
        "options": [
            "The database server is unreachable",
            "A bug dereferences undefined",
            "The reader tries to review a product they have already reviewed",
            "A third-party service times out mid-request",
        ],
        "answer": "C",
    },
    {
        "question": "Why must `redirect()` be kept outside a broad `try`/`catch` block?",
        "options": [
            "It is slower inside a try block",
            "It works by throwing a special signal that a broad catch would swallow",
            "It cannot be called from a Server Action",
            "It clears the cache",
        ],
        "answer": "B",
    },
    {
        "question": "In a checkout that reserves stock, charges a card, and confirms the order, why does the charge run after the reservation?",
        "options": [
            "Payment providers require it",
            "The hardest step to undo should run only once the cheap steps have succeeded",
            "Reservations need the charge ID",
            "Transactions cannot contain reservations",
        ],
        "answer": "B",
    },
]

QUESTIONS = [
    "Explain why a Server Action should be treated as a public HTTP endpoint, using what is visible in the browser's Network tab.",
    "Compare a Route Handler called with `fetch` and `router.refresh()` with a Server Action that calls `updateTag`. What does each one cost the reader who just submitted the form?",
    "What is the difference between shape validation and domain validation? Give an example of each from a review form.",
    "Describe what Next.js protects automatically for Server Actions and what it leaves to the application.",
    "Why is an inline Server Action that captures a secret from its surrounding component a poor choice, even though captured values are encrypted?",
    "Explain the insecure direct object reference problem and two properties of a scoped `deleteMany` that solve it.",
    "Which three questions decide whether an interaction should be optimistic? Apply them to a coupon code field.",
    "What does the outbox pattern guarantee that sending an email directly from an action cannot, and when is `after()` good enough instead?",
    "How does an idempotency key make a double-submitted checkout safe, and why is the unique constraint on the user ID and key together rather than the key alone?",
    "Summarize the six server-side steps of a mutation in order, and explain what goes wrong if authorization runs after the write.",
]

ASSIGNMENTS = [
    "Run the `3-unguarded-action` example and its `npm run attack` script. Then add an `editReview(reviewId, formData)` action that lets authors edit their own review within 24 hours and lets admins edit any review. Put the rule in a `canEditReview(user, review)` function in `lib/dal.ts`, and extend the attack script to prove that Bob cannot edit Alice's review and that an author cannot edit after the window has passed",
    "In the `4-optimistic-rollback` example, add a like button to each published review. Make the like count optimistic with `useOptimistic`, make the action idempotent per user with a unique constraint, and use the demo switches to confirm that a forced failure rolls the count back with a visible message",
    "Extend the `5-transactions` checkout so a cart can hold several products. Add a scenario to `npm run scenarios` in which the second product is out of stock, and show that no stock is decremented and no order is created. Then add a `retry` path to the outbox worker that marks a row as sent only after the email call succeeds",
]

KEY_TERMS = {
    "Server Action": "A Server Function passed to a form's action prop or called from inside an action, used to perform a mutation; each call is a POST request carrying an action ID and serialized arguments.",
    "Server Function": "React's umbrella term for any function marked `\"use server\"` that client code can call.",
    "Progressive enhancement": "Building a form so it works as plain HTML first, with JavaScript improving it rather than being required for it to work.",
    "`useActionState`": "A React 19 hook that wraps an action so its return value becomes state the component renders.",
    "`useFormStatus`": "A `react-dom` hook that reports whether the enclosing form is submitting, and the data being submitted.",
    "`updateTag`": "A Next.js 16 function, available only in Server Actions, that expires cached entries for a tag so the next read waits for fresh data.",
    "Shape validation": "Checking that input is well-formed, such as types, ranges, and lengths, without consulting current data.",
    "Domain validation": "Checking that input makes sense against current data, such as whether a referenced product exists.",
    "Mass assignment": "A vulnerability in which extra fields sent by a client are written to the database because the whole submission was passed to a write.",
    "Data access layer": "A server-only module through which every read and write of protected data passes, returning deliberately shaped objects.",
    "Insecure direct object reference": "A vulnerability in which an action checks that the caller is signed in but acts on whatever record ID the caller supplied.",
    "Optimistic UI": "Showing the result of an action before the server confirms it, and correcting the interface if the action fails.",
    "Idempotency key": "A unique value sent with a request so that retries of the same request produce the original result instead of a duplicate.",
    "Compensation": "An explicit inverse operation that undoes an earlier step of a workflow when a later step fails, used where no transaction can span all steps.",
    "Outbox": "A table written in the same transaction as a change, recording side effects such as emails for a background worker to perform later.",
    "Every action is a front door": "This chapter's pattern: every Server Action authenticates, validates, authorizes, mutates, invalidates, and reports back, in that order, because anyone can call it directly.",
}

FIGURES = {
    "5.1": ("fig_5_1_server_action_lifecycle.png", "The lifecycle of a Server Action request: one round trip carries the mutation, the cache invalidation, and the updated page"),
    "5.2": ("fig_5_2_optimistic_timeline.png", "An optimistic review over time: success, a returned error, and the stale-cache case, as measured in the 4-optimistic-rollback example"),
    "5.3": ("fig_5_3_guard_pipeline.png", "The guard pipeline: every action is a front door"),
}

TABLE_5_1_CAPTION = "The same submissions sent to the before and after versions of the review form"

REPO_BLOB = "https://github.com/reynoldadade/605/blob/master/chapter%205/"
REPO_TREE = "https://github.com/reynoldadade/605/tree/master/chapter%205"
