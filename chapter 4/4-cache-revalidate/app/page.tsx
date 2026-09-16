export const dynamic = "force-dynamic";

import { getReviews } from "@/lib/reviews";
import { addReview } from "./actions";

export default async function ReviewsPage() {
  const { reviews, fetchedAt } = await getReviews();

  return (
    <main>
      <h1>Reviews (cached, 8s revalidate window)</h1>
      <p style={{ color: "#888" }}>
        This list was fetched (and cached) at <code>{fetchedAt}</code>.
        Reload this page repeatedly within 8 seconds and that timestamp
        stays the same — you're seeing the cached result, not a fresh
        query. After 8 seconds, the next reload gets the stale value
        once more while a fresh fetch happens in the background, and
        the reload after that shows a new timestamp.
      </p>
      <ul>
        {reviews.map((r) => (
          <li key={r.id}>{r.text}</li>
        ))}
      </ul>
      <form action={addReview}>
        <input type="text" name="text" placeholder="Add a review" />
        <button type="submit">Submit</button>
      </form>
      <p style={{ color: "#888" }}>
        Submitting a review calls <code>revalidateTag(&quot;reviews&quot;)</code>{" "}
        immediately — reload right after submitting and the timestamp
        changes right away, without waiting for the 8-second window.
      </p>
    </main>
  );
}
