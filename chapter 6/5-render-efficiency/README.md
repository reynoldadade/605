# 5: Render Efficiency

Section 7's tools, measured.

- `/search/plain`, `/search/deferred`, `/search/bounded`: a search box
  over 5,000 products filtered in the browser. Plain renders every match
  on every keystroke. Deferred passes `useDeferredValue(query)` to the
  results. Bounded is deferred and shows at most 48 results.
- `/tabs/conditional`, `/tabs/activity`: two tabs, one holding a
  textarea, hidden by unmounting versus with `<Activity>`.
- `/stock/dependency`, `/stock/effect-event`: a stock subscription whose
  handler reads a `muted` preference, as an effect dependency versus
  through `useEffectEvent`. The chapter's subsection on this was cut for
  length; the pages stay as a worked example of `useEffectEvent`.

## Run it yourself

```bash
npm install
npx playwright install chromium   # once, for npm run measure
npm run build && npm start        # with the compiler, http://localhost:3000
npm run build:no-compiler         # same app without it, into .next-no-compiler
npm run measure                   # builds both, runs the checks, writes measurements.json
```

Requires Node.js 20 or later. `npm run measure -- --no-build` reuses existing
builds. Set `CHROMIUM_PATH` to use an already-installed Chromium instead of
the one Playwright downloads.

## What we measured

Next.js 16.4.2 (Turbopack), React 19.3.1, React Compiler (`babel-plugin-react-compiler`) 1.0.0, production builds made with `next build --no-mangling`, headless Chromium 141 driven by Playwright, on a 2-core cloud Linux container. Measured 2026-10-23.

**Search.** Typing `trail sock` with 150 ms between keystrokes on a CPU
throttled 4x through the DevTools protocol. Each cell is the worst
keystroke's duration from the Event Timing API (input to next paint, the
measurement behind INP), median of three runs.

| Route | Compiler off | Compiler on |
|---|---|---|
| `/search/plain` | 368 ms | 304 ms |
| `/search/deferred` | 256 ms | 168 ms |
| `/search/bounded` | 40 ms | 24 ms |

Individual runs are in `measurements.json`. Deferral helps much more with
the compiler on. Without it, the urgent render for each keystroke re-runs
`Results` with the old query anyway, since `Search` re-renders and
creates a new `<Results>` element; with the compiler, that element is
cached and skipped. Even then, the first keystrokes commit thousands of
DOM changes, and a commit can't be interrupted. Bounding the list is what
brings every keystroke well under the 200 ms INP threshold.

**Tabs.** Type into the Questions tab, switch to Reviews and back:
`/tabs/conditional` returned an empty textarea, `/tabs/activity` kept
"Does it run small?". Same with the compiler on or off.

**Stock watcher.** Subscriptions opened after loading the page and
toggling Mute three times: 4 with `muted` as a dependency, 1 with
`useEffectEvent`. Same with the compiler on or off.
