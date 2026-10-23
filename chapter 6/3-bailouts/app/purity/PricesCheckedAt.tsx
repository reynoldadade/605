"use client";

import { useState } from "react";

const formatTime = (ms: number) => new Date(ms).toISOString().slice(11, 23);

// Breaks the purity rule: reads the clock during render. Without the
// compiler the time changes on every render. With it, the time depends on
// nothing reactive, so it's computed once and cached forever.
export function PricesCheckedAt() {
  const [renders, setRenders] = useState(0);
  const renderedAt = Date.now();

  return (
    <section>
      <p id="checked-at">Prices checked at {formatTime(renderedAt)}</p>
      <button onClick={() => setRenders(renders + 1)}>Re-render ({renders})</button>
    </section>
  );
}
