export const dynamic = "force-dynamic";

import { getProduct, getReviews } from "@/lib/mock-data";

export default async function ParallelPage() {
  const start = Date.now();
  const [product, reviews] = await Promise.all([
    getProduct("1"),
    getReviews("1"),
  ]);
  const elapsed = Date.now() - start;

  return (
    <article>
      <h1>{product.name} (parallel)</h1>
      <p>{reviews.length} reviews</p>
      <p style={{ color: "#888" }}>Server-side elapsed: {elapsed}ms</p>
    </article>
  );
}
