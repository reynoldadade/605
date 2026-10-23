import Link from "next/link";
import type { Filters } from "@/lib/filters";
import { toSearch } from "@/lib/search-params";

export function Pagination({ filters, pageCount }: { filters: Filters; pageCount: number }) {
  return (
    <nav className="pages">
      {filters.page > 1 && <Link href={toSearch({ ...filters, page: filters.page - 1 })}>Previous</Link>}
      <span>Page {filters.page} of {pageCount}</span>
      {filters.page < pageCount && <Link href={toSearch({ ...filters, page: filters.page + 1 })}>Next</Link>}
    </nav>
  );
}
