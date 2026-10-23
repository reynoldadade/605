"use client";

import { useState } from "react";
import { ReviewItem, type Review } from "./ReviewItem";

// Section 3: plain code, no useMemo, useCallback, or React.memo.
export function ReviewList({ reviews, minRating }: { reviews: Review[]; minRating: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = reviews.filter((r) => r.rating >= minRating);
  const shown = expanded ? visible : visible.slice(0, 3);

  return (
    <section>
      <ul>{shown.map((r) => <ReviewItem key={r.id} review={r} />)}</ul>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? "Show fewer" : "Show all"}
      </button>
    </section>
  );
}
