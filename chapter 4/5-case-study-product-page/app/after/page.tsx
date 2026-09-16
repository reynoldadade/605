export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getProduct } from "@/lib/products";
import { getReviews } from "@/lib/reviews";
import { getRecommendations } from "@/lib/recommendations";
import Reviews from "./Reviews";
import Recommendations from "./Recommendations";

export default async function ProductPage() {
  const id = "1";
  const product = await getProduct(id);

  // Fired here, not awaited here — Reviews and Recommendations each
  // own their `await` once the promise reaches them.
  const reviewsPromise = getReviews(id);
  const recommendationsPromise = getRecommendations(id);

  if (!product) return <p>Not found</p>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price} — {product.stock} in stock</p>
      <section>
        <h2>Reviews</h2>
        <Suspense fallback={<p>Loading reviews...</p>}>
          <Reviews promise={reviewsPromise} />
        </Suspense>
      </section>
      <section>
        <h2>Recommendations</h2>
        <Suspense fallback={<p>Loading recommendations...</p>}>
          <Recommendations promise={recommendationsPromise} />
        </Suspense>
      </section>
    </div>
  );
}
