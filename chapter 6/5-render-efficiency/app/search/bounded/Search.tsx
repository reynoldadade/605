"use client";

import { useDeferredValue, useState } from "react";
import { Results } from "../Results";

// Deferred and bounded: at most 48 results in the DOM at once.
export function Search() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <Results query={deferredQuery} limit={48} />
      </div>
    </>
  );
}
