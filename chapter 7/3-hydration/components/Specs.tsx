"use client";

import { useState } from "react";

// More of the island, so a client re-render has real work to do.
export function Specs() {
  const [open, setOpen] = useState<number | null>(null);
  const rows = Array.from({ length: 60 }, (_, i) => ({
    k: `Feature ${i + 1}`,
    v: `Three-layer membrane, taped seams, detail ${i + 1}`,
  }));
  return (
    <dl>
      {rows.map((r, i) => (
        <div key={r.k} onClick={() => setOpen(i === open ? null : i)}>
          <dt>{r.k}</dt>
          <dd>{r.v}{open === i ? " (selected)" : ""}</dd>
        </div>
      ))}
    </dl>
  );
}
