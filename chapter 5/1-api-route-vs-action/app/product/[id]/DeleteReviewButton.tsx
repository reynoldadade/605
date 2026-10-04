"use client";

import { useTransition } from "react";
import { deleteReview } from "./actions";

export default function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => deleteReview(reviewId))}
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
