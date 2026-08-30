// app/after/TableShell.tsx
//
// A thin Client Component that hosts one small piece of interactivity,
// a "show all rows" toggle, around Server Component content it
// receives as `children` without ever importing or executing it. The
// same composition Modal/ProductReviews used earlier in this chapter
// (see ../../4-modal-children/).
"use client";

import { useState } from "react";

export default function TableShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="table-shell">
      <div className={expanded ? undefined : "table-clamped"}>{children}</div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? "Show fewer rows" : "Show all rows"}
      </button>
    </section>
  );
}
