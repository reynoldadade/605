export const dynamic = "force-dynamic";

import { getProduct, getReviews, getRecommendations } from "@/lib/mock-data";

export default async function NoSuspensePage() {
  const [product, reviews, recommendations] = await Promise.all([
    getProduct("1"),
    getReviews("1"),
    getRecommendations("1"),
  ]);

  return (
    <article>
      <h1>{product.name}</h1>
      <section>
        <h2>Reviews</h2>
        <ul>{reviews.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
      <section>
        <h2>Recommendations</h2>
        <ul>{recommendations.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
    </article>
  );
}
