import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { allProducts, matches } from "./catalog";
import type { Filters } from "./filters";

const PAGE_SIZE = 24;

// Data access layer in Chapter 4's style: filtering, sorting, and paging
// happen here, on the server, and the result is cached per filter set.
export async function getProductPage(filters: Filters) {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const found = allProducts.filter((p) => matches(p, filters.q, filters.max));
  const sorted = filters.sort === "price" ? found.toSorted((a, b) => a.price - b.price) : found;
  const start = (filters.page - 1) * PAGE_SIZE;

  return {
    products: sorted.slice(start, start + PAGE_SIZE),
    total: found.length,
    pageCount: Math.max(1, Math.ceil(found.length / PAGE_SIZE)),
  };
}
