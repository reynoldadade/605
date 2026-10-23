# Chapter 6: drafted prose (all sections, awaiting review)

Drafted 2026-10-22 in Cowork against `chapter-06-outline.md`. All
sections were written in one pass at the user's request; the user reviews
them together and we adjust before back-matter and the `.docx` build.
Updated 2026-10-23: the six worked examples are built and measured, every
`[[MEASURE]]` is filled in from them, and the prose was corrected where
the examples disagreed with the first draft (see the outline's change log).
Updated 2026-10-23 (later): cut, at the user's request, section 6's External
Stores and Selectors, section 7's Effects That Don't Re-subscribe, and
section 8's Traps in Measurement. Earlier the same day: a full `unslop` editing pass, at the user's
request. Headings stay in Title Case and bullet lead-ins keep the
`**Label:**` form, because the publisher's guidelines and the approved
Ch.3 to Ch.5 chapters use them.

Style notes, carried over from Ch.3 to Ch.5: "we" not "I"/"me", no quoted
reported speech, no double dashes or em dashes, code identifiers in
backticks (Consolas 10pt bold code-in-text in the docx), bullets without
end periods, no question-format headings. Ch.6 targets Next.js 16.4,
React 19.3 and React Compiler 1.0, with version differences in labelled
Note boxes.

Markers: `[[CODE path]]` = full code in `605/chapter 6/`; `[[FIGURE 6.N]]`
= `605/chapter 6/figures/`. Every number in the prose comes from an
example's `npm run measure` (recorded in its README and
`measurements.json`).

---

## Why Performance Comes Back

The last three chapters moved work away from the browser. Chapter 3 rendered on the server every component that didn't need interactivity, and shrank each client boundary to a leaf. Chapter 4 moved data fetching to the server, so the browser no longer runs a chain of requests before it can draw anything. Chapter 5 put every rule about changing data into Server Actions, where the browser can't skip them. A product page that once shipped its whole component tree, its data layer, and its validation logic to every visitor now ships a handful of small Client Components.

This chapter is about those Client Components. Chapter 5 left several on the product page: a review composer with optimistic state, a form that shows field errors, a delete button with its own transition, and a submit button that reads its form's status. A catalogue adds more over a year, such as a filter panel, a compare tray, a cart badge, a size picker, and a recently viewed strip. Each of them re-renders when its state changes. Many also re-render when a parent's state changes, even when nothing they show is different. One keystroke in a search box can run hundreds of component functions. Server Components don't help with this. They rendered once, on the server. Everything that happens after the page arrives runs on the client.

For most of React's history, keeping that client work small meant writing code for the renderer rather than for the next developer. A derived list went inside `useMemo` with a dependency array. An event handler went inside `useCallback`, so that a child received the same function on every render. The child went inside `React.memo`, so that it compared its props before rendering. Together these wrappers doubled the length of a twenty-line component. Each dependency array could also hold a bug. A missing dependency served stale data, and an extra one cancelled the optimization. Many codebases ended up with half their components memoized by default, and no one could say which wrappers made a difference.

This chapter's tension is clarity against speed. Clear code reads as a plain function of props and state, with handlers written inline and derived values computed where they're used. Fast code skips any work whose inputs haven't changed, and until recently we had to mark each piece of that work by hand.

The React Compiler removes most of that trade. At build time, it works out which values depend on which inputs and inserts the memoization itself, at a finer grain than we would write by hand. The source stays plain and the bundle does less work. Two limits keep this from being the whole answer, and the chapter returns to both.

- **The compiler relies on the Rules of React:** it assumes that rendering is pure and that props and state are never mutated. It skips code that visibly breaks those rules. Code that breaks them in ways it can't see gets compiled into something that behaves differently
- **The compiler only skips repeated work:** it can't move state lower in the tree, take data out of a context, or keep 5,000 rows out of the DOM. Those are architectural decisions, and they decide how much work exists

So the resolution has two parts. Architecture decides how much work there is. The compiler decides how much of it repeats. Neither replaces the other, and the order matters. A render that a good structure never triggers costs nothing, and the compiler can then handle the work that remains.

The sections that follow cover what a render costs and how to observe one, what the compiler does, what it memoizes, and how to write code it can compile. After that comes the architecture the compiler can't supply: where state lives, how to handle long lists and slow updates, and the problems that remain in a fully compiled build. Section 9 turns all of it into a workflow, and the Case Study applies that workflow to a product explorer that became slow one feature at a time.

## What a Render Costs

Before optimizing anything, we need to know what we're optimizing. People use the word "render" for three different things, and two of them are cheap.

When something changes, React works in two phases. In the **render phase**, it calls component functions to find out what the UI should look like now. Each call returns a tree of elements, which are plain objects that describe the UI, and React compares the new tree with the previous one. In the **commit phase**, it applies only the differences to the DOM: a changed text node, a new attribute, an inserted row. The browser then recalculates styles, lays out the page, and paints whatever changed.

The commit phase is usually small, because React touches only what differs. Wasted work collects in the render phase. A component function that runs, builds the same elements as last time, and changes nothing in the DOM still costs its running time, plus every function call, array allocation, and child component it triggered.

[[FIGURE 6.1]]

### Three Reasons a Component Renders

A Client Component's function runs again for one of three reasons.

- **Its own state changed:** a `useState` setter or a `useReducer` dispatch received a value React doesn't consider equal to the current one
- **A context it reads changed:** a provider above it received a new `value`, compared by identity
- **Its parent rendered:** by default, when a component renders, every child it returns renders too, even if that child's props are unchanged

The third reason surprises people most, and it causes most wasted work. Props don't cause renders. A parent's render does, and the child receives its props as part of that render. A `<ReviewList>` whose `reviews` prop is the same array as last time still runs when its parent runs, unless something tells React to skip it. Before the compiler, that something was `React.memo`, which made the child compare its props first. Section 4 shows what replaces it.

Server Components aren't on this list. They render on the server, per request or per cache entry as Chapter 4 arranged, and send their output in the RSC payload. A state change in the browser never runs a Server Component again. Only a new request does: a navigation, a `router.refresh()`, or the page a Server Action sends back after `updateTag`, as Chapter 5 described. This is what Chapter 3's "server shell, client islands" pattern means for performance. Code outside the Client Components costs the browser nothing to re-render, because the browser never re-renders it.

### Re-rendering Is Not a Bug

A component that renders more often than necessary is normal, and usually harmless. React keeps component functions cheap to call. A function that reads three props and returns a `<button>` takes microseconds, and a hundred extra calls a second go unnoticed. Re-renders become a problem when they add up to something the reader notices:

- **Typing lags:** each keystroke triggers enough work that characters appear late
- **Interactions stall:** a click takes long enough to respond that the browser reports a slow Interaction to Next Paint, the Core Web Vital that measures the delay between an input and the next frame
- **Animations stutter:** work on the main thread pushes frames past their 16 ms budget

So optimization starts with a measurement. A component that renders forty times at no measurable cost needs no attention. A component that renders twice and costs 80 ms does.

### Seeing Renders

Three tools answer three different questions.

The **React DevTools Profiler** records an interaction and lists every commit it caused, the components that rendered in each commit, and how long each one took. With an option enabled in its settings, it also shows why each component rendered, naming the prop, state, or context that changed. That view finds a parent that renders children for no reason faster than any other tool.

**Performance Tracks** in the browser's performance panel show React's work on the same timeline as scripts, layout, paint, and network requests. They tell us whether the slow part of an interaction is React at all, or a third-party script, a forced layout, or an image decode.

The **highlight updates** option in React DevTools draws an outline around each component as it renders. The output is noisy, but it shows within seconds that typing in a search box also re-renders the header.

> **Note (React 19.2).** Performance Tracks arrived in React 19.2. They add a Scheduler track, which shows what React is working on and at what priority, and a Components track, which shows which components rendered and for how long, inside Chrome's performance panel. Before 19.2, matching React's work to the browser's timeline meant switching between the Profiler and the performance panel and lining up timestamps by hand.

> **Tip.** Measure a production build. The development build runs extra checks, and Strict Mode calls every component function twice to expose impure renders, so development timings can be several times slower than what readers see. Run `next build && next start` locally, and use the Profiler's production profiling build if needed. Use the development build to find which components render, and the production build to find out whether it matters.

This chapter's examples count renders the way the Profiler does. A small script installs itself where React DevTools would, receives every commit, and counts each component whose function ran. Example `2-render-counts/` applies it to a product page in the style of Chapter 5's. One Client Component holds a gallery, a price, a size picker, twelve reviews, and a review composer with a character count, and keeps the draft review as state in its top component. Without the compiler, typing a ten-character review ran 470 component functions. All 47 components ran once per keystroke, to update one textarea and one character count. The next two sections cover what happens to that number when the compiler is on.

## Compiler Fundamentals

The React Compiler runs at build time. It is a Babel plugin, with an experimental native version for Turbopack. It reads each component and custom hook in our source and rewrites it to keep its previous results and reuse them when the inputs are unchanged. The only part that runs in the browser is the code it emits, which is ordinary JavaScript that calls one small helper from React.

The compiler reached a stable 1.0 release in October 2025, after several years in production at Meta. The major frameworks support it.

### What the Compiler Produces

The quickest way to understand the compiler is to read its output. Here is a small Client Component like many on the product page:

```tsx
// app/product/[id]/ReviewList.tsx ("use client", excerpt)
const [expanded, setExpanded] = useState(false);
const visible = reviews.filter((r) => r.rating >= minRating);
const shown = expanded ? visible : visible.slice(0, 3);

return (
  <section>
    <ul>{shown.map((r) => <ReviewItem key={r.id} review={r} />)}</ul>
    <button onClick={() => setExpanded(!expanded)}>
      {expanded ? "Show fewer" : "Show all"}
    </button>
  </section>
);
```

[[CODE 1-compiler-output/src/ReviewList.tsx]]

The source has no `useMemo`, no `useCallback`, and no `React.memo`. Here is part of the compiled output:

```js
// compiled output (excerpt)
import { c as _c } from "react/compiler-runtime";

export function ReviewList(t0) {
  const $ = _c(16);
  // ...
  let t1;
  if ($[0] !== expanded || $[1] !== minRating || $[2] !== reviews) {
    // ...the filter, the slice, and the map run here
    t1 = shown.map(_temp);
    $[0] = expanded;
    $[1] = minRating;
    $[2] = reviews;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  // ...
  let t3;
  if ($[8] !== expanded) {
    t3 = () => setExpanded(!expanded);
    $[8] = expanded;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  // ...
}

function _temp(r) {
  return <ReviewItem key={r.id} review={r} />;
}
```

[[CODE 1-compiler-output/out/ReviewList.js]]

Three things in this output explain how the compiler works.

- **A cache per component instance:** `_c(16)` asks React for an array of 16 slots that belongs to this instance of `ReviewList` and persists between its renders. React stores it the same way it stores a `useState` value, so two `ReviewList`s on one page each have their own cache
- **Inputs and outputs stored together:** each guarded block compares its inputs with the values it recorded last time, as in `$[0] !== expanded`. If any input differs, the block recomputes and records the new inputs and the new result. If none differ, it reads the previous result
- **Work moved out of the component:** the arrow function that turns a review into a `<ReviewItem>` reads nothing from the component, so the compiler moved it to module level as `_temp`, where the browser creates it once

The full output has six guarded blocks: the filter's predicate, the list of items, the `<ul>`, the click handler, the button, and the outer `<section>`. Each block is keyed on the values it reads. When a parent re-renders `ReviewList` with the same `reviews` and `minRating`, every block reads from the cache, and the function returns the same `<section>` element as last time without filtering, slicing, or mapping. A click on the button changes `expanded`, so the compiler rebuilds the list and the handler. A new `reviews` array from the parent rebuilds the list but not the handler.

`visible` and `shown` have no slots of their own. The compiler caches values that reach the output, here the list of elements, and recomputes intermediate values inside the block that uses them. Caching every intermediate value would cost memory and comparisons without saving any render work. Figure 6.2 shows all sixteen slots.

[[FIGURE 6.2]]

### How It Decides

The compiler doesn't look for code shaped like `useMemo`. It turns each function into an internal representation of every value and where each value flows, then works out two things. First, it finds the reactive values, which can differ between renders because they come from props, state, context, or something computed from those. Second, it groups values that are created and used together, so that they can share one guarded block. A value that depends on nothing reactive is computed once. A value that depends only on `minRating` is recomputed only when `minRating` changes.

This analysis needs to know what our code does, and especially what it changes. The compiler assumes the code follows the Rules of React: rendering is pure, props and state are immutable, and hooks are called unconditionally at the top level. Where it can prove that the code breaks a rule, it skips the component and leaves it as written. Where it can't see the break, it compiles the component and assumes the rules hold. Section 5 covers both cases.

### Turning It On in Next.js

In a Next.js 16 project, enabling the compiler takes one package and one line:

```bash
npm install -D babel-plugin-react-compiler
```

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
```

The examples' `next.config.ts` files also read an environment variable, so that `npm run measure` can build each app with the compiler on and off and compare the two.

Next.js doesn't run the Babel plugin over every file. An SWC pass checks each file first and sends only files that contain JSX or hooks to the compiler, which keeps the extra build time small. Builds are still somewhat slower with the compiler on, which is why it remains opt-in.

> **Note (Next.js 16).** In Next.js 15 the option was `experimental.reactCompiler`. Next.js 16 moved it to the top-level `reactCompiler` key after the compiler's 1.0 release. The option is stable, but stays off by default while the Next.js team collects build-time data from different kinds of applications.

> **Note (Next.js 16.3).** Next.js 16.3 added an experimental `experimental.turbopackRustReactCompiler` option, which runs a Rust port of the compiler inside Turbopack instead of the Babel plugin. It requires `reactCompiler` to be on, works only with Turbopack, and removes the need for `babel-plugin-react-compiler`. Try it on large codebases where the Babel pass adds noticeable build time.

### Client Code Only

This detail matters more in a book about Server Components than in most writing about the compiler. We built a small Next.js 16 app with `reactCompiler: true` and inspected the output. The `"use client"` component in the browser bundle had the memo cache. The same component's server-side rendering chunk, and the async Server Component page next to it, were emitted as written. Next.js applies the compiler to the client bundle only.

The reason goes back to section 2. A Server Component renders once per request and never re-renders in response to state, so it has no previous result to reuse. React's server renderer reflects this: the memo cache it gives a component on the server is a fresh array every time. Memoizing a Server Component would add code and save nothing.

The compiler's benefit therefore lands in the Leaf Client Components, where the previous chapters left client code. A codebase that followed Chapter 3's advice has small Client Components, which are the easiest code for the compiler to analyze and the cheapest to optimize.

> **Tip.** The compiler targets React 19 by default, which ships the `react/compiler-runtime` helper. Projects on React 17 or 18 can use it by setting the compiler's `target` option and installing the `react-compiler-runtime` package. Next.js sets the target automatically when it detects React 18. Everything in this book uses React 19.

### Confirming It's Working

React DevTools shows a small **Memo ✨** badge next to each component the compiler optimized. A component without the badge is either outside the client bundle, like every Server Component, or one the compiler skipped. Section 5 shows how to find out why.

With the compiler on, the ten-keystroke review from section 2 ran 31 component functions instead of 470. The top component ran on every keystroke because it owns the state, and the composer and the character count ran because their props changed. The submit button ran once, when the draft reached ten characters and the button became enabled. The gallery, the price, the size picker, and the twelve reviews didn't run at all. The next section explains why.

## Automatic Memoization

Section 3 showed the mechanism. This section covers what it saves, what happens to existing `useMemo`, `useCallback`, and `React.memo` calls, and where its benefit stops.

### Three Things Get Memoized

The compiler memoizes three kinds of value, and each one replaces a manual tool.

- **Computed values:** a filtered list, a total, a formatted date. `useMemo` used to do this
- **Functions:** event handlers and callbacks passed to children or to effects keep the same identity until something they read changes. `useCallback` used to do this
- **JSX elements:** the elements a component returns, and every subtree inside them. No manual hook did this directly, and it saves the most work

Cached elements remove most wasted renders because of a rule React has always followed. When a component returns the same child element object as last time, React knows nothing about that child changed and skips rendering it. Before the compiler, this rule rarely applied, because writing `<ReviewItem review={r} />` in a component body created a new element object on every render. With the compiler, the element comes from the cache when `r` is unchanged, so it is the same object, and React skips `ReviewItem` without `ReviewItem` doing anything.

This is how the compiler replaces `React.memo` in most cases. `React.memo` made the child compare its props on every parent render. The compiler makes the parent return the same element, so no comparison runs.

### Finer Than We'd Write by Hand

Manual memoization was coarse because writing it was tedious. Nobody wrapped a `<button>` element in its own `useMemo`, or memoized the `<ul>` separately from the `<section>`. The compiler does, at no cost to us.

It also memoizes where hooks can't go. The Rules of Hooks forbid calling `useMemo` after an early return. An expensive computation that only matters when a panel is open could be memoized above the `return`, where it also ran when the panel was closed, or left below the `return` without memoization. The compiler's cache slots aren't hooks, so the Rules of Hooks don't limit where it puts them:

```tsx
// app/product/[id]/RatingStats.tsx ("use client", excerpt)
if (!open) return null;

const sorted = [...ratings].sort((a, b) => a - b);
return <RatingChart points={sorted} />;
```

[[CODE 1-compiler-output/src/RatingStats.tsx]]

In the compiled output, the sort sits after the early return, in a block guarded by `ratings`. It runs only when the panel is open, and runs again only when the ratings change.

### Context Readers

Context was always the hardest thing to memoize by hand. The compiler helps, but doesn't solve it. A component that reads a context still runs whenever the provider's `value` changes, because React has to deliver the new value. The compiler changes how much of the component's output survives:

```tsx
// app/components/CartCount.tsx ("use client", excerpt)
const { items } = useContext(CartContext);
return <Badge count={items.length} />;
```

[[CODE 1-compiler-output/src/CartCount.tsx]]

The compiler caches the `<Badge>` element on `items.length`. When the cart context changes without changing the count, for example when the quantity of an existing line changes, `CartCount` runs, finds the same length, and returns the same element, so `Badge` doesn't render. A context change still runs every consumer, but no longer everything below them. Section 6 covers how to reduce it further by putting less into one context.

### What Happens to Existing Manual Memoization

Turning on the compiler doesn't require removing anything. The compiler understands existing `useMemo`, `useCallback`, and `React.memo` calls and compiles around them. By default it also checks that its own memoization is at least as strong as the manual memoization it found. If a `useMemo` lists fewer dependencies than its callback reads, the compiler can't keep what the code promises without also keeping the bug, so it skips the component:

```tsx
// skipped by the compiler: q is read but not listed
const matches = useMemo(
  () => items.filter((i) => i.includes(q)),
  [items],
);
```

This component keeps its stale-result bug and gets no automatic memoization. The compiler reports that it could not preserve the existing memoization, and in the editor the `exhaustive-deps` rule flags the missing dependency. Section 5 shows how to list the components the compiler skipped.

For new code, skip manual memoization and let the compiler do the work. In existing code, the manual wrappers can stay. Once the compiler is on and the component has the Memo ✨ badge, removing them is safe, but optional. Remove them a few at a time, with the Profiler open.

> **Note (Next.js 16).** The `reactCompiler.environment.enablePreserveExistingMemoizationGuarantees` option controls whether the compiler insists on preserving existing memoization. The Next.js documentation recommends setting it explicitly in `next.config.ts`, because its default comes from the active compiler implementation and has changed between versions. This chapter's examples leave it at the default.

### Where Manual Memoization Still Earns Its Place

A few cases still call for a deliberate hook, because the goal isn't skipping a render.

- **An effect that must not re-run:** if an effect depends on a value and running the effect is expensive, such as opening a WebSocket connection, make the dependency's stability explicit. The compiler usually memoizes the value anyway, but a `useMemo` records that the code depends on it, and the lint rules flag the dependency array if it changes.
- **A value handed to a library that compares by identity:** a charting or table library may rebuild its internal state whenever it receives a new options object. The compiler caches that object while its inputs are unchanged, which is usually enough. When a library has unusual expectations, an explicit `useMemo` stops its behavior from depending on how the compiler grouped the code
- **Work that's expensive in every instance:** the compiler's cache belongs to one component instance. Fifty `ProductCard`s that each parse the same large JSON blob parse it fifty times. Work that should happen once per page belongs in a Server Component, a module-level cache, or Chapter 4's data layer, not in client memoization

> **Tip.** Memoization skips repeated work. It never makes the first render faster, and a component that's slow on its first render is slow for every reader who opens the page. If the Profiler shows a slow component on mount, reduce the work, with fewer elements, virtualization, or a smaller Client Component, rather than adding caching.

## Compiler-Friendly Coding

The compiler promises one thing: if our components follow the Rules of React, the optimized version behaves like the original. This section covers what happens when they don't.

The rules are short and older than the compiler. React has always assumed them, and Strict Mode renders twice to catch code that breaks them. The compiler depends on them more than React's runtime does, because it makes its decisions once, at build time, from what the code says.

- **Rendering is pure:** given the same props, state, and context, a component returns the same output, and calling it has no side effects. That rules out network requests, writes to anything outside the component, and reading values that change by themselves, such as the clock or a random number
- **Props and state are immutable:** a component never changes the objects it receives, and creates new ones instead
- **Hooks are called unconditionally, at the top level:** the same hooks, in the same order, on every render
- **Rendering doesn't depend on refs:** code reads and writes `ref.current` in event handlers and effects, not during render

### When the Compiler Can See the Problem

The compiler can see some violations in the code. For those, it skips the component, leaves it as written, and the build continues. Reading a ref during render is the classic case:

```tsx
// skipped: ref read and written during render
const renders = useRef(0);
renders.current++;
return <p>Rendered {renders.current} times</p>;
```

The component works as before. It just isn't memoized, and the build output doesn't mention it. With the default configuration, the compiler skips a component it can't handle without reporting it. The only sign is the missing Memo ✨ badge in React DevTools. This is a safe default for production builds, and it is why the lint rules below matter.

### When It Can't See the Problem

Static analysis can't see other violations, and the compiler compiles them. These are the dangerous ones. Example `3-bailouts/` confirms two of them in a browser.

The first is impure rendering:

```tsx
// app/purity/PricesCheckedAt.tsx ("use client", excerpt)
// compiles, and the timestamp never changes again
const renderedAt = Date.now();
return <p>Prices checked at {formatTime(renderedAt)}</p>;
```

[[CODE 3-bailouts/app/purity/PricesCheckedAt.tsx]]

Without the compiler, this component shows a new time on every render, which is probably what its author intended. The compiler sees a value that depends on nothing reactive, computes it once, and caches it in a block that only runs on the first render. In the example, a button re-renders the component. Without the compiler, three readings a second apart showed three different times. With it, all three showed the time of the first render, while the button's own counter increased as expected. Nothing crashed, and the output was wrong. The fix is to treat time as an input from outside the component, either as state updated by an interval in an effect, or as a value passed in from the server.

Whether an impure call freezes depends on how the compiler groups it. In the Case Study's example, a product card computed `product.dealEndsAt - Date.now()`, and the compiler recomputed it every time the card ran, because the result depends on `product`. A banner that computed a countdown from a constant and `Date.now()` froze. We can't easily predict which case applies, so follow the rule instead of reasoning about the compiler's output.

> **Note (Next.js 16).** With Cache Components enabled, `next build` stops on a Client Component that calls `Date.now()`, `Math.random()`, or `crypto.randomUUID()` while its page is prerendered, and reports an unstable value in a Client Component. Next.js would otherwise bake that value into the static shell and serve it to every visitor. The suggested fixes are a `<Suspense>` boundary, or moving the read into an effect or event handler. The second fix also stops the compiler from freezing the value. The check covers only prerendered output, so a component that first renders after hydration passes it. The lint rule still catches that case.

The second is mutating a prop through a method call:

```tsx
// app/mutation/PriceList.tsx ("use client", excerpt)
// compiles; sorts the parent's array in place
items.sort((a, b) => a.price - b.price);
return (
  <ul>{items.map((i) => <li key={i.id}>{i.name}: ${i.price}</li>)}</ul>
);
```

[[CODE 3-bailouts/app/mutation/PriceList.tsx]]

`sort` changes the array it's called on, and that array belongs to the parent. In the example, the parent uses the same style. A basket adds an item with `items.push(...)` and then increments a counter to force a re-render, code that worked for years before the compiler. The compiler doesn't recognize either method call as a mutation, so it caches the parent's `<PriceList items={items} />` element on the array's identity, which never changes. After two items were added, the basket's count, cached on `items.length`, showed four items. The list below it, cached on `items`, still showed two. Neither the compiler nor the current lint rules flagged either method call. They did flag a direct assignment such as `user.name = "x"`. The fix is the one the rules have always required: copy before changing. Use `[...items].sort(...)` or `items.toSorted(...)`, and `[...items, item]` instead of `push`.

Both bugs come from the same place. The code broke the rules but appeared to work, because the component ran on every render. The compiler takes the rules at their word, and the code stops working. Enabling the compiler on an older codebase also tests how closely that codebase followed the rules.

### Let the Linter Enforce the Rules

The compiler's analysis is also available as lint rules. Most teams should use them in the editor, where they report a problem while the code is being written, rather than discovering a missing badge later.

```js
// eslint.config.mjs (excerpt)
import reactHooks from "eslint-plugin-react-hooks";

export default [
  reactHooks.configs.flat["recommended-latest"],
  // ...the rest of the project's config
];
```

[[CODE 3-bailouts/eslint.config.mjs]]

Besides `rules-of-hooks` and `exhaustive-deps`, the recommended preset now includes rules built on the compiler's analysis. These matter most for compiled code:

- **`purity`:** flags impure calls during render, such as `Date.now()` and `Math.random()`
- **`refs`:** flags reading or writing `ref.current` during render
- **`immutability`:** flags assignments to props, state, and other values that must not change
- **`static-components`:** flags components defined inside other components, which get a new identity and lose their state on every render
- **`set-state-in-effect`:** flags effects that set state synchronously, usually to keep a derived value in sync, which section 6 replaces with a calculation
- **`preserve-manual-memoization`:** flags manual memoization the compiler can't preserve
- **`incompatible-library`:** warns when code uses a library API known to conflict with memoization

[[CODE 3-bailouts/README.md]]

On example `3-bailouts/`, the preset reported the clock read (`purity`), the ref read during render (`refs`), the nested component (`static-components`), the synchronized state (`set-state-in-effect`), and the `useMemo` with a missing dependency (`exhaustive-deps`). It reported nothing for the two method-call mutations described in the previous subsection.

The rules work whether or not the compiler is on, so they are a good first step for a codebase that isn't ready for the compiler. Fix what they report before turning the compiler on.

> **Note (eslint-plugin-react-hooks 7).** The compiler's lint rules used to be in a separate `eslint-plugin-react-compiler` package. They are now part of `eslint-plugin-react-hooks`, and its recommended configs enable them. Projects that installed the separate plugin can remove it.

### Opting Out, and Opting In

Two directives control the compiler per component. `"use no memo"` as the first statement of a component or hook tells the compiler to leave it alone. Use it for a component that misbehaves after compilation while you find the rule it breaks, and add a comment that says why and when the directive will be removed. Otherwise the directive stays in the code long after anyone remembers the problem.

For a large existing codebase, the opposite approach is often safer. In annotation mode, the compiler compiles only components that opt in:

```ts
// next.config.ts (excerpt)
const nextConfig: NextConfig = {
  reactCompiler: { compilationMode: "annotation" },
};
```

```tsx
export default function FilterPanel(props: FilterPanelProps) {
  "use memo";
  // ...
}
```

[[CODE 3-bailouts/app/annotation/FilterPanel.tsx]]

A team can then enable the compiler one feature folder at a time, checking the Profiler and the lint output, and switch to the default mode once most components have opted in.

> **Tip.** The Babel plugin's `logger` option receives an event for every function the compiler compiles, skips, or fails on. Example `3-bailouts/` wraps it in an `npm run compile-report` script that lists each Client Component with its result. For that example it lists eight components: six compiled, and two skipped, `RenderCount` because it accesses a ref during render and `Matches` because its existing memoization couldn't be preserved. Run the report before switching a codebase from annotation mode to compiling everything.

## State Architecture

The compiler decides how much repeated work React skips. Where state lives decides how much work a change triggers. Each of section 2's reasons for a render starts with a state change, and the higher that state sits in the tree, the more components the change can reach. Memoization can stop a change at the first component whose output didn't change. It can't stop the change reaching every component that reads the changed value, every consumer of a context that carries it, or the extra commit an effect adds after it. This section is about reducing those.

The principles are old. The compiler makes them more important, because once memoization is automatic, state placement is the main performance decision left to us.

### Keep State Where It's Used

State belongs in the lowest component that needs it. A search box's text belongs in the search box, or in the smallest component that holds both the box and the list it filters. If a page-level component that also renders the header, the gallery, and the reviews holds that text, every keystroke runs the whole component.

Example `2-render-counts/` measured this, and the result was mixed. Moving the review draft from the top component into the composer cut a ten-keystroke review from 470 component renders to 50 without the compiler. With the compiler on, it made no difference, at 31 renders either way. The compiler had already reduced the high state to one extra function call per keystroke. So for a component that only sits above the components that use the state, placement matters much less than it did. The compiler can't help with state whose change reaches many readers: a context, a list whose items all depend on it, or an effect that copies it. The rest of this section covers those.

This is Chapter 3's leaf rule applied to state instead of to the `"use client"` directive. The reasons that kept client boundaries small also keep state low, and the two rules usually agree. A Leaf Client Component that owns its own state changes nothing outside itself.

When two siblings need the same state, it moves up to their nearest common parent, and no higher. When a component renders content it doesn't control, receiving that content as `children` keeps the state change away from it:

```tsx
// app/product/[id]/Disclosure.tsx ("use client", excerpt)
export function Disclosure({ title, children }: DisclosureProps) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button onClick={() => setOpen(!open)}>{title}</button>
      {open && children}
    </section>
  );
}
```

```tsx
// in the product page (Server Component)
<Disclosure title="Specifications">
  <SpecTable productId={product.id} />
</Disclosure>
```

[[CODE 4-state-architecture/app/product/[id]/Disclosure.tsx]]

`SpecTable` is a Server Component that the server renders and passes through. Toggling `open` runs `Disclosure`, and `children` is the same element it received before, so nothing inside it renders on the client. In `4-state-architecture/`, opening the disclosure ran one component function, `Disclosure`, with or without the compiler. Chapter 3 used this pattern to put Server Components inside Client Components, and it also keeps the cost of a state change to one small function.

### Derive, Don't Synchronize

State that copies other state is a common source of wasted renders:

```tsx
// before: two renders per change, and a frame of inconsistent UI
const [filtered, setFiltered] = useState<Product[]>([]);
useEffect(() => {
  setFiltered(products.filter((p) => p.price <= maxPrice));
}, [products, maxPrice]);
```

When `maxPrice` changes, the component renders with the old `filtered`, commits, runs the effect, sets state, and renders again. That's two renders instead of one, and for one commit the screen shows a price limit and a list that disagree. The `set-state-in-effect` lint rule flags this pattern.

[[CODE 4-state-architecture/app/derive/effect/ProductGrid.tsx]]

```tsx
// after: one render, always consistent
const filtered = products.filter((p) => p.price <= maxPrice);
```

[[CODE 4-state-architecture/app/derive/calculated/ProductGrid.tsx]]

Calculate during render anything that can be calculated from props and state. Before the compiler, the objection was cost, since the filter ran on every render. The compiler caches the calculation on `products` and `maxPrice` and runs it again only when one of them changes, so the readable version is now also the fast one.

Over five steps of a price slider on 24 products, the effect version took 10 commits and 260 component renders without the compiler, and the calculated version took 5 commits and 130 renders. With the compiler, the effect version dropped to 135 renders, but still took 10 commits. The compiler made the second render cheap. It couldn't remove the second commit, or the frame in which the slider and the list disagree.

### Server Data Stays on the Server

Chapter 4 put data fetching in Server Components, and that decision helps here too. Data from the server, such as products, reviews, and prices, doesn't belong in a client-side store. A copy in the browser is a second source of truth to keep in sync, and every sync is a render.

For most of what a catalogue needs, two places hold state better than a client store.

- **The URL:** filter and sort choices, the selected tab, the current page of results. They survive a reload, can be shared as a link, and reach Server Components through `searchParams`, so the server can render the filtered list. Updating them in a transition keeps the current UI responsive while the new result streams in
- **The server's cache:** after a mutation, Chapter 5's `updateTag` sends back fresh server-rendered data. The client never held a copy, so it has nothing to merge

The state left for the client is what only the client knows: what's open, what's being typed, what's being dragged, and what's optimistic. That list is short, and it fits in the Leaf Client Components that need it.

### Split Context by How Often It Changes

Context reaches across the tree by design, so what goes into a context's value is a performance decision. One provider that holds everything a feature needs is convenient, and every change to any part of it reaches every consumer:

```tsx
// before: one context, every consumer renders on every change
const value = { items, addItem, removeItem, isOpen, setOpen };
<CartContext value={value}>{children}</CartContext>
```

Section 4 showed that the compiler reduces this cost by caching each consumer's output on the parts it reads. Each consumer still runs, though, and a header badge that shows a count shouldn't run when the cart drawer opens. The structural fix is to split the context by how often each part changes, and to separate actions, which never change, from data, which does:

```tsx
// after: three providers, each consumer subscribes to what it reads
<CartActionsContext value={actions}>
  <CartItemsContext value={items}>
    <CartDrawerContext value={isOpen}>{children}</CartDrawerContext>
  </CartItemsContext>
</CartActionsContext>
```

[[CODE 4-state-architecture/app/cart/split/cart.tsx]]

A button that only adds items reads `CartActionsContext`, whose value never changes, so the cart never re-renders it. The count badge reads `CartItemsContext`. The drawer reads the items and the open state, and the toggle reads the open state and the actions.

Example `4-state-architecture/` has a header badge, a drawer toggle, the drawer, and 24 Add to cart buttons inside server-rendered product cards. With one context, opening the drawer ran 28 component functions, with the compiler on or off. With the split contexts and the compiler on, it ran 3: the provider, the toggle, and the drawer. Adding an item also ran 3.

Without the compiler, the split version still ran 27. The provider's body creates the `actions` object, so without memoization it is a new object on every provider render, and all 24 buttons read it. The compiler creates it once, because it only uses state setters, which React keeps stable. A split context also needs stable values. With the compiler, they come automatically. Without it, the actions need a `useMemo` or a `useState` initializer.

> **Note (React 19).** `<CartContext value={...}>` renders a context provider directly. React 19 made the context object itself usable as a provider. `<CartContext.Provider>` still works, and the React team plans to deprecate it.

## Render Efficiency

Sections 3 to 6 reduce how many components run. Some work remains after that, such as a list that does change, or an expensive result the reader asked for. This section covers making that work cheaper, or making it wait.

### Keys

React matches list items between renders by their `key`. A stable key from the data, such as a product ID or a review ID, lets React reuse each item's DOM and component state when the list is filtered, sorted, or extended at the top. Two common choices break this.

- **The array index:** stable only while the list never changes order. A new review inserted at the top shifts every index by one, so React updates every item's content, and state inside an item, such as an expanded "read more", moves to the wrong review
- **A value generated during render:** `key={crypto.randomUUID()}` or `key={Math.random()}` gives every item a new identity on every render. React unmounts and remounts the whole list each time, the most expensive thing it can do with a list, and the call breaks the purity rule from section 5

Chapter 5's optimistic entries generated their key once, when the entry was created, and stored it. Create a key with the item, not during render.

### Long Lists

A catalogue page with 5,000 products can't render all of them cheaply, because React isn't the only cost. Five thousand rows need five thousand sets of DOM nodes that the browser creates, styles, and lays out, whatever React skips. Two approaches keep the DOM small.

- **Paginate on the server:** the URL holds the page number, a Server Component renders 24 products, and the client doesn't change. This is usually the right answer for a catalogue, and Chapter 4's caching was designed for it
- **Virtualize on the client:** when the design calls for one scrolling list, a virtualization library renders only the rows in and near the viewport and swaps them as the reader scrolls. It suits long, uniform lists held on the client, such as an order history or a log viewer, and adds some complexity in exchange for a constant DOM size

Memoization can't replace either one. A compiled list of 5,000 items still mounts 5,000 items the first time, and section 4's Tip applies, because memoization never speeds up the first render.

### Transitions: Keeping Input Responsive

Some updates are urgent and some can wait. A keystroke in a search box is urgent, because the reader is watching for the character. Recomputing and redrawing several thousand results for that keystroke can wait a few frames, and React can abandon it if another keystroke arrives first.

`useDeferredValue` tells React this. It gives a component a copy of a value that lags behind while React is busy:

```tsx
// app/search/deferred/Search.tsx ("use client", excerpt)
const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);
const isStale = query !== deferredQuery;

<input value={query} onChange={(e) => setQuery(e.target.value)} />
<div style={{ opacity: isStale ? 0.6 : 1 }}>
  <Results query={deferredQuery} />
</div>
```

[[CODE 5-render-efficiency/app/search/deferred/Search.tsx]]

Each keystroke updates `query` immediately, so React updates the input right away. `Results` receives `deferredQuery`, which React updates in a background render that it interrupts and restarts if `query` changes again. Until it finishes, the old results stay on screen, faded.

The deferral only helps if `Results` skips rendering when it receives the same `deferredQuery` during the urgent render. Before the compiler, that required wrapping `Results` in `React.memo`. With the compiler, the cached element does it.

Example `5-render-efficiency/` measures this on a search over 5,000 products, with the CPU throttled four times. It takes the worst keystroke from the browser's Event Timing API, which provides the data for Interaction to Next Paint. Table 6.1 shows the results.

| Version | Compiler off | Compiler on |
|---|---|---|
| Every match rendered on every keystroke | 368 ms | 304 ms |
| `useDeferredValue` | 256 ms | 168 ms |
| `useDeferredValue`, at most 48 results shown | 40 ms | 24 ms |

Deferral helps much more with the compiler on. Without it, each urgent render runs `Results` with the old query anyway. Even with both, the worst keystroke took 168 ms, because the first few keystrokes commit thousands of DOM changes, and React can interrupt a render but not a commit. The largest improvement came from showing fewer results, as the previous subsection recommends. Deferral changes when work happens, not how much work there is.

`useTransition` applies the same idea to updates we start ourselves. Chapter 5 used it to mark a Server Action call as non-urgent. It works the same way for a tab switch or a sort change that is expensive to render. Wrap the state update in `startTransition`, and React keeps the current screen interactive while it prepares the next one.

### Hidden UI That Keeps Its State

Tabs, drawers, and wizard steps all face the same choice. Unmounting a hidden panel loses its state, such as a half-filled form or a scroll position, and mounting it again costs a full first render. Hiding it with CSS keeps everything, including its effects and subscriptions, running in the background.

```tsx
// app/tabs/activity/ProductTabs.tsx ("use client", excerpt)
<Activity mode={tab === "reviews" ? "visible" : "hidden"}>
  <ReviewsPanel productId={productId} />
</Activity>
<Activity mode={tab === "qa" ? "visible" : "hidden"}>
  <QuestionsPanel productId={productId} />
</Activity>
```

[[CODE 5-render-efficiency/app/tabs/activity/ProductTabs.tsx]]

`<Activity>` is a third option. A hidden subtree stays mounted with its state, while React hides its DOM, cleans up its effects, and renders updates to it at the lowest priority, after everything visible. Switching back is instant and keeps all state. React can also render a hidden panel ahead of time, so a tab the reader is likely to open next is ready before the click. In the example, a question typed into the Questions tab disappeared after switching to Reviews and back when the panels were rendered conditionally, and stayed with `<Activity>`.

> **Note (React 19.2).** `<Activity>` became stable in React 19.2, after a long period as an experimental API named Offscreen. With Cache Components enabled, Next.js 16 also uses it for client-side navigation. Instead of unmounting the page being left, it hides it in an `<Activity>`, so going back restores its state, including form drafts and scroll position.

## Avoiding Performance Traps

The compiler removes a whole category of performance work, which makes it easy to assume it handles the remaining problems too. Each problem below remains in a fully compiled build.

### Traps the Compiler Makes Worse

Two traps get worse with the compiler on, because they turn careless code into wrong code. Section 5 covered both. Check for them first in any review.

- **Impure rendering:** a clock read, a random number, or a read from a mutable global during render can be computed once and frozen in the cache. The `purity` lint rule catches the common calls. Nothing catches a read from a module-level variable that other code changes
- **Mutation through method calls:** `sort`, `reverse`, `splice`, `push`, and `Object.assign` on props or state change a value the compiler treats as unchanged. Copy first, or use the non-mutating forms `toSorted`, `toReversed`, `toSpliced`, and spread syntax

### Traps the Compiler Can't Reach

These are architectural, and memoization doesn't address them.

- **State too high:** a value that changes on every keystroke, held in a layout or a page-level Client Component, sends every keystroke through the whole component tree below it. Section 6 moves it down
- **One context for everything:** every consumer runs on every change, however well each one is memoized inside. Split the context by how often each part changes
- **Synchronizing state in effects:** each one costs a second commit and a frame of inconsistent UI. Derive the value instead
- **Fetching in client effects:** a Client Component that fetches its data in `useEffect` renders at least twice, once empty and once with data, and starts its request only after its JavaScript has loaded and run. Chapter 4's answer still holds: fetch in a Server Component and stream the result, or pass a promise down and read it with `use`
- **Unstable keys:** index keys on lists that change order, and random keys anywhere. Section 7 covers both
- **Unbounded DOM:** thousands of rows rendered at once. Paginate or virtualize

### Traps in the Bundle

Rendering is only part of the client's cost. The browser downloads, parses, and runs every byte of JavaScript before a Client Component can respond, and hydration runs each Client Component once on load to attach its event handlers. The compiler doesn't reduce that cost. Its output is slightly larger than its input, because the cache checks are code too.

- **A `"use client"` directive placed too high:** everything that file imports becomes client code. Chapter 3's leaf rule limits bundle size as much as it limits rendering
- **Heavy libraries in the first load:** a rich-text editor, a charting library, or a date picker that only appears after a click can load at that point with `next/dynamic` or a dynamic `import()`, rather than with the page
- **Server-only work done on the client:** formatting, sorting, or Markdown parsing of data from the server can usually happen in the Server Component that fetched it, so neither the code nor the work reaches the browser

> **Tip.** `next analyze`, available since Next.js 16.1, opens an interactive view of Turbopack's module graph. It filters by route and by environment, client or server, and traces imports to show why a module is in a bundle. Check a route's client modules after adding a dependency or moving a `"use client"` directive, to catch a boundary that moved one level too high before it ships.

## An Optimization Workflow

Each section of this chapter has added a tool or a rule. Chapter 3 ended with a checklist for where code runs, Chapter 4 with one for when data arrives, and Chapter 5 with six steps that every action follows. This chapter ends with a workflow of five steps, in order, for any part of an application that feels slow. As in Chapter 5, the order matters most. Each step is cheaper than the next, and often makes the later steps unnecessary.

1. **Measure.** Reproduce the slowness on a production build with a throttled CPU, and record the interaction, its Interaction to Next Paint or commit duration, and the Profiler's flame graph. As section 2 explained, a number we can compare before and after is the only evidence that a change helped. A component that renders often but costs little is not a problem.
2. **Locate.** Find out what kind of slowness it is before deciding how to fix it. Performance Tracks separate React's render work from layout, paint, network, and other scripts. If the time goes to the network or to a chain of requests, the fix is in Chapter 4. If it goes to downloading and hydrating JavaScript, see section 8's bundle traps. If it goes to React rendering, the Profiler shows which state change started it.
3. **Move.** Fix the structure that produced the work, using sections 6 and 7. Move state down to where it's used. Derive values instead of synchronizing them. Put server data back on the server and filter choices in the URL. Split contexts by how often each part changes. Give lists stable keys and a limited size. Mark slow, non-urgent updates as transitions. These changes reduce how much work exists, with or without the compiler.
4. **Memoize.** Let the compiler handle what repeats, as sections 3 to 5 describe. Turn it on, check for the badge on the components that matter, and read the compile report for anything skipped. Fix the rule violation that caused a skip instead of adding `useMemo`. Add manual memoization only in the cases section 4 lists, and only when a measurement shows the compiler didn't already do the job.
5. **Guard.** Keep the fix in place. Run the compiler-based lint rules in the editor and in CI, so that impure renders, ref reads, and memoization the compiler can't preserve are caught when they're written. Keep the measurement from step 1, and run it again when the feature changes.

[[FIGURE 6.3]]

Steps 3 and 4 are the core of the workflow, and their order gives this chapter's pattern its name: **structure first, memoize last.** It joins Chapter 3's server shell, client islands, Chapter 4's one page, many clocks, and Chapter 5's every action is a front door. Memoization comes last because it is now automatic, and because it can only save the work that the structure leaves. Caching makes a state change that reaches 200 components cheaper. A state change that reaches four components needs no caching. Since the compiler made memoization free to write, it's tempting to treat it as the whole answer. It is the cheapest step, and it still comes last.

The four patterns answer four questions about the same product page. Chapter 3 asked where each piece of code runs, and put most of it on the server. Chapter 4 asked when each piece of data arrives and how long it stays valid. Chapter 5 asked what must be true before data changes. This chapter asks how much client work each change causes, and the first three answers make this one smaller. A page that runs most of its code on the server, fetches its data there, and keeps its mutations in actions leaves little client work to optimize.

> **Tip.** Record the step 1 measurement before changing anything, in the pull request description or the feature's README. The `2-render-counts/` and `6-case-study-explorer/` examples record theirs in a table, as Chapter 5's examples did. Without a before-and-after number, a performance change is a guess.

## Case Study: Untangling the Product Explorer

### Before

Over a few months, the catalogue gained a product explorer with a search box, a price limit, a sort menu, a compare tray, a sale countdown, and a cart badge in the header. Different developers added each feature for good reasons, and each one worked. The page is now slow to type into on a mid-range phone, and nobody can name the commit that made it slow.

```tsx
// app/catalogue/page.tsx (before, excerpt)
"use client";

export default function CataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(300);
  const [filtered, setFiltered] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  useEffect(() => {
    setFiltered(products.filter((p) => matches(p, query, maxPrice)));
  }, [products, query, maxPrice]);

  // ...compare state, cart state, one ShopContext provider around
  // it all, and every match rendered as
  // <ProductCard key={i} product={p} />
}
```

[[CODE 6-case-study-explorer/app/before/catalogue/page.tsx]]

```tsx
// app/catalogue/ProductCard.tsx (before, excerpt)
const { compare, toggleCompare, addToCart } = useContext(ShopContext)!;
```

[[CODE 6-case-study-explorer/app/before/catalogue/ProductCard.tsx]]

```tsx
// app/catalogue/SaleBanner.tsx (before, excerpt)
const msLeft = SALE_ENDS_AT - Date.now();
return <p className="deal">Sale: {formatCountdown(msLeft)}</p>;
```

[[CODE 6-case-study-explorer/app/before/catalogue/SaleBanner.tsx]]

These excerpts and a short description of the rest show most of the problems. The whole page is a Client Component, so the server renders none of it and every product card ships as client code. An effect fetches all 5,000 products, about 380 KB of JSON, after the JavaScript loads, from a Route Handler that exists only for this page. A second effect keeps the filtered list in sync, which costs a second commit per keystroke. One `ShopContext` holds the products, the compare set, the cart, and every setter, so ticking one compare box runs every card. Every match renders at once, nearly 5,000 cards at the default price limit, with index keys. A sort helper sorts the `products` array in place. The sale banner reads `Date.now()` during render, and its countdown only appears to tick because the page re-renders on almost every interaction. A teammate tried turning on the compiler, the countdown stopped updating, and the team reverted the change.

### Task

Rework the explorer so that:

1. Typing in the search box stays responsive on a throttled CPU, with no visible lag between keystroke and character.
2. Filter and sort choices survive a reload and can be shared as a link.
3. Adding a product to the compare tray or the cart doesn't re-render the product grid.
4. The page renders no more than one page of products at a time.
5. The compiler can be turned on, with no component skipped and no change in behavior.

Before reading on, sketch your own version using section 9's five steps. Measure first, and write down what you expect each structural change to remove before you turn on the compiler.

### Sample After

```tsx
// app/catalogue/page.tsx (after, Server Component, excerpt)
async function Catalogue({ searchParams }: PageProps) {
  const filters = parseFilters(await searchParams);
  const { products, total, pageCount } = await getProductPage(filters);

  return (
    <>
      <FilterBar initial={filters} />
      <p>{total} products</p>
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p}>
            <CompareToggle productId={p.id} />
            <AddToCart productId={p.id} />
          </ProductCard>
        ))}
      </div>
      <Pagination filters={filters} pageCount={pageCount} />
    </>
  );
}
```

[[CODE 6-case-study-explorer/app/after/catalogue/page.tsx]]

```tsx
// app/catalogue/FilterBar.tsx (after, "use client", excerpt)
const [query, setQuery] = useState(initial.q);
const [isPending, startTransition] = useTransition();

function commit(next: Partial<Filters>) {
  startTransition(() => {
    router.replace(toSearch({ ...initial, ...next }));
  });
}
```

[[CODE 6-case-study-explorer/app/after/catalogue/FilterBar.tsx]]

The page renders the header, the sale countdown, the cart badge, and the compare tray, and puts `Catalogue` inside a `<Suspense>` boundary, because reading `searchParams` makes it request-time work under Cache Components. `parseFilters` is a Shared function that validates the search parameters with a Zod schema, following Chapter 5's section 4 in treating the URL as input. `getProductPage` is a data access layer function in Chapter 4's style, marked `"use cache"` and tagged. It filters, sorts, and pages the catalogue, and returns 24 products, the match count, and a page count.

Each change has a reason. The page is a Server Component again, so the server renders the product grid and every card, and the browser receives no code for them. Filters live in the URL, so the server renders the filtered page, a reload keeps the filters, and the API route used only by this page is gone, along with the 380 KB the browser downloaded after loading. The `matches` function runs on the server, inside `getProductPage`, instead of over 5,000 objects in the browser.

`FilterBar` is the only Client Component that changes on every keystroke. It holds the search text as local state, so typing re-renders only `FilterBar`. After a 300 ms pause, it writes the text to the URL in a transition, so the input stays responsive while the server renders the next page of results, and `isPending` shows a small updating indicator meanwhile. The Zod schema stays out of the browser, because `FilterBar` builds URLs with a helper that has no dependencies and only the server parses them. `CompareToggle` and `AddToCart` are Leaf Client Components that each server-rendered card receives as `children`, the composition pattern from section 6. `AddToCart` reads only the `CartActions` context, whose value never changes. `CompareToggle` needs to know whether its own product is selected. It reads a small compare store through React's `useSyncExternalStore` with a selector, `useCompare((ids) => ids.includes(productId))`, so it re-renders only when that one answer changes. Toggling a comparison re-renders the tray and the one toggle whose answer changed, and no other toggles, cards, or grid. The cart badge in the header reads only `CartItems`.

The sale countdown moved into a small `SaleCountdown` Client Component that keeps the current time in state and updates it with an interval in an effect. The time is now an input that changes on purpose, rather than a value read during render, so the compiler can't freeze it. The in-place sort became `toSorted`, inside `getProductPage` on the server. Keys are product IDs. After these changes, the lint rules report nothing, the compile report lists no skipped components, and the compiler is on.

Table 6.2 shows what changed, measured on production builds of this chapter's `6-case-study-explorer/` example. Typing and keystroke timings use the ten characters `trail sock`, and the keystroke timing uses a CPU throttled four times. The before version is measured as it shipped, without the compiler, and the after version with it:

| Measurement | Before | After |
|---|---|---|
| Component renders while typing ten characters | 18,049 | 19 |
| Worst keystroke-to-paint delay | 800 ms | 24 ms |
| Components re-rendered by one compare toggle | 4,935 | 2 |
| DOM elements after load | 29,641 | 190 |
| Catalogue data fetched by the browser | 380 KB | none |
| Client JavaScript for the route, compressed | 179 KB | 184 KB |
| Lint errors / components the compiler skipped | 2 / 0 | 0 / 0 |

Client JavaScript barely changed. The before version was slow because of its data and its rendering work, not its code size.

The example also measures the two combinations the table leaves out, and they show which step did what. Turning on the compiler alone, on the before version, cut the renders while typing from 18,049 to 6,558, but the worst keystroke only from 800 ms to 728 ms, because the remaining cost was the DOM for nearly 5,000 cards. A compare toggle still ran every card, because every card read the one context, and the sale countdown froze. The after version measured the same without the compiler as with it: 19 renders, 24 ms, and 2 renders per toggle. Once the structure was right, the compiler had almost nothing left to save on this page. The before version needed a different structure, not more memoization.

## Conclusion

This chapter started from a tension as old as React: code written to be read and code written to be fast used to look different. Readable code had plain functions with inline handlers and values computed where they're used. Fast code wrapped every value, stabilized every handler, and made every child compare its props. The React Compiler removes most of that trade by doing the wrapping at build time, at a finer grain and more consistently than we would by hand. The compiler was never the whole answer, though. Architecture decides how much work exists, and the compiler decides how much of it repeats.

Section 2 separated the render phase from the commit phase and named the three reasons a component renders. Section 3 read the compiler's output, a cache per component instance guarded by comparisons, and confirmed that Next.js applies it only to the client bundle, where the earlier chapters left client code. Section 4 showed cached elements replacing `React.memo`, and listed the cases where manual memoization is still useful. Section 5 treated the Rules of React as the compiler's contract: code that breaks them either loses the optimization or changes behavior, and the lint rules enforce them. Sections 6 and 7 moved state down, derived values instead of synchronizing them, split contexts, limited list sizes, and deferred slow updates. Section 8 listed the problems that remain in a compiled build, and section 9 ordered everything into a workflow under the pattern name structure first, memoize last.

The chapter also completes the product page this book has been building. Chapter 3 decided where its code runs, Chapter 4 when its data arrives, Chapter 5 what must be true before that data changes, and this chapter how much client work each change causes. Each decision made the next one easier. The compiler optimizes small Client Components easily, a page that fetches on the server has few effects to untangle, and a page whose mutations live in actions has no client store to keep in sync.

Every number in this chapter came from a production build on a throttled CPU in a controlled run. Readers use the application on their own phones and networks, and they find bugs nobody reproduced locally. Chapter 7, Performance Auditing and Observability, moves measurement from the lab to real use. It covers the Core Web Vitals and related timings, including TTFB, FCP, LCP, and INP, how to profile and analyze hydration on real devices, and how monitoring, distributed tracing, and error analysis show what readers experience once the application is live, and why.
