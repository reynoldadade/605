import { Suspense } from "react";
import { getProduct, getReviews } from "@/lib/reviews";
import ReviewForm from "./ReviewForm";
import { submitReview } from "./actions";

export async function generateStaticParams() {
  return [{ id: "p1" }, { id: "p2" }];
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <ReviewForm action={submitReview.bind(null, id)} />
      <Suspense fallback={<p>Loading reviews...</p>}>
        <Reviews productId={id} />
      </Suspense>
    </main>
  );
}

async function Reviews({ productId }: { productId: string }) {
  const [product, reviews] = await Promise.all([getProduct(productId), getReviews(productId)]);
  if (!product) return <p>Product not found.</p>;
  return (
    <>
      <h1>{product.name}</h1>
      <p data-testid="summary">
        Average {product.ratingAverage.toFixed(2)} from {product.ratingCount} reviews
      </p>
      {reviews.map((r) => (
        <div key={r.id} className="review" data-testid="review">
          <p>{"★".repeat(r.rating)} {r.author?.name ?? "Anonymous"}</p>
          <p>{r.text}</p>
        </div>
      ))}
    </>
  );
}
