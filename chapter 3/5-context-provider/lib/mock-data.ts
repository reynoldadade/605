// lib/mock-data.ts
//
// Stand-in for a real database call, same pattern as the other
// examples' mock-data.ts. The point of this file is that it runs
// whether or not ThemeProvider exists at all — nothing about wrapping
// the page in a Context Provider changes what this function is or how
// it's called.

export type Post = { id: string; title: string };

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getPosts(): Promise<Post[]> {
  return delay([
    { id: "p1", title: "Why we moved our data layer to the edge" },
    { id: "p2", title: "A postmortem on our Tuesday deploy" },
    { id: "p3", title: "Notes from three months of dogfooding" },
  ]);
}
