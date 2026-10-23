import type { Filters } from "./filters";

// Shared and dependency-free, so Client Components can build URLs without
// pulling the Zod schema (and Zod itself) into the browser bundle.
export function toSearch(f: Filters) {
  const s = new URLSearchParams();
  if (f.q) s.set("q", f.q);
  if (f.max !== 300) s.set("max", String(f.max));
  if (f.sort !== "relevance") s.set("sort", f.sort);
  if (f.page > 1) s.set("page", String(f.page));
  const str = s.toString();
  return str ? `?${str}` : "?";
}
