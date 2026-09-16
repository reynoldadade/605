export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getProduct } from "@/lib/mock-data";
import Reviews from "./Reviews";
import Recommendations from "./Recommendations";

export default async function ProgressivePage() {
  const product = await getProduct("1");

  return (
    <article>
      <h1>{product.name}</h1>
      <section>
        <h2>Reviews</h2>
        <Suspense fallback={<p>Loading reviews...</p>}>
          <Reviews productId="1" />
        </Suspense>
      </section>
      <section>
        <h2>Recommendations</h2>
        <Suspense fallback={<p>Loading recommendations...</p>}>
          <Recommendations productId="1" />
        </Suspense>
      </section>
    </article>
  );
}
