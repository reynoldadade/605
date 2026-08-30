// app/ProductReviews.tsx
//
// A genuine Server Component: async, doing real server-only I/O
// (getReviews). This file is never imported by Modal.tsx — it is
// imported and rendered by page.tsx, a Server Component, and only the
// resolved output crosses into Modal's `children` slot. Modal.tsx
// could be deleted and rewritten from scratch without this file, or
// the data fetch it depends on, needing to change at all.
import { getReviews } from "../lib/mock-data";

export default async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await getReviews(productId);

  return (
    <div>
      <h2>Reviews</h2>
      {reviews.map((r) => (
        <div className="review" key={r.id}>
          <p className="review__stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
          <p className="review__body">{r.body}</p>
          <p className="review__author">{r.author}</p>
        </div>
      ))}
    </div>
  );
}
