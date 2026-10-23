import { z } from "zod";

// Shared: the URL is input, so it's validated like a form (Chapter 5).
const filtersSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  max: z.coerce.number().int().min(0).max(1000).catch(300),
  sort: z.enum(["relevance", "price"]).catch("relevance"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type Filters = z.infer<typeof filtersSchema>;
export { toSearch } from "./search-params";

export function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return filtersSchema.parse({
    q: one(params.q) ?? "",
    max: one(params.max) ?? 300,
    sort: one(params.sort) ?? "relevance",
    page: one(params.page) ?? 1,
  });
}
