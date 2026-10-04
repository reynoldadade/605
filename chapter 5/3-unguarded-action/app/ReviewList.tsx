import { getReviews } from "@/lib/reviews";
import type { SessionUser } from "@/lib/dal";
import DeleteReviewButton from "./DeleteReviewButton";

// Hiding the Delete button for other people's reviews is interface
// design, not access control. The action reference ships to the client
// either way; scripts/attack.mts calls it directly.
export default async function ReviewList({
  productId,
  user,
  deleteAction,
}: {
  productId: string;
  user: SessionUser | null;
  deleteAction: (reviewId: string) => Promise<{ status: string; message?: string } | void>;
}) {
  const reviews = await getReviews(productId);
  return (
    <>
      <h2>Reviews ({reviews.length})</h2>
      {reviews.map((r) => (
        <div key={r.id} className="review" data-testid="review">
          <p>{"★".repeat(r.rating)} {r.author?.name ?? "Anonymous"} <span className="muted">({r.id})</span></p>
          <p>{r.text}</p>
          {user && (user.role === "admin" || r.authorId === user.userId) && (
            <DeleteReviewButton reviewId={r.id} action={deleteAction} />
          )}
        </div>
      ))}
    </>
  );
}
