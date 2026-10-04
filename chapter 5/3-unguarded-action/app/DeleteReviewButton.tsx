"use client";

import { useState, useTransition } from "react";

export default function DeleteReviewButton({
  reviewId,
  action,
}: {
  reviewId: string;
  action: (reviewId: string) => Promise<{ status: string; message?: string } | void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();

  return (
    <>
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await action(reviewId);
            setMessage(result && "message" in result ? result.message : undefined);
          })
        }
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {message && <span role="status"> {message}</span>}
    </>
  );
}
