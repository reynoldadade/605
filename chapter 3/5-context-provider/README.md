# 5 — Wrapping Server Content in a Client Provider

This one illustrates the Context Provider case from "Wrapping Server
Content in a Client Provider": a Context Provider must be a Client
Component (`createContext`/`useContext` need the client runtime), but
the content it wraps, including a whole page doing real server-only
data fetching, can stay Server.

## Run it yourself

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. View the page source (not just the
rendered DOM): the three post titles are already there, fetched with a
real `await getPosts()` call (see `lib/mock-data.ts`, artificial 300ms
delay), even though the entire page is wrapped in `ThemeProvider`, a
Client Component, via `app/layout.tsx`. Click "Switch to dark" and only
the background color and button label change; nothing re-fetches.

To see the bundle side of it:

```bash
npm run build
```

The `/` route is 470 B of route-specific code, which is
`ThemeProvider.tsx` plus `ThemeToggleButton.tsx` combined, not the
whole page.

## What to look at

- `app/ThemeProvider.tsx`: the only file that must be `"use client"`,
  because it calls `createContext`/`useContext`. Small: one piece of
  state (`theme`) and a toggle function.
- `app/layout.tsx`: a Server Component, no directive. `{children}` here
  is the entire routed page tree at runtime, handed to `ThemeProvider`
  without `layout.tsx` ever inspecting or importing what's inside it.
- `app/page.tsx`: a Server Component, no directive, doing a genuine
  `await getPosts()` fetch, despite `ThemeProvider` sitting above it in
  the render tree.
- `app/ThemeToggleButton.tsx`: the one file that actually reads the
  theme via `useTheme()`, so the one file (besides the Provider itself)
  that needs its own `"use client"`. That is the ordinary Leaf Client
  Component pattern applying again, not a side effect of the Provider.

## The point being made

Wrapping the root layout in a Context Provider does not mean the app
becomes client-rendered. It means one small file, the Provider itself,
is client-rendered. Everything passed to it as `children`, and
everything that never explicitly reaches for `useContext`, stays
wherever it already was, exactly as `app/page.tsx`'s real data fetch
demonstrates.
