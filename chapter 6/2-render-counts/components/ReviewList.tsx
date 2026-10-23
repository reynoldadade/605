"use client";

import { useState } from "react";
import type { Review } from "@/lib/catalog";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const [minRating, setMinRating] = useState(1);
  const visible = reviews.filter((r) => r.rating >= minRating);

  return (
    <section>
      <label>
        Minimum rating{" "}
        <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
        </select>
      </label>
      {visible.map((r) => <ReviewItem key={r.id} review={r} />)}
    </section>
  );
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <article className="review">
      <Stars value={review.rating} />
      <p>{review.text}</p>
      <small>{review.author}</small>
    </article>
  );
}

function Stars({ value }: { value: number }) {
  return <span aria-label={`${value} of 5`}>{"★".repeat(value)}{"☆".repeat(5 - value)}</span>;
}
