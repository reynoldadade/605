"use client";

import { useState } from "react";
import { ReviewComposer } from "./ReviewComposer";

// The draft lives here now, next to the only components that read it.
export function LocalReviewComposer() {
  const [draft, setDraft] = useState("");
  const [rating, setRating] = useState(5);
  return (
    <ReviewComposer
      draft={draft}
      onDraftChange={setDraft}
      rating={rating}
      onRatingChange={setRating}
    />
  );
}
