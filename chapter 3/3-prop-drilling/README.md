# 3 — Sign 2: the long, unused prop list

This one illustrates the second sign from "Signs a Boundary Is in the
Wrong Place": a component that needs a long prop list whose only job is
threading data past itself to a child further down.

## Run it yourself

```bash
npm install
npm run dev
```

Then open <http://localhost:3000> and follow the links to `/before` and
`/after`. Both render the same profile card with the same data. The
difference is only visible in the source:

- `app/before/ProfileHeader.tsx` takes a single `user` prop (five
  fields) and only ever reads two of them itself (`title`, `joinedAt`).
  The other three (`name`, `avatarUrl`, `email`) pass straight through,
  untouched, purely so `ProfileAvatarMenu` two levels down can read
  them.
- `app/after/ProfileHeader.tsx` takes exactly `title`, `joinedAt`, and
  `children`. It has no idea `name`, `avatarUrl`, or `email` exist.
  `page.tsx` builds `<ProfileAvatarMenu>` itself and hands it to
  `ProfileHeader` as an already-rendered `children` element, so the
  data those three fields carry never has to pass through
  `ProfileHeader`'s props at all.

## Why the boundary is the actual cause here

In `/before`, `app/before/ProfileCard.tsx` is the one file marked
`"use client"`, and per the "a boundary cannot be undone below itself"
rule earlier in this chapter, that pulls `ProfileHeader` and
`ProfileAvatarMenu` into the same client subtree even though neither
file declares its own directive. Once inside that subtree, none of the
three components can independently reach back to the data source
(`getUser()`, a Server Component can `await` it, a Client Component
cannot), so the only way for `ProfileAvatarMenu` to get `name`,
`avatarUrl`, and `email` is for something above it to have already
received them and passed them down, whether or not that something
actually uses them.

In `/after`, only `app/after/ProfileAvatarMenu.tsx` is `"use client"`.
`ProfileCard` and `ProfileHeader` stay Server Components, so
`app/after/page.tsx` (also a Server Component, with `user` already in
scope from its own `await getUser()`) can build
`<ProfileAvatarMenu name={...} avatarUrl={...} email={...} />` directly
and pass it down through `ProfileHeader`'s `children` prop. `children`
is a normal prop like any other, but it carries an already-built
element rather than raw data, so `ProfileHeader` never has to know
what's inside it.

The `children`-slot technique used in `/after/page.tsx` gets a full
treatment later in this chapter, under Composition Patterns. This
example only needs the minimum slice of it to make the prop list
problem go away.

## What to compare

Open `app/before/ProfileHeader.tsx` and `app/after/ProfileHeader.tsx`
side by side. Same component, same job, same rendered output:

| | `/before` | `/after` |
|---|---|---|
| `ProfileHeader` props | `user` (5 fields, 3 unused by this file) | `title`, `joinedAt`, `children` (0 unused fields) |
| Does `ProfileHeader` know `name`/`avatarUrl`/`email` exist? | Yes, has to accept and forward them | No |
| Where is `"use client"`? | `ProfileCard.tsx` (too high) | `ProfileAvatarMenu.tsx` (the leaf) |
