import { Suspense } from "react";
import { getProduct, getReviews } from "@/lib/reviews";
import ApiReviewForm from "./ApiReviewForm";

export default function ApiVersionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main>
      <p className="muted">Before: Route Handler + fetch</p>
      <Suspense fallback={<p>Loading product...</p>}>
        <Product params={params} />
      </Suspense>
    </main>
  );
}

async function Product({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, reviews] = await Promise.all([getProduct(id), getReviews(id)]);
  if (!product) return <p>Product not found.</p>;

  return (
    <article>
      <h1>{product.name}</h1>
      <ApiReviewForm productId={product.id} />
      <h2>Reviews ({reviews.length})</h2>
      {reviews.map((r) => (
        <div key={r.id} className="review" data-testid="review">
          <p>{"★".repeat(r.rating)} {r.author?.name ?? "Anonymous"}</p>
          <p>{r.text}</p>
        </div>
      ))}
    </article>
  );
}
