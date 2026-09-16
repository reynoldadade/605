export const dynamic = "force-dynamic";

import { getProduct, getReviews } from "@/lib/mock-data";
import Reviews from "./Reviews";

export default async function PromisePassingPage() {
  const start = Date.now();
  // Fired immediately, not awaited here — already in flight while
  // getProduct is awaited on the next line.
  const reviewsPromise = getReviews("1");
  const product = await getProduct("1");
  const productElapsed = Date.now() - start;

  return (
    <article>
      <h1>{product.name} (promise-passing)</h1>
      <p style={{ color: "#888" }}>
        Parent's own await finished at {productElapsed}ms — Reviews
        below still owns its own await, but reviewsPromise was already
        in flight, so the page's total tracks max(300, 500) = 500ms.
      </p>
      <Reviews reviewsPromise={reviewsPromise} />
    </article>
  );
}
