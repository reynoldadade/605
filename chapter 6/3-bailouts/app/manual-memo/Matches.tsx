"use client";

import { useMemo } from "react";

// q is read but not listed, so the compiler can't preserve this memo
// without also preserving the stale-result bug. It skips the component.
export function Matches({ items, q }: { items: string[]; q: string }) {
  const matches = useMemo(() => items.filter((i) => i.includes(q)), [items]);
  return <p>{matches.length} matches</p>;
}
