"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Filters } from "@/lib/filters";
import { toSearch } from "@/lib/search-params";

// The only island that changes on every keystroke. The text is local
// state; the URL is updated in a transition after a short pause.
export function FilterBar({ initial }: { initial: Filters }) {
  const router = useRouter();
  const [query, setQuery] = useState(initial.q);
  const [isPending, startTransition] = useTransition();

  function commit(next: Partial<Filters>) {
    startTransition(() => {
      router.replace(toSearch({ ...initial, page: 1, ...next }), { scroll: false });
    });
  }

  useEffect(() => {
    if (query === initial.q) return;
    const id = setTimeout(() => commit({ q: query }), 300);
    return () => clearTimeout(id);
  });

  return (
    <div className="filters">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      <label>
        Max price
        <select value={initial.max} onChange={(e) => commit({ max: Number(e.target.value) })}>
          {[50, 100, 200, 300].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <select value={initial.sort} onChange={(e) => commit({ sort: e.target.value as Filters["sort"] })}>
        <option value="relevance">Relevance</option>
        <option value="price">Price</option>
      </select>
      {isPending && <span aria-live="polite">Updating...</span>}
    </div>
  );
}
