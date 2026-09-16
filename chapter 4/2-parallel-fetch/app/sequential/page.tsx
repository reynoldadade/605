export const dynamic = "force-dynamic";

import { getProduct, getReviews } from "@/lib/mock-data";

export default async function SequentialPage() {
  const start = Date.now();
  const product = await getProduct("1");
  const reviews = await getReviews("1");
  const elapsed = Date.now() - start;

  return (
    <article>
      <h1>{product.name} (sequential)</h1>
      <p>{reviews.length} reviews</p>
      <p style={{ color: "#888" }}>Server-side elapsed: {elapsed}ms</p>
    </article>
  );
}
