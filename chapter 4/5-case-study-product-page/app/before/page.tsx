export const dynamic = "force-dynamic";

import { getProduct } from "@/lib/products";
import { getReviews } from "@/lib/reviews";
import { getRecommendations } from "@/lib/recommendations";

export default async function ProductPage() {
  const id = "1";
  const product = await getProduct(id);
  const reviews = await getReviews(id);
  const recommendations = await getRecommendations(id);

  if (!product) return <p>Not found</p>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price} — {product.stock} in stock</p>
      <section>
        <h2>Reviews</h2>
        <ul>{reviews.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
      <section>
        <h2>Recommendations</h2>
        <ul>{recommendations.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
    </div>
  );
}
