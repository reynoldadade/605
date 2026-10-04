"use client";

import { useFormStatus } from "react-dom";

// Alternative to useOptimistic for a form whose action is the Server
// Action itself: while the enclosing form is submitting, useFormStatus
// exposes the FormData being sent, which is everything a provisional
// review needs. The form keeps working without JavaScript.
export default function PendingReview() {
  const { pending, data } = useFormStatus();
  if (!pending || !data) return null;

  return (
    <article className="review review--pending" aria-busy="true" data-testid="pending-review">
      <p>{"★".repeat(Number(data.get("rating")))}</p>
      <p>{String(data.get("text") ?? "")}</p>
      <p className="review__status">Posting...</p>
    </article>
  );
}
