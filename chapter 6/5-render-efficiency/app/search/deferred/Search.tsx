"use client";

import { useDeferredValue, useState } from "react";
import { Results } from "../Results";

// The input updates immediately. The results follow in a background
// render that React interrupts if another keystroke arrives.
export function Search() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <Results query={deferredQuery} />
      </div>
    </>
  );
}
