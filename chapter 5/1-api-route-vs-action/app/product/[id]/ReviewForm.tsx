// Server Component, no directive
import { submitReview } from "./actions";

export default function ReviewForm({ productId }: { productId: string }) {
  const submitForThisProduct = submitReview.bind(null, productId);

  return (
    <form action={submitForThisProduct}>
      <select name="rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <textarea name="text" />
      <button type="submit">Post review</button>
    </form>
  );
}
